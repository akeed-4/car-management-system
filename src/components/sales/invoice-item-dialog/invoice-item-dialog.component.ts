import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-invoice-item-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './invoice-item-dialog.component.html',
})
export class InvoiceItemDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<InvoiceItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      quantity: [data.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [data.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  confirm() {
    if (this.form.valid) {
      this.dialogRef.close({
        confirmed: true,
        quantity: this.form.value.quantity,
        unitPrice: this.form.value.unitPrice,
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
