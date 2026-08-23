import { ChangeDetectionStrategy, Component, effect, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../../../services/supplier.service';
import { Supplier } from '../../../../models/supplier.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@/src/services/notification.service';
import { NationalAddressService } from '../../../../services/national-address.service';
import { Country, Region, City, District } from '../../../../models/national-address.model';
import { postalCodeValidators, buildingNumberValidators } from '../../../../models/national-address-validators';

/** Section id -> the form control names it contains, used to auto-expand + scroll to whichever
 *  collapsed section holds the first invalid control on a failed submit. Keep in sync with the
 *  panels in supplier-form.component.html. */
const SECTION_FIELDS: Record<string, string[]> = {
  basic: ['name', 'crNumber', 'taxNumber', 'supplierCategory'],
  contact: ['phone', 'phone2', 'email', 'website'],
  address: ['city', 'district', 'postalCode', 'address', 'countryId', 'regionId', 'cityId', 'districtId', 'buildingNumber', 'streetName'],
  contactPerson: ['contactPerson', 'contactPersonPhone', 'contactPersonEmail'],
  financial: ['paymentTerms', 'creditLimit'],
  banking: ['bankName', 'bankAccountNumber', 'iban'],
  additional: ['notes', 'isActive'],
};

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private fb = inject(FormBuilder);
  private translateService = inject(TranslateService);
  private notificationService = inject(NotificationService);
  private nationalAddressService = inject(NationalAddressService);
  supplierForm!: FormGroup;
  supplier = signal<Partial<Supplier>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة مورد جديد');

  // Requirement 7: National Address dependent dropdowns.
  countries = signal<Country[]>([]);
  regions = signal<Region[]>([]);
  cities = signal<City[]>([]);
  districts = signal<District[]>([]);

  /** "Basic Info" (name/CR number/category) starts open since it's filled first; the rest start
   *  collapsed to cut initial scroll. Sections toggle independently (multi: true). */
  expandedSections = signal<Set<string>>(new Set(['basic']));

  isSectionExpanded(section: string): boolean {
    return this.expandedSections().has(section);
  }

  toggleSection(section: string, expanded: boolean): void {
    this.expandedSections.update(set => {
      const next = new Set(set);
      if (expanded) next.add(section); else next.delete(section);
      return next;
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.setupNationalAddressCascade();

    // Check if editing existing supplier
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات المورد');
      this.supplierService.getSupplierById(id).subscribe(existingSupplier => {
        this.supplier.set({ ...existingSupplier });
        this.supplierForm.patchValue(existingSupplier);
        this.preloadNationalAddressChain(existingSupplier.countryId, existingSupplier.regionId, existingSupplier.cityId);
      }, error => {
        console.error('Error loading supplier:', error);
        this.router.navigate(['/entities/suppliers']);
      });
    }
  }

  /** Requirement 7: wires the Country -> Region -> City -> District cascade -- see
   *  CustomerFormComponent's identical method for the full rationale. */
  private setupNationalAddressCascade(): void {
    this.nationalAddressService.getCountries().subscribe(countries => this.countries.set(countries));

    this.supplierForm.get('countryId')?.valueChanges.subscribe((countryId: number | null) => {
      this.regions.set([]);
      this.cities.set([]);
      this.districts.set([]);
      this.supplierForm.patchValue({ regionId: null, cityId: null, districtId: null }, { emitEvent: false });
      if (countryId) {
        this.nationalAddressService.getRegions(countryId).subscribe(regions => this.regions.set(regions));
      }
    });

    this.supplierForm.get('regionId')?.valueChanges.subscribe((regionId: number | null) => {
      this.cities.set([]);
      this.districts.set([]);
      this.supplierForm.patchValue({ cityId: null, districtId: null }, { emitEvent: false });
      if (regionId) {
        this.nationalAddressService.getCities(regionId).subscribe(cities => this.cities.set(cities));
      }
    });

    this.supplierForm.get('cityId')?.valueChanges.subscribe((cityId: number | null) => {
      this.districts.set([]);
      this.supplierForm.patchValue({ districtId: null }, { emitEvent: false });
      if (cityId) {
        this.nationalAddressService.getDistricts(cityId).subscribe(districts => this.districts.set(districts));
      }
    });
  }

  private preloadNationalAddressChain(countryId?: number | null, regionId?: number | null, cityId?: number | null): void {
    if (countryId) {
      this.nationalAddressService.getRegions(countryId).subscribe(regions => this.regions.set(regions));
    }
    if (regionId) {
      this.nationalAddressService.getCities(regionId).subscribe(cities => this.cities.set(cities));
    }
    if (cityId) {
      this.nationalAddressService.getDistricts(cityId).subscribe(districts => this.districts.set(districts));
    }
  }

  private initializeForm() {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      crNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      taxNumber: [''],
      phone: ['', [Validators.required, ]],
      phone2: [''],
      email: ['', [Validators.email]],
      website: [''],
      address: ['', Validators.required],
      city: [''],
      district: [''],
      postalCode: ['', postalCodeValidators],
      countryId: [null],
      regionId: [null],
      cityId: [null],
      districtId: [null],
      buildingNumber: ['', buildingNumberValidators],
      streetName: [''],
      contactPerson: [''],
      contactPersonPhone: [''],
      contactPersonEmail: ['', [Validators.email]],
      paymentTerms: ['Net 30'],
      creditLimit: [null, [Validators.min(0)]],
      bankName: [''],
      bankAccountNumber: [''],
      iban: [''],
      supplierCategory: ['Parts'],
      notes: [''],
      isActive: [true]
    });
  }

  saveSupplier() {
    if (this.supplierForm.valid) {
      const formValue = this.supplierForm.value;
      const currentDate = new Date().toISOString();

      if (this.editMode()) {
        const updatedSupplier: Supplier = {
          ...this.supplier(),
          ...formValue,
          lastUpdated: currentDate
        } as Supplier;
        this.supplierService.updateSupplier(updatedSupplier).subscribe({
          next: () => {
            this.supplierForm.reset();
            this.supplierForm.markAsPristine();
            this.notificationService.showSuccess(this.translateService.instant('TOAST.UPDATE_SUCCESS'));
          },
          error: (error) => {
            console.error('Failed to update supplier:', error);
          }
        });
      } else {
        const newSupplier: Omit<Supplier, 'id'> = {
          ...formValue,
          isActive: true,
          createdDate: currentDate,
          lastUpdated: currentDate
        };
        this.supplierService.addSupplier(newSupplier).subscribe({
          next: () => {
            this.supplierForm.reset();
            this.supplierForm.markAsPristine();
            this.notificationService.showSuccess(this.translateService.instant('TOAST.ADD_SUCCESS'));
          },
          error: (error) => {
            console.error('Failed to add supplier:', error);
          }
        });
      }
      // this.router.navigate(['/entities/suppliers']);
    } else {
      this.supplierForm.markAllAsTouched();
      this.expandInvalidSectionAndScroll();
      this.notificationService.showWarning(this.translateService.instant('TOAST.VALIDATION_ERROR'));
    }
  }

  /** Finds the first collapsed section containing an invalid control, expands it, and scrolls
   *  its header into view -- a validation error must never be silently hidden behind a collapsed
   *  panel. Runs on failed submit only; markAllAsTouched() (called just before this) is what makes
   *  the mat-error text actually render once the panel opens. */
  private expandInvalidSectionAndScroll(): void {
    const invalidSection = Object.entries(SECTION_FIELDS).find(([, fields]) =>
      fields.some(f => this.supplierForm.get(f)?.invalid)
    )?.[0];
    if (!invalidSection) return;

    this.toggleSection(invalidSection, true);
    // The panel's expand animation/content needs a real paint before it has a height to scroll
    // to -- a microtask fires before that, so this waits a frame instead.
    requestAnimationFrame(() => {
      document.getElementById(`supplier-section-${invalidSection}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}