import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { openCreateAccountDialog } from '../../accounting/create-account-dialog.helper';

export interface PartyAccountRequiredData {
  partyRole: 'customer' | 'supplier';
  partyId: number;
  partyName: string;
}

export type PartyAccountRequiredResult = 'linked' | 'change' | 'cancel';

/** Shared warning shown wherever a document form's selected Customer/Supplier has no linked
 *  Accounts Receivable/Payable account for a credit transaction -- see
 *  party-account-required-warning.helper.ts, the single place this dialog is opened from. Never
 *  duplicate this dialog inline in a screen. Mirrors
 *  store-accounting-setup-warning-dialog.component.ts exactly, generalized to a party instead of a
 *  store, with a "Link Account" action that opens the existing Chart-of-Accounts quick-add dialog
 *  pre-filled for this exact customer/supplier instead of only pointing the user at another
 *  screen. */
@Component({
  selector: 'app-party-account-required-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './party-account-required-dialog.component.html',
  styleUrl: './party-account-required-dialog.component.css',
})
export class PartyAccountRequiredDialogComponent {
  linking = false;

  constructor(
    private dialogRef: MatDialogRef<PartyAccountRequiredDialogComponent, PartyAccountRequiredResult>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PartyAccountRequiredData
  ) {}

  linkAccount(): void {
    this.linking = true;
    const quickAddData = this.data.partyRole === 'customer'
      ? { entityType: 'customer' as const, customerId: this.data.partyId, customerName: this.data.partyName }
      : { entityType: 'supplier' as const, supplierId: this.data.partyId, supplierName: this.data.partyName };

    openCreateAccountDialog(this.dialog, quickAddData).subscribe((created) => {
      this.linking = false;
      if (created) {
        this.dialogRef.close('linked');
      }
      // Cancelled the nested quick-add dialog -- stay open so the user can retry or give up via
      // the existing Change/Cancel actions below.
    });
  }

  change(): void {
    this.dialogRef.close('change');
  }

  cancel(): void {
    this.dialogRef.close('cancel');
  }
}
