import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { RetailPaymentDetails, RetailPaymentMethod } from '../../../../../models/retail/retail-invoice.model';

@Component({
  selector: 'app-payment-gateway-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './payment-gateway-form.component.html',
  styleUrls: ['./payment-gateway-form.component.css']
})
export class PaymentGatewayFormComponent implements OnInit, OnChanges {
  @Input() amountDue = 0;
  @Output() paymentChange = new EventEmitter<RetailPaymentDetails | null>();

  form: FormGroup;
  methods: { value: RetailPaymentMethod; labelKey: string }[] = [
    { value: 'Cash', labelKey: 'RETAIL.PAYMENT_METHOD_CASH' },
    { value: 'Card', labelKey: 'RETAIL.PAYMENT_METHOD_CARD' },
    { value: 'Bank Transfer', labelKey: 'RETAIL.PAYMENT_METHOD_BANK_TRANSFER' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      method: ['Cash', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      reference: [''],
      hash: ['']
    });
  }

  ngOnInit(): void {
    this.form.get('method')?.valueChanges.subscribe(method => this.applyMethodValidators(method));
    this.applyMethodValidators(this.form.value.method);
    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['amountDue']) {
      this.form.patchValue({ amount: this.amountDue }, { emitEvent: false });
      this.emitChange();
    }
  }

  private applyMethodValidators(method: RetailPaymentMethod): void {
    const referenceCtrl = this.form.get('reference');
    const hashCtrl = this.form.get('hash');

    if (method === 'Cash') {
      referenceCtrl?.clearValidators();
      hashCtrl?.clearValidators();
    } else if (method === 'Card') {
      referenceCtrl?.setValidators([Validators.required]);
      hashCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      referenceCtrl?.setValidators([Validators.required]);
      hashCtrl?.setValidators([Validators.required]);
    }

    referenceCtrl?.updateValueAndValidity({ emitEvent: false });
    hashCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  get isCash(): boolean {
    return this.form.value.method === 'Cash';
  }

  private emitChange(): void {
    this.paymentChange.emit(this.form.valid ? (this.form.value as RetailPaymentDetails) : null);
  }
}
