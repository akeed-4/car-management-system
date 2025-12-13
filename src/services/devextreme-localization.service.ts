import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { locale, loadMessages } from 'devextreme/localization';

@Injectable({
  providedIn: 'root'
})
export class DevExtremeLocalizationService {

  constructor(private translateService: TranslateService) {
    this.initializeDevExtremeLocalization();
  }

  private initializeDevExtremeLocalization() {
    // Load Arabic messages
    const arabicMessages = {
      'ar': {
        'Yes': 'نعم',
        'No': 'لا',
        'Cancel': 'إلغاء',
        'OK': 'موافق',
        'Clear': 'مسح',
        'Done': 'تم',
        'Loading': 'جارٍ التحميل...',
        'Select': 'اختر',
        'Search': 'بحث',
        'Back': 'رجوع',
        'Info': 'معلومات',
        'Warning': 'تحذير',
        'Error': 'خطأ',
        'Confirmation': 'تأكيد',
        'Save': 'حفظ',
        'Edit': 'تعديل',
        'Delete': 'حذف',
        'Add': 'إضافة',
        'Export': 'تصدير',
        'Import': 'استيراد',
        'Refresh': 'تحديث',
        'Filter': 'تصفية',
        'Sort': 'ترتيب',
        'Group': 'تجميع',
        'Ungroup': 'إلغاء التجميع',
        'Sort Ascending': 'ترتيب تصاعدي',
        'Sort Descending': 'ترتيب تنازلي',
        'Columns': 'الأعمدة',
        'Rows': 'الصفوف',
        'All': 'الكل',
        'Contains': 'يحتوي على',
        'Starts with': 'يبدأ بـ',
        'Ends with': 'ينتهي بـ',
        'Equals': 'يساوي',
        'Not equals': 'لا يساوي',
        'Less than': 'أقل من',
        'Less than or equal to': 'أقل من أو يساوي',
        'Greater than': 'أكبر من',
        'Greater than or equal to': 'أكبر من أو يساوي',
        'Between': 'بين',
        'Not between': 'ليس بين',
        'And': 'و',
        'Or': 'أو',
        'Apply': 'تطبيق',
        'Reset': 'إعادة تعيين',
        'Close': 'إغلاق',
        'Today': 'اليوم',
        'Yesterday': 'أمس',
        'Tomorrow': 'غداً',
        'Last 7 days': 'آخر 7 أيام',
        'Last 30 days': 'آخر 30 يوم',
        'Last month': 'الشهر الماضي',
        'This month': 'هذا الشهر',
        'Next month': 'الشهر القادم',
        'Last year': 'العام الماضي',
        'This year': 'هذا العام',
        'Next year': 'العام القادم',
        'dxDataGrid-emptyHeaderFilterIndicatorField': 'حقل',
        'dxDataGrid-emptyHeaderFilterIndicatorFilter': 'تصفية',
        'dxDataGrid-headerFilterEmptyValue': 'قيمة فارغة',
        'dxDataGrid-headerFilterIndicatorField': 'حقل: {0}',
        'dxDataGrid-headerFilterIndicatorLabel': 'تصفية الأعمدة',
        'dxDataGrid-headerFilterOK': 'موافق',
        'dxDataGrid-headerFilterCancel': 'إلغاء',
        'dxDataGrid-filterRowShowAllText': '(الكل)',
        'dxDataGrid-filterRowResetOperationText': 'إعادة تعيين',
        'dxDataGrid-filterRowOperationEquals': 'يساوي',
        'dxDataGrid-filterRowOperationNotEquals': 'لا يساوي',
        'dxDataGrid-filterRowOperationLess': 'أقل من',
        'dxDataGrid-filterRowOperationLessOrEquals': 'أقل من أو يساوي',
        'dxDataGrid-filterRowOperationGreater': 'أكبر من',
        'dxDataGrid-filterRowOperationGreaterOrEquals': 'أكبر من أو يساوي',
        'dxDataGrid-filterRowOperationStartsWith': 'يبدأ بـ',
        'dxDataGrid-filterRowOperationContains': 'يحتوي على',
        'dxDataGrid-filterRowOperationNotContains': 'لا يحتوي على',
        'dxDataGrid-filterRowOperationEndsWith': 'ينتهي بـ',
        'dxDataGrid-filterRowOperationBetween': 'بين',
        'dxDataGrid-filterRowOperationNotBetween': 'ليس بين',
        'dxDataGrid-groupPanelEmptyText': 'اسحب عموداً هنا للتجميع حسب ذلك العمود',
        'dxDataGrid-noDataText': 'لا توجد بيانات',
        'dxDataGrid-searchPanelPlaceholder': 'بحث...',
        'dxDataGrid-columnChooserTitle': 'اختيار الأعمدة',
        'dxDataGrid-columnChooserEmptyText': 'اسحب عموداً هنا لإخفائه',
        'dxDataGrid-groupContinuesMessage': 'استمرار من الصفحة السابقة',
        'dxDataGrid-groupContinuedMessage': 'استمرار إلى الصفحة التالية',
        'dxDataGrid-editingEditRow': 'تعديل',
        'dxDataGrid-editingSaveRowChanges': 'حفظ',
        'dxDataGrid-editingCancelRowChanges': 'إلغاء',
        'dxDataGrid-editingDeleteRow': 'حذف',
        'dxDataGrid-editingUndeleteRow': 'إلغاء الحذف',
        'dxDataGrid-editingConfirmDeleteMessage': 'هل أنت متأكد من حذف هذا السجل؟',
        'dxDataGrid-editingConfirmDeleteTitle': 'تأكيد الحذف',
        'dxDataGrid-validationRequired': 'مطلوب',
        'dxDataGrid-validationEmail': 'بريد إلكتروني غير صحيح',
        'dxDataGrid-validationNumeric': 'يجب أن يكون رقماً',
        'dxDataGrid-pagerInfoText': 'صفحة {0} من {1} ({2} عنصر)',
        'dxDataGrid-pagerPagesCountText': 'من',
        'dxDataGrid-pagerPrevPage': 'السابق',
        'dxDataGrid-pagerNextPage': 'التالي',
        'dxDataGrid-pagerFirstPage': 'الأولى',
        'dxDataGrid-pagerLastPage': 'الأخيرة',
        'dxDataGrid-pagerPageSize': 'عناصر في الصفحة: {0}',
        'dxDataGrid-pagerShowAllText': 'الكل',
        'dxDataGrid-exportTo': 'تصدير',
        'dxDataGrid-exportToExcel': 'تصدير إلى Excel',
        'dxDataGrid-exportToPdf': 'تصدير إلى PDF',
        'dxDataGrid-exporting': 'جارٍ التصدير...',
        'dxDataGrid-excelFormat': 'ملف Excel',
        'dxDataGrid-pdfFormat': 'ملف PDF',
        'dxDataGrid-selectedRows': 'الصفوف المحددة: {0}',
        'dxDataGrid-summaryMin': 'الحد الأدنى: {0}',
        'dxDataGrid-summaryMax': 'الحد الأقصى: {0}',
        'dxDataGrid-summarySum': 'المجموع: {0}',
        'dxDataGrid-summaryCount': 'العدد: {0}',
        'dxDataGrid-summaryAvg': 'المتوسط: {0}',
        'dxDataGrid-columnFixingFix': 'تثبيت',
        'dxDataGrid-columnFixingUnfix': 'إلغاء التثبيت',
        'dxDataGrid-columnFixingLeftPosition': 'إلى اليسار',
        'dxDataGrid-columnFixingRightPosition': 'إلى اليمين',
        'dxDataGrid-stateStoringSaving': 'جارٍ الحفظ...',
        'dxDataGrid-stateStoringLoading': 'جارٍ التحميل...'
      }
    };

    // Load English messages
    const englishMessages = {
      'en': {
        'dxDataGrid-emptyHeaderFilterIndicatorField': 'Field',
        'dxDataGrid-emptyHeaderFilterIndicatorFilter': 'Filter',
        'dxDataGrid-headerFilterEmptyValue': 'Empty value',
        'dxDataGrid-headerFilterIndicatorField': 'Field: {0}',
        'dxDataGrid-headerFilterIndicatorLabel': 'Column filters',
        'dxDataGrid-headerFilterOK': 'OK',
        'dxDataGrid-headerFilterCancel': 'Cancel',
        'dxDataGrid-filterRowShowAllText': '(All)',
        'dxDataGrid-filterRowResetOperationText': 'Reset',
        'dxDataGrid-filterRowOperationEquals': 'Equals',
        'dxDataGrid-filterRowOperationNotEquals': 'Does not equal',
        'dxDataGrid-filterRowOperationLess': 'Less than',
        'dxDataGrid-filterRowOperationLessOrEquals': 'Less than or equal to',
        'dxDataGrid-filterRowOperationGreater': 'Greater than',
        'dxDataGrid-filterRowOperationGreaterOrEquals': 'Greater than or equal to',
        'dxDataGrid-filterRowOperationStartsWith': 'Starts with',
        'dxDataGrid-filterRowOperationContains': 'Contains',
        'dxDataGrid-filterRowOperationNotContains': 'Does not contain',
        'dxDataGrid-filterRowOperationEndsWith': 'Ends with',
        'dxDataGrid-filterRowOperationBetween': 'Between',
        'dxDataGrid-filterRowOperationNotBetween': 'Not between',
        'dxDataGrid-groupPanelEmptyText': 'Drag a column header here to group by that column',
        'dxDataGrid-noDataText': 'No data',
        'dxDataGrid-searchPanelPlaceholder': 'Search...',
        'dxDataGrid-columnChooserTitle': 'Column Chooser',
        'dxDataGrid-columnChooserEmptyText': 'Drag a column here to hide it',
        'dxDataGrid-groupContinuesMessage': 'Continues on the next page',
        'dxDataGrid-groupContinuedMessage': 'Continued from the previous page',
        'dxDataGrid-editingEditRow': 'Edit',
        'dxDataGrid-editingSaveRowChanges': 'Save',
        'dxDataGrid-editingCancelRowChanges': 'Cancel',
        'dxDataGrid-editingDeleteRow': 'Delete',
        'dxDataGrid-editingUndeleteRow': 'Undelete',
        'dxDataGrid-editingConfirmDeleteMessage': 'Are you sure you want to delete this record?',
        'dxDataGrid-editingConfirmDeleteTitle': 'Confirm Delete',
        'dxDataGrid-validationRequired': 'Required',
        'dxDataGrid-validationEmail': 'Invalid email',
        'dxDataGrid-validationNumeric': 'Must be a number',
        'dxDataGrid-pagerInfoText': 'Page {0} of {1} ({2} items)',
        'dxDataGrid-pagerPagesCountText': 'of',
        'dxDataGrid-pagerPrevPage': 'Previous',
        'dxDataGrid-pagerNextPage': 'Next',
        'dxDataGrid-pagerFirstPage': 'First',
        'dxDataGrid-pagerLastPage': 'Last',
        'dxDataGrid-pagerPageSize': 'Items per page: {0}',
        'dxDataGrid-pagerShowAllText': 'All',
        'dxDataGrid-exportTo': 'Export',
        'dxDataGrid-exportToExcel': 'Export to Excel',
        'dxDataGrid-exportToPdf': 'Export to PDF',
        'dxDataGrid-exporting': 'Exporting...',
        'dxDataGrid-excelFormat': 'Excel file',
        'dxDataGrid-pdfFormat': 'PDF file',
        'dxDataGrid-selectedRows': 'Selected rows: {0}',
        'dxDataGrid-summaryMin': 'Min: {0}',
        'dxDataGrid-summaryMax': 'Max: {0}',
        'dxDataGrid-summarySum': 'Sum: {0}',
        'dxDataGrid-summaryCount': 'Count: {0}',
        'dxDataGrid-summaryAvg': 'Avg: {0}',
        'dxDataGrid-columnFixingFix': 'Fix',
        'dxDataGrid-columnFixingUnfix': 'Unfix',
        'dxDataGrid-columnFixingLeftPosition': 'To the left',
        'dxDataGrid-columnFixingRightPosition': 'To the right',
        'dxDataGrid-stateStoringSaving': 'Saving...',
        'dxDataGrid-stateStoringLoading': 'Loading...'
      }
    };

    // Load messages for both languages
    loadMessages(arabicMessages);
    loadMessages(englishMessages);

    // Set initial locale based on current language
    const currentLang = this.translateService.currentLang || this.translateService.getDefaultLang() || 'en';
    this.setDevExtremeLocale(currentLang);

    // Listen to language changes
    this.translateService.onLangChange.subscribe(lang => {
      this.setDevExtremeLocale(lang.lang);
    });
  }

  private setDevExtremeLocale(language: string) {
    const localeMap: { [key: string]: string } = {
      'ar': 'ar',
      'en': 'en'
    };

    const dxLocale = localeMap[language] || 'en';
    locale(dxLocale);
  }

  public refreshLocale() {
    const currentLang = this.translateService.currentLang || this.translateService.getDefaultLang() || 'en';
    this.setDevExtremeLocale(currentLang);
  }
}