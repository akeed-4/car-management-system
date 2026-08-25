import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { HasPermissionDirective } from '../permission.directive';

export interface StoreAccountingSetupWarningData {
  storeName: string;
}

export type StoreAccountingSetupWarningResult = 'configure' | 'change' | 'cancel';

/** Shared warning shown wherever a document form's selected Store has no active
 *  StoreAccountingConfiguration -- see store-accounting-setup-warning.helper.ts, the single
 *  place this dialog is opened from. Never duplicate this dialog inline in a screen. */
@Component({
  selector: 'app-store-accounting-setup-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule, HasPermissionDirective],
  templateUrl: './store-accounting-setup-warning-dialog.component.html',
  styleUrl: './store-accounting-setup-warning-dialog.component.css',
})
export class StoreAccountingSetupWarningDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<StoreAccountingSetupWarningDialogComponent, StoreAccountingSetupWarningResult>,
    @Inject(MAT_DIALOG_DATA) public data: StoreAccountingSetupWarningData
  ) {}

  configure(): void {
    this.dialogRef.close('configure');
  }

  change(): void {
    this.dialogRef.close('change');
  }

  cancel(): void {
    this.dialogRef.close('cancel');
  }
}
