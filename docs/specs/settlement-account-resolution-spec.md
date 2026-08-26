# Implementation Spec — Settlement-Aware Party Account Resolution & Validation

**Audience:** Backend team (ASP.NET API — repo external to `car-management-system`)
**Scope driver:** Cash transactions must not require Customer AR / Supplier AP. Credit/Term transactions must.
**Frontend repo:** `car-management-system` (this spec's contracts were extracted from it)
**Status:** Analysis deliverable — no code changes made in the frontend repo (see §13)

---

## 0. Investigation summary (evidence from the frontend repo)

| # | Question (per task §16) | Finding |
|---|---|---|
| 1 | Where is Supplier AP validated? | **Backend only.** Zero client-side checks in the Angular app. The purchase invoice form no longer sends any account IDs — comment in `purchase-invoice.component.ts:674`: *"No debitAccountId/creditAccountId controls: the backend always derives both accounts (Store's inventory accounting configuration, Supplier's linked account)"*. The rejection of a cash purchase when the supplier has no linked AP account therefore happens in the backend derivation/validation step. |
| 2 | Where is Customer AR validated? | **Backend only.** Sales invoice form (`sales-invoice-form.component.ts`) contains no AR resolution or requirement logic; it sends customer + settlement info only. |
| 3 | Where are inventory/store accounts resolved? | Backend-side via **Store accounting configuration** (frontend manages it at `setup/store-accounting-configurations`, service `store-accounting-configuration.service.ts`). The purchase invoice already relies entirely on this server-side derivation. Reuse it — do not add a parallel mechanism. |
| 4 | Document posting services | All posting is initiated by frontend HTTP calls to the external API (see §2 contract inventory). Journal-entry creation itself is fully server-side. |
| 5 | Uses of AccountResolutionService | Referenced in the frontend only as documentation of server behavior (`bank-invoice-form.component.html:133`: *"Debit/Credit GL accounts are DERIVED server-side … see AccountResolutionService"*). It is the correct single source of truth to extend. |
| 6 | Duplicated resolution logic | None found client-side. On the backend, audit each document posting service for private "resolve supplier/customer account" helpers and fold them into AccountResolutionService (§4). |
| 7 | CASH vs CREDIT indicators sent by the frontend | §2 — every document type already transmits an explicit settlement discriminator. |
| 8 | Journal-entry creation per document | Server-side, out of frontend visibility. This spec fixes the *inputs* the engine receives and the *rules* it must apply (§4–§6). |

## 1. Problem statement

Today the posting pipeline requires the counterparty's AR/AP ledger account unconditionally.

- **Cash purchase** with a supplier that has no configured AP account → rejected with
  *"Accounts Payable account is not configured for the selected supplier"*, even though the
  correct entry needs no AP at all:

```
Dr Inventory            100,000
    Cr Cash / Bank      100,000   <- user-selected payment account
```

- The same defect class applies to every party-bearing document (sales, returns, POS, etc.).

### 1.1 Root cause (precise failure chain)

1. The Purchase Invoice form no longer sends `debitAccountId`/`creditAccountId`
   (`purchase-invoice.component.ts`: *"the backend always derives both accounts"*). This is correct
   architecture — do not revert it.
2. On posting, the backend derives the **credit leg** of the purchase entry from the
   **supplier's linked Accounts Payable account** without first asking *"is this document cash?"*.
3. When the supplier has no linked AP account, the unconditional requirement fails and posting is
   rejected — even though a CASH purchase's credit leg is Cash/Bank, not AP, so the supplier link
   is never actually needed for the entry.
4. Root cause in one sentence: **the settlement nature of the document (CASH vs CREDIT) is not an
   input to the party-account resolution step**, so AP/AR is demanded even when the party has no
   ledger role in the resulting journal entry.

Fix locus: the central resolution/policy layer (`AccountResolutionService` + the shared posting
validator), driven by the settlement discriminator that already arrives on every request (§3).


## 2. Frontend <-> backend contract inventory (verified in code)

These are the real endpoints/payloads the backend owns; the settlement field already arrives
on each request, so **no breaking contract change is required**.

| Document | Endpoint (method) | Settlement discriminator in payload |
|---|---|---|
| Purchase Invoice | `POST /Purchases/Create`, `PUT /Purchases/Update/{id}` | `paymentMethod` ("Cash", "Bank Transfer"), `paymentType`; credit implied by `dueDate`/`initialPayment` |
| Purchase Return | purchase-return service (`PurchaseReturnType = 'CASH' \| 'CREDIT'`) | explicit `type` |
| Sales Invoice (retail/corporate/bank) | sales invoice services | `SaleType` enum (`'cash' \| 'credit' \| 'installments'`, `models/sales-enhancements.model.ts`) and `paymentMethod` ('Cash' \| 'Bank Transfer' \| 'Finance') |
| Sales Return | `sales-return-form` reads `?type=cash` query param | `isCashReturn` -> paymentMethod 'Cash' vs 'Credit' |
| Installment Sale | installments invoice component | `SaleType.Installments` (+ installment schedule) |
| Consignment Sale | `POST /api/ConsignmentSales/Sell` | always settles commission via user-selected accounts (see §5 matrix row) |
| Receipts / Payments / Deposits | voucher services | inherently cash-settlement documents |

> Note: several list screens filter with the literal strings `'Cash'` / `'Credit'`. The backend
> should normalize these into one canonical enum internally (§3) rather than string-matching.

## 3. Canonical settlement classification

Introduce (or reuse) ONE enum in the domain layer:

```csharp
public enum SettlementType { Cash, Credit, Term /* Term == Credit for AR/AP purposes */ }
```

Classification rule per document — single mapping function, e.g.
`DocumentSettlementClassifier.Classify(documentType, rawPaymentMethod, dueDate?)`:

- `Cash`, `Bank Transfer`, `Card`, `Check` settled immediately -> **Cash**
- `Credit`, `Net-N`, deferred due date, `Installments` -> **Credit**
- Documents with no party at all (manual journal entries, opening balances) -> N/A

## 4. Central rule — AccountResolutionService stays the single source of truth

Extend the existing service; do **not** add checks inside controllers or per-document services.

```csharp
public sealed record PartyAccountRequirement(
    bool PartyAccountRequired,   // true => missing AR/AP must REJECT posting
    AccountRole Role,            // AccountsReceivable | AccountsPayable
    string ErrorCode);           // see section 6

public PartyAccountRequirement ResolvePartyAccountRequirement(
    DocumentType documentType,
    SettlementType settlement)
{
    bool isSalesFamily = IsSalesFamily(documentType);

    return settlement switch
    {
        // CASH: the party never enters the journal entry -> nothing to resolve, nothing to require.
        SettlementType.Cash => new PartyAccountRequirement(false, AccountRole.None, null),

        // CREDIT/TERM: the party IS the settlement leg -> AR/AP mandatory.
        SettlementType.Credit or SettlementType.Term => new PartyAccountRequirement(
            PartyAccountRequired: true,
            Role: isSalesFamily ? AccountRole.AccountsReceivable : AccountRole.AccountsPayable,
            ErrorCode: isSalesFamily ? AccountErrorCodes.CustomerArRequiredForCredit
                                     : AccountErrorCodes.SupplierApRequiredForCredit),
        _ => throw new ArgumentOutOfRangeException(nameof(settlement))
    };
}
```

Flow when `PartyAccountRequired == true` (CREDIT):
1. Look up the party's linked AR/AP account (existing supplier/customer -> account link).
2. If absent -> fail with the specific error code (§6). No fallback guessing.

Flow when `PartyAccountRequired == false` (CASH):
1. Skip party lookup entirely.
2. Use the **Payment Account** supplied by the caller (validated per §5) as the settlement leg.
3. Inventory/Expense and Revenue legs keep resolving through the existing Store/item/company
   configuration chain — unchanged.

## 5. Payment / offset account and required-account matrix

**Payment account (CASH documents):**
- Accept an optional-but-validated `paymentAccountId` on cash document DTOs where the workflow
  exposes selection (cash purchase, cash sale, POS, cash returns).
- Direction is decided by the accounting engine, never by the label:
  - Cash purchase -> `Dr Inventory/Expense, Cr PaymentAccount`
  - Cash sale -> `Dr PaymentAccount, Cr Revenue`
  - Cash returns -> reversed accordingly
- If a workflow has a deterministic default (e.g. a single active cash account), resolve it
  server-side; otherwise require selection and reject with `ACCOUNT_PAYMENT_ACCOUNT_REQUIRED`.

| Document family | Settlement | Supplier AP | Customer AR | Payment account | Inventory/Store acct | Revenue acct |
|---|---|---|---|---|---|---|
| Purchase Invoice | Cash | optional | — | **required*** | required (existing store config chain) | — |
| Purchase Invoice | Credit | **REQUIRED** | — | not used | required | — |
| Sales Invoice / POS | Cash | — | optional | **required*** | n/a or existing rules | required |
| Sales Invoice | Credit / Installments | — | **REQUIRED** | not used | — | required |
| Sales Return | Cash | — | optional | required* | required (return-to-store) | required (reversal) |
| Sales Return | Credit | — | **REQUIRED** | not used | required | required |
| Purchase Return | Cash | optional | — | required* | required | — |
| Purchase Return | Credit | **REQUIRED** | — | not used | required | — |
| Receipt Voucher | always cash-in | — | resolves customer settlement AR | source account required | — | — |
| Payment Voucher | always cash-out | resolves supplier settlement AP | — | target account required | — | — |
| Credit / Debit Notes | follow base document | same rule as base | same rule as base | per base doc | per base doc | per base doc |
| Corporate / Bank Financing Sales | usually Credit (per terms) | — | REQUIRED unless genuinely cash | per doc | per doc | required |
| Consignment Sale | commission entry | owner payable stays REQUIRED (genuine liability, independent of cash/credit) | — | debit account required | — | commission revenue required |
| Orders (SO/PO) | no posting today | unchanged | unchanged | unchanged | unchanged | unchanged |

\* Only when the document's actual entry contains a cash/settlement leg AND the workflow has no
deterministic server-resolvable default.

## 6. Error contract (machine-readable + exact user-facing texts)

Replace prose-only failures with stable codes carried in the existing `{ success, message, data }`
envelope (the frontend already unwraps it). `message` MUST use exactly these business texts:

```
CODE                                   message (exact)
------------------------------------   --------------------------------------------------------------
ACCOUNT_PAYMENT_ACCOUNT_REQUIRED       "Cash account is required for cash purchase posting."
                                       (sales family: "Cash/Bank account is required for cash sale posting.")
ACCOUNT_SUPPLIER_AP_REQUIRED_CREDIT    "Accounts Payable account is not configured for the selected supplier."
ACCOUNT_CUSTOMER_AR_REQUIRED_CREDIT    "Accounts Receivable account is not configured for the selected customer."
ACCOUNT_PAYMENT_ACCOUNT_INVALID        "The selected payment account is invalid."
ACCOUNT_PAYMENT_ACCOUNT_INACTIVE       "The selected payment account is inactive."
ACCOUNT_PAYMENT_ACCOUNT_WRONG_TENANT   "The selected payment account does not belong to your company."
ACCOUNT_NOT_POSTABLE                   "The selected account cannot be posted to (parent/non-postable)."
ACCOUNT_INVENTORY_UNAVAILABLE          "No inventory account could be resolved for the selected store/item."  // keep existing fallback chain first
```

Validation behavior per case (replaces the unconditional "Supplier account is required"):

| Case | Party AR/AP missing | Cash/Bank account missing |
|---|---|---|
| CASH PURCHASE | **VALID** (not needed) | INVALID -> `ACCOUNT_PAYMENT_ACCOUNT_REQUIRED` |
| CREDIT PURCHASE | INVALID -> `ACCOUNT_SUPPLIER_AP_REQUIRED_CREDIT`; **never silently fall back to Cash/Bank** | not required for initial posting |
| CASH SALE | **VALID** (not needed) | INVALID -> `ACCOUNT_PAYMENT_ACCOUNT_REQUIRED` |
| CREDIT SALE | INVALID -> `ACCOUNT_CUSTOMER_AR_REQUIRED_CREDIT` | not required |

Rules:
- Never surface raw exceptions/stack traces; map to the envelope with HTTP 400 + code.
- Codes are stable keys; the frontend maps them to localized text (Arabic/English) later.
- Remove the unconditional *"AP account is not configured for the selected supplier"* failure from
  all CASH paths — it becomes unreachable once §4 is implemented.

## 7. Server-side validation pipeline (every posted document, every account reference)

One shared validator invoked by the posting pipeline for **every** account reference
(party, payment, inventory, revenue), regardless of origin (derived or user-selected):

1. Exists in the chart of accounts.
2. `IsActive`.
3. Belongs to the current company/tenant.
4. `IsPostable` (not a parent/group header).
5. Compatible with the role it plays (AR/AP/payment/inventory/revenue).
6. Currency-compatible where the account is currency-locked.

Never trust account IDs from the frontend beyond treating them as a *request*; re-validate
everything above server-side.

## 8. Concurrency

- Auto-resolved accounts: resolve **inside the posting transaction**, not at DTO-mapping time,
  so two concurrent posts cannot bind different/stale accounts.
- Follow the existing next-code generation precedent (`accounts/next-code`: compute at save
  time, never reserve early).

## 9. Backward compatibility checklist

- [ ] No changes to historical journal entries or already-posted documents.
- [ ] No DB column renames; no changes to Store/Warehouse entity names ("Store" terminology kept).
- [ ] Existing store accounting configuration remains THE inventory-account source.
- [ ] Suppliers/customers with linked AP/AR keep working identically for credit flows.
- [ ] Old clients that omit `paymentAccountId` on cash documents: apply the deterministic default;
      only reject with `ACCOUNT_PAYMENT_ACCOUNT_REQUIRED` when no safe default exists.
- [ ] Genuine validations (credit AR/AP, postability, tenant checks) stay enforced.

## 10. Automated test matrix (backend test project)

```
TC01 Purchase Cash   + supplier without AP          => SUCCESS (entry: Dr Inv / Cr PaymentAcct)
TC02 Purchase Credit + supplier without AP          => FAIL  ACCOUNT_SUPPLIER_AP_REQUIRED_CREDIT
TC03 Purchase Credit + supplier with AP             => SUCCESS (Cr supplier AP)
TC04 Sales Cash      + customer without AR          => SUCCESS (Dr PaymentAcct / Cr Revenue)
TC05 Sales Credit    + customer without AR          => FAIL  ACCOUNT_CUSTOMER_AR_REQUIRED_CREDIT
TC06 Sales Credit    + customer with AR             => SUCCESS (Dr customer AR)
TC07 Sales Return Cash/Credit                       => mirror TC04-TC06 (directions reversed)
TC08 Purchase Return Cash/Credit                    => mirror TC01-TC03
TC09 Cash doc + non-existent payment account        => FAIL  ACCOUNT_PAYMENT_ACCOUNT_INVALID
TC10 Cash doc + inactive payment account            => FAIL  ACCOUNT_PAYMENT_ACCOUNT_INACTIVE
TC11 Cash doc + payment account of another tenant   => FAIL  ACCOUNT_PAYMENT_ACCOUNT_WRONG_TENANT
TC12 Cash doc + parent/non-postable payment account => FAIL  ACCOUNT_NOT_POSTABLE
TC13 Cash doc + omitted paymentAccountId, no default=> FAIL  ACCOUNT_PAYMENT_ACCOUNT_REQUIRED
TC14 Cash doc + omitted paymentAccountId, default ok=> SUCCESS (server-resolved)
TC15 Store inventory account unavailable            => follow existing fallback/resolution chain (assert documented behavior)
TC16 Installment sale                               => treated as Credit (AR required at inception)
TC17 Concurrent cash purchases, same payment acct   => both post; entries balanced (no stale-resolution race)
TC18 Historical posted document re-read             => byte-identical journal entry (no retro change)
TC19 Cash purchase with VAT                         => VAT posting lines unchanged vs current behavior; entry still balanced
TC20 Every successful posting above                 => total Debit == total Credit (journal balancing invariant)
TC21 Cash sale revenue classification               => revenue account resolved by existing classification logic, not by payment account
```

Implement TC01–TC06 as ONE parameterized test suite against the shared validator and reuse it
for every posting service — the matrix is written once, not per controller.

## 11. Frontend follow-up (separate small PR — NOT done in this repo yet)

Once the backend ships §6 codes and optional `paymentAccountId`:
1. Map error codes -> localized messages via one central interceptor/mapping (no per-component logic).
2. Show a neutral **"Payment Account \*"** selector (number + name) ONLY on cash variants of the
   affected forms; hide it entirely for credit variants. Constraints:
   - Options come from a dedicated backend endpoint (e.g. `accounts/postable?role=PaymentAccount`)
     that returns only active, postable, current-tenant **Cash/Bank-classified** accounts —
     never the full GL.
   - The value is a *hint*: the backend re-validates classification/tenant/postability before
     posting (§7) and may override with its deterministic default when permitted.
   - Do NOT restore generic `debitAccountId`/`creditAccountId` inputs anywhere; the existing
     server-side derivation stays authoritative for inventory, revenue, COGS, tax and party legs.
3. Nothing else — party AR/AP handling stays entirely server-driven.

## 12. Why no frontend code was changed for this task

- The offending validation lives exclusively server-side (§0 findings 1–2).
- Adding speculative client-side "skip AP when cash" logic would duplicate accounting rules inside
  components — explicitly forbidden by the task ("backend must be the final authority").
- The single genuine client-side party-account requirement found (Consignment owner-payable,
  `consignment-sale-dialog.component.ts:87`) is a real liability leg independent of settlement
  type — correctly left untouched.

## 13. Suggested rollout order

1. Add `SettlementType` + classifier + extend `AccountResolutionService` behind the shared validator.
2. Flip the purchase invoice CASH path first (highest-reported pain), optionally behind a config flag.
3. Apply to remaining document families via the shared validator (no per-service edits).
4. Ship the §6 error codes; then coordinate the small frontend PR (§11).




