import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sales-contract',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './sales-contract.component.html',
  styleUrls: ['./sales-contract.component.css']
})
export class SalesContractComponent {
  @Input() contractControl!: FormControl<string | null>;
  @Input() isEditable: boolean = true;
  @Input() isApproved: boolean = false;
  @Output() approveContract = new EventEmitter<void>();

  onApprove(): void {
    this.approveContract.emit();
  }
}