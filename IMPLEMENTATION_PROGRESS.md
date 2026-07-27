# Implementation Progress

Tracks the gap-audit punch list identified on 2026-07-27 across both repos:
- Frontend: `b:\car-web\car-management-system`
- Backend: `b:\Api\carSystemApi` (branch `refactor/clean-architecture`)

No prior backlog/requirements doc existed in either repo; this list was built by
a full-repo audit for stubs, `NotImplementedException`, TODOs, and orphaned
frontend/backend pairs. Priority order below reflects severity, not any external
deadline.

## Status

- [x] **Purchase Request List — action buttons & approval workflow** (user-directed,
      2026-07-27, superseded the audit's default priority order). The Approve/Reject
      buttons called a `PATCH .../UpdateStatus/{id}` endpoint that never existed on
      the backend (404 on every click) and Reject collected no reason despite the
      backend requiring one; the PO-screen "eligible requests" lookup pointed at a
      nonexistent `/GetEligibleForPo` route too. Fixed: service now calls the real
      `/approve` and `/reject` endpoints, Reject prompts for a reason via
      `confirmAlertWithInput`, added a Delete button (new, was entirely missing) with
      confirm dialog, all four row actions (Edit/Approve/Reject/Delete) are now
      permission-gated via `PermissionService` + DevExtreme `[visible]` predicates
      (`purchaseRequest.edit/approve/reject/delete`), `GetAll`/`Create` responses are
      now correctly unwrapped from their `ApiResponse<T>` envelope instead of relying
      on loose `any` typing. Backend: added status guards so Approve/Reject can't
      double-fire on an already-Approved/Rejected request, and Delete now refuses to
      remove an Approved request or one already partially converted into a PO
      (checks `OrderedQuantity`). Backend builds clean (0 errors), frontend builds
      clean, Jest suite passes except one pre-existing unrelated failure
      (`CashReturnInvoiceListComponent` — broken DI in its own test harness, not
      touched by this change). Not committed yet — see files listed via `git status`
      in both repos.
- [x] **Crash-path repos** — `PurchaseOfferItemRepository` (was: every method threw
      `NotImplementedException`, shadowing a working base implementation) and
      `UnitOfWork.StockTakeApprovals` (was: threw directly instead of using the
      already-injected, already-DI-registered `StockTakeApprovalRepository`).
      Fixed, backend builds clean (0 errors). Commit `6c17764` on
      `refactor/clean-architecture`.
- [ ] **Hardcoded `CreatedBy`/`UserId` audit trail** — ~20 files across Sales,
      Purchasing, Accounting controllers/services hardcode `1` or `"System"`
      instead of the authenticated user. Breaks audit-log integrity and any
      per-user financial reporting. Not started.
- [ ] **ZATCA e-invoicing** — `ZatcaInvoiceGenerator.cs` has hardcoded placeholder
      company name/VAT (lines ~19, 31, 86, 90); no Angular frontend consumes
      `ZatcaController`'s endpoints at all. Legally sensitive (KSA e-invoicing
      requirement) — needs real company/VAT config input before implementation.
      Not started.
- [ ] **`environment.production.ts` placeholder origin** — still points at
      `https://yoursite.smarterasp.net/`; would ship broken in a prod build.
      Not started.
- [ ] **Orphaned `GoodsReceiptNotesController`** — fully built backend endpoint,
      zero frontend consumer. Not started.
- [ ] **`AccountService.cs:467`** — child account levels not recalculated
      recursively when parent account level changes. Not started.
- [ ] **Test coverage** — only 10 backend spec files against 60+ controllers;
      only 2 non-boilerplate frontend spec files. Not started.
- [ ] **Cosmetic TODOs** — receipt-voucher outstanding-balance calc is a stub,
      VIN Excel import is a no-op, two purchase-return-list delete buttons just
      `alert()`, report-container may use mock data. Not started.
- [ ] **Migration drift check** — entities touched ~2 days after latest migration
      (`Car`, `ConsignmentCar`, `ConsignmentSale`, `Tenant`,
      `PurchaseAdditionalCost*`, `IUnitOfWork`). Needs a `dotnet ef migrations add
      --dry-run`-style check before next deploy. Not started.

## Next up

Awaiting direction on which item to tackle next (audit trail wiring, ZATCA,
prod config, or something else from the list).
