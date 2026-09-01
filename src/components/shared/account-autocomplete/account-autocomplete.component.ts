import { ChangeDetectionStrategy, Component, Input, forwardRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Account } from '../../accounting/models';

/**
 * Drop-in ControlValueAccessor replacement for the plain `<mat-select>` of postable accounts
 * repeated across every accounting-adjacent form (Payment/Receipt/Deposit vouchers, Purchase
 * Invoice, Journal Entries, ...). Same already-fetched `Account[]` list
 * (AccountingService.getPostableAccounts()) -- this only adds client-side code/name filtering, no
 * new backend call. Binds like any other formControlName holding an accountId.
 */
@Component({
  selector: 'app-account-autocomplete',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  templateUrl: './account-autocomplete.component.html',
  styleUrl: './account-autocomplete.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AccountAutocompleteComponent),
    multi: true,
  }],
})
export class AccountAutocompleteComponent implements ControlValueAccessor {
  protected translate = inject(TranslateService);

  private accountsSignal = signal<Account[]>([]);
  @Input({ required: true })
  set accounts(value: Account[] | null) {
    this.accountsSignal.set(value ?? []);
    // The list can arrive/refresh after a value was already written (e.g. async load on init) --
    // keep the visible label in sync with whichever account id is currently selected.
    const id = this.selectedAccountId();
    if (id != null) this.searchText.set(this.displayFor(id));
  }
  get accounts(): Account[] { return this.accountsSignal(); }

  @Input() label = '';
  @Input() required = false;
  @Input() hint = '';

  searchText = signal('');
  selectedAccountId = signal<number | null>(null);
  isDisabled = signal(false);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  filteredAccounts = computed(() => {
    const term = this.searchText().trim().toLowerCase();
    const list = this.accountsSignal();
    if (!term) return list;
    return list.filter(a =>
      a.accountCode?.toLowerCase().includes(term) ||
      a.accountNameEn?.toLowerCase().includes(term) ||
      a.accountNameAr?.toLowerCase().includes(term)
    );
  });

  nameFor(account: Account): string {
    const name = this.translate.currentLang === 'ar' ? (account.accountNameAr || account.accountNameEn) : account.accountNameEn;
    return `${account.accountCode} - ${name}`;
  }

  private displayFor(id: number): string {
    const acc = this.accountsSignal().find(a => a.id === id);
    return acc ? this.nameFor(acc) : '';
  }

  onInput(value: string): void {
    this.searchText.set(value);
    // Typing invalidates a previously confirmed selection until a fresh option is chosen.
    if (this.selectedAccountId() != null) {
      this.selectedAccountId.set(null);
      this.onChange(null);
    }
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as number;
    this.selectedAccountId.set(id);
    this.searchText.set(this.displayFor(id));
    this.onChange(id);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
    // No confirmed match on blur -- snap the text back to the last real selection (or empty).
    const id = this.selectedAccountId();
    this.searchText.set(id != null ? this.displayFor(id) : '');
  }

  writeValue(value: number | null): void {
    this.selectedAccountId.set(value);
    this.searchText.set(value != null ? this.displayFor(value) : '');
  }

  registerOnChange(fn: (value: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
