# Report: How the System Calculates Cost Price on a Purchase Invoice

> Scope: based on the Angular frontend in this repository (`d:\car-management-system`). The calculation engine itself lives in the external backend (`http://localhost:5003`, see `proxy.conf.json`), so server-side formulas are described from the contracts the frontend exposes.

---

## 1. Overview — three layers of "cost"

| Layer | What it represents | Where it lives |
|---|---|---|
| **1. Invoice line cost** | Price agreed with the supplier per vehicle on the purchase invoice | `PurchaseInvoice.items[]` (`InvoiceItem.unitPrice`, `lineTotal`) |
| **2. Vehicle (car) cost** | Vehicle's inventory cost = purchase price + additional costs + associated expenses | `Car.purchasePrice`, `Car.additionalCosts`, `Car.totalCost` |
| **3. Company cost method** | Global rule deciding *which* cost components count as cost | `CostPriceCalculationSettings` (Setup → Cost Price Settings) |

Final **landed cost** reported per car = `purchasePrice + additionalCosts + associatedCostsTotal` (see `src/models/reportmodel/car-reports.config.ts:66-71`).

---

## 2. Layer 1 — Purchase Invoice line cost

- Each purchase invoice line is a vehicle (`InvoiceItem` in `src/models/invoice-item.model.ts`):
  - `quantity` (typically 1 per VIN)
  - `unitPrice` — the cost price entered/agreed on the invoice
  - `lineTotal = unitPrice × quantity`
- The invoice carries `totalAmount`, `vatAmount`, and optionally `subtotal` (VAT-exclusive amount, only populated for profit-margin-VAT cars).
- **Auction purchases**: when bought through an auction provider (BCA, Copart, Manheim…), `auctionCharges[]` (BuyerFee, GateFee, TransportFee, …) are summed into `auctionChargesTotal` — a convenience field, not persisted separately (`src/models/purchase-invoice.model.ts:61-74`).

## 3. Layer 2 — Vehicle cost build-up

Per-car cost is accumulated in three buckets (`src/components/inventory/inventory-form/inventory-form.component.ts:150-154`):

```
calculatedTotalCost = purchasePrice            // from the purchase invoice line
                    + additionalCosts          // manual extra costs on the car record
                    + associatedExpenses       // expenses linked to the car (expense service)
```

`Car.totalCost` "represents the true total cost including linked expenses" (`src/models/car.model.ts:44-46`).

## 4. Purchase Additional Costs (the allocation engine)

Additional cost documents (`src/models/purchase-additional-cost.model.ts`) are attached to a **specific purchase invoice** (`purchaseInvoiceId`) and spread their `amount` across the invoice's vehicles.

- **Expense categories**: `Insurance | Customs | Shipping | Freight | Handling | Registration | Other`
- **Allocation methods** (`AllocationMethod`), chosen in `purchase-additional-cost-form` (default = `Cost`):

  | Method | Basis |
  |---|---|
  | `Equal` | Same amount per vehicle |
  | `Quantity` | Pro-rata to line quantities |
  | `Cost` | Pro-rata to each car's purchase cost |
  | `Weight` | Pro-rata to vehicle weight |
  | `Manual` | User enters amounts per line; lines **must sum to the document amount** |

- Allocation is computed **server-side**: `GET /PurchaseAdditionalCost/PreviewAllocation` (`src/services/purchase-additional-cost.service.ts:35-41`) returns per-car lines `{ carId, allocationBasis, allocatedAmount }`; manual entries go through `POST /PreviewManualAllocation` for validation.
- **Capitalization flag** (`isCapitalized`, default true):
  - `true` → the allocated amount is **capitalized into the allocated cars' inventory value** (increases their cost).
  - `false` → posted as a **period expense**; no inventory-value effect.
- Only **Posted** documents take effect; Draft/Cancelled do not.

## 5. Layer 3 — Company Cost Price Calculation Settings

Stored per company via backend API `CostPriceCalculationSettings` (`src/services/setting.service.ts:69-84`), managed at route `/setup/cost-price-settings` (`src/components/setup/cost-price-calculation/cost-price-calculation-settings.component.ts`).

Model: `src/models/cost-price-calculation-setting.model.ts`.

- **Calculation methods** (enum `CostPriceCalculationMethod`):

  | Value | Meaning | Offered in UI? |
  |---|---|---|
  | `FULL_COST` (Total Purchase Cost) | Include **all** expenses (shipping, customs, insurance, handling, etc.) | ✅ default |
  | `AVERAGE_COST` (Weighted Average Cost) | Weighted average cost of inventory | ✅ |
  | `PURCHASE_PRICE` | Purchase price only | legacy rows only |
  | `PURCHASE_PLUS_SHIPPING` | Purchase price + shipping | legacy rows only |
  | `FIFO` / `LIFO` / `STANDARD_COST` | — | legacy rows only (kept so existing rows keep working) |

- **Component toggles** (which expenses are *included* in cost): `includeShippingCost`, `includeCustomsDuties`, `includeInsurance`, `includeHandlingFees`, `includeOtherExpenses`. The component auto-enables/disables these based on the chosen method (`updateCostComponentsState`, lines 93-127).
- **Markup & VAT**: `defaultMarkupPercentage` (0-100) and `applyVAT` + `vatPercentage` (default 15%).
- **Scope note** (settings page, i18n `en.json:4064`): *"The selected calculation method will apply to all **new** sales and purchase invoices; existing invoices will not be affected."*

## 6. Accounting effect

- Purchase invoice posts: **Dr Inventory** (`PurchaseInvoiceDebit` document type = 13, account from the **Store accounting configuration**) / **Cr Supplier AP** (credit purchase) or **Cr Cash/Bank** (cash purchase). Both legs are derived server-side; only the debit account is user-selectable (`src/components/accounting/accounting.service.ts:30-32`, `docs/specs/settlement-account-resolution-spec.md`).
- Capitalized additional costs debit the store's **absorption account** (`additionalCostAccountId`, falling back to `inventoryAccountId`); non-capitalized costs debit the category expense account (Freight/Customs/… or `purchaseExpenseAccountId`) — `src/models/store-accounting-configuration.model.ts:13-18`.

## 7. End-to-end flow summary

1. Purchase invoice created with vehicle lines at `unitPrice` (+ auction charges if any).
2. Vehicle inventory record gets `purchasePrice` from the invoice line.
3. Additional-cost documents (customs, shipping, …) allocate their amount to the invoice's vehicles (Equal/Quantity/Cost/Weight/Manual); capitalized amounts raise each vehicle's inventory cost.
4. Car cost = `purchasePrice + additionalCosts + associatedExpenses` → reported as **landed cost**.
5. The company-level Cost Price Calculation Settings determine which components count as cost for **new** documents (Full Cost vs Weighted Average) and optionally apply markup/VAT.

## 8. Limitations of this report

- Exact formulas for `AVERAGE_COST`, `FIFO`, `LIFO` etc. are implemented in the backend (external, port 5003) and are **not visible** in this repo; the frontend only sends/receives the settings and preview results.
- Actual allocation math (rounding, remainder handling) is likewise server-side; the frontend only displays the returned preview lines.

