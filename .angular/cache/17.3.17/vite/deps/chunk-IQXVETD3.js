import {
  config_default,
  dependency_injector_default,
  each,
  errors_default,
  escapeRegExp,
  extend,
  format,
  humanize,
  init_common,
  init_config,
  init_console,
  init_dependency_injector,
  init_errors,
  init_extend,
  init_inflector,
  init_iterator,
  init_string,
  init_type,
  isExponential,
  isPlainObject,
  isString,
  logger,
  map
} from "./chunk-6XC77YAX.js";
import {
  __esm,
  __export
} from "./chunk-WOR4A3D2.js";

// node_modules/devextreme/esm/localization/cldr-data/parent_locales.js
var parent_locales_default;
var init_parent_locales = __esm({
  "node_modules/devextreme/esm/localization/cldr-data/parent_locales.js"() {
    parent_locales_default = {
      "en-150": "en-001",
      "en-AG": "en-001",
      "en-AI": "en-001",
      "en-AU": "en-001",
      "en-BB": "en-001",
      "en-BM": "en-001",
      "en-BS": "en-001",
      "en-BW": "en-001",
      "en-BZ": "en-001",
      "en-CC": "en-001",
      "en-CK": "en-001",
      "en-CM": "en-001",
      "en-CX": "en-001",
      "en-CY": "en-001",
      "en-DG": "en-001",
      "en-DM": "en-001",
      "en-ER": "en-001",
      "en-FJ": "en-001",
      "en-FK": "en-001",
      "en-FM": "en-001",
      "en-GB": "en-001",
      "en-GD": "en-001",
      "en-GG": "en-001",
      "en-GH": "en-001",
      "en-GI": "en-001",
      "en-GM": "en-001",
      "en-GY": "en-001",
      "en-HK": "en-001",
      "en-IE": "en-001",
      "en-IL": "en-001",
      "en-IM": "en-001",
      "en-IN": "en-001",
      "en-IO": "en-001",
      "en-JE": "en-001",
      "en-JM": "en-001",
      "en-KE": "en-001",
      "en-KI": "en-001",
      "en-KN": "en-001",
      "en-KY": "en-001",
      "en-LC": "en-001",
      "en-LR": "en-001",
      "en-LS": "en-001",
      "en-MG": "en-001",
      "en-MO": "en-001",
      "en-MS": "en-001",
      "en-MT": "en-001",
      "en-MU": "en-001",
      "en-MV": "en-001",
      "en-MW": "en-001",
      "en-MY": "en-001",
      "en-NA": "en-001",
      "en-NF": "en-001",
      "en-NG": "en-001",
      "en-NR": "en-001",
      "en-NU": "en-001",
      "en-NZ": "en-001",
      "en-PG": "en-001",
      "en-PK": "en-001",
      "en-PN": "en-001",
      "en-PW": "en-001",
      "en-RW": "en-001",
      "en-SB": "en-001",
      "en-SC": "en-001",
      "en-SD": "en-001",
      "en-SG": "en-001",
      "en-SH": "en-001",
      "en-SL": "en-001",
      "en-SS": "en-001",
      "en-SX": "en-001",
      "en-SZ": "en-001",
      "en-TC": "en-001",
      "en-TK": "en-001",
      "en-TO": "en-001",
      "en-TT": "en-001",
      "en-TV": "en-001",
      "en-TZ": "en-001",
      "en-UG": "en-001",
      "en-VC": "en-001",
      "en-VG": "en-001",
      "en-VU": "en-001",
      "en-WS": "en-001",
      "en-ZA": "en-001",
      "en-ZM": "en-001",
      "en-ZW": "en-001",
      "en-AT": "en-150",
      "en-BE": "en-150",
      "en-CH": "en-150",
      "en-DE": "en-150",
      "en-DK": "en-150",
      "en-FI": "en-150",
      "en-NL": "en-150",
      "en-SE": "en-150",
      "en-SI": "en-150",
      "hi-Latn": "en-IN",
      "es-AR": "es-419",
      "es-BO": "es-419",
      "es-BR": "es-419",
      "es-BZ": "es-419",
      "es-CL": "es-419",
      "es-CO": "es-419",
      "es-CR": "es-419",
      "es-CU": "es-419",
      "es-DO": "es-419",
      "es-EC": "es-419",
      "es-GT": "es-419",
      "es-HN": "es-419",
      "es-MX": "es-419",
      "es-NI": "es-419",
      "es-PA": "es-419",
      "es-PE": "es-419",
      "es-PR": "es-419",
      "es-PY": "es-419",
      "es-SV": "es-419",
      "es-US": "es-419",
      "es-UY": "es-419",
      "es-VE": "es-419",
      nb: "no",
      nn: "no",
      "pt-AO": "pt-PT",
      "pt-CH": "pt-PT",
      "pt-CV": "pt-PT",
      "pt-FR": "pt-PT",
      "pt-GQ": "pt-PT",
      "pt-GW": "pt-PT",
      "pt-LU": "pt-PT",
      "pt-MO": "pt-PT",
      "pt-MZ": "pt-PT",
      "pt-ST": "pt-PT",
      "pt-TL": "pt-PT",
      "az-Arab": "und",
      "az-Cyrl": "und",
      "bal-Latn": "und",
      "blt-Latn": "und",
      "bm-Nkoo": "und",
      "bs-Cyrl": "und",
      "byn-Latn": "und",
      "cu-Glag": "und",
      "dje-Arab": "und",
      "dyo-Arab": "und",
      "en-Dsrt": "und",
      "en-Shaw": "und",
      "ff-Adlm": "und",
      "ff-Arab": "und",
      "ha-Arab": "und",
      "iu-Latn": "und",
      "kk-Arab": "und",
      "ks-Deva": "und",
      "ku-Arab": "und",
      "ky-Arab": "und",
      "ky-Latn": "und",
      "ml-Arab": "und",
      "mn-Mong": "und",
      "mni-Mtei": "und",
      "ms-Arab": "und",
      "pa-Arab": "und",
      "sat-Deva": "und",
      "sd-Deva": "und",
      "sd-Khoj": "und",
      "sd-Sind": "und",
      "shi-Latn": "und",
      "so-Arab": "und",
      "sr-Latn": "und",
      "sw-Arab": "und",
      "tg-Arab": "und",
      "ug-Cyrl": "und",
      "uz-Arab": "und",
      "uz-Cyrl": "und",
      "vai-Latn": "und",
      "wo-Arab": "und",
      "yo-Arab": "und",
      "yue-Hans": "und",
      "zh-Hant": "und",
      "zh-Hant-MO": "zh-Hant-HK"
    };
  }
});

// node_modules/devextreme/esm/localization/parentLocale.js
var PARENT_LOCALE_SEPARATOR, parentLocale_default;
var init_parentLocale = __esm({
  "node_modules/devextreme/esm/localization/parentLocale.js"() {
    PARENT_LOCALE_SEPARATOR = "-";
    parentLocale_default = (parentLocales, locale2) => {
      var parentLocale = parentLocales[locale2];
      if (parentLocale) {
        return "root" !== parentLocale && parentLocale;
      }
      return locale2.substr(0, locale2.lastIndexOf(PARENT_LOCALE_SEPARATOR));
    };
  }
});

// node_modules/devextreme/esm/localization/core.js
var DEFAULT_LOCALE, core_default;
var init_core = __esm({
  "node_modules/devextreme/esm/localization/core.js"() {
    init_dependency_injector();
    init_parent_locales();
    init_parentLocale();
    DEFAULT_LOCALE = "en";
    core_default = dependency_injector_default({
      locale: /* @__PURE__ */ (() => {
        var currentLocale = DEFAULT_LOCALE;
        return (locale2) => {
          if (!locale2) {
            return currentLocale;
          }
          currentLocale = locale2;
        };
      })(),
      getValueByClosestLocale: function(getter) {
        var locale2 = this.locale();
        var value = getter(locale2);
        var isRootLocale;
        while (!value && !isRootLocale) {
          locale2 = parentLocale_default(parent_locales_default, locale2);
          if (locale2) {
            value = getter(locale2);
          } else {
            isRootLocale = true;
          }
        }
        if (void 0 === value && locale2 !== DEFAULT_LOCALE) {
          return getter(DEFAULT_LOCALE);
        }
        return value;
      }
    });
  }
});

// node_modules/devextreme/esm/localization/default_messages.js
var defaultMessages;
var init_default_messages = __esm({
  "node_modules/devextreme/esm/localization/default_messages.js"() {
    defaultMessages = {
      en: {
        Yes: "Yes",
        No: "No",
        Cancel: "Cancel",
        CheckState: "Check state",
        Close: "Close",
        Clear: "Clear",
        Done: "Done",
        Loading: "Loading...",
        Select: "Select...",
        Search: "Search",
        Back: "Back",
        OK: "OK",
        "dxCollectionWidget-noDataText": "No data to display",
        "dxDropDownEditor-selectLabel": "Select",
        "validation-required": "Required",
        "validation-required-formatted": "{0} is required",
        "validation-numeric": "Value must be a number",
        "validation-numeric-formatted": "{0} must be a number",
        "validation-range": "Value is out of range",
        "validation-range-formatted": "{0} is out of range",
        "validation-stringLength": "The length of the value is not correct",
        "validation-stringLength-formatted": "The length of {0} is not correct",
        "validation-custom": "Value is invalid",
        "validation-custom-formatted": "{0} is invalid",
        "validation-async": "Value is invalid",
        "validation-async-formatted": "{0} is invalid",
        "validation-compare": "Values do not match",
        "validation-compare-formatted": "{0} does not match",
        "validation-pattern": "Value does not match pattern",
        "validation-pattern-formatted": "{0} does not match pattern",
        "validation-email": "Email is invalid",
        "validation-email-formatted": "{0} is invalid",
        "validation-mask": "Value is invalid",
        "dxLookup-searchPlaceholder": "Minimum character number: {0}",
        "dxList-pullingDownText": "Pull down to refresh...",
        "dxList-pulledDownText": "Release to refresh...",
        "dxList-refreshingText": "Refreshing...",
        "dxList-pageLoadingText": "Loading...",
        "dxList-nextButtonText": "More",
        "dxList-selectAll": "Select All",
        "dxListEditDecorator-delete": "Delete",
        "dxListEditDecorator-more": "More",
        "dxScrollView-pullingDownText": "Pull down to refresh...",
        "dxScrollView-pulledDownText": "Release to refresh...",
        "dxScrollView-refreshingText": "Refreshing...",
        "dxScrollView-reachBottomText": "Loading...",
        "dxDateBox-simulatedDataPickerTitleTime": "Select time",
        "dxDateBox-simulatedDataPickerTitleDate": "Select date",
        "dxDateBox-simulatedDataPickerTitleDateTime": "Select date and time",
        "dxDateBox-validation-datetime": "Value must be a date or time",
        "dxDateRangeBox-invalidStartDateMessage": "Start value must be a date",
        "dxDateRangeBox-invalidEndDateMessage": "End value must be a date",
        "dxDateRangeBox-startDateOutOfRangeMessage": "Start date is out of range",
        "dxDateRangeBox-endDateOutOfRangeMessage": "End date is out of range",
        "dxDateRangeBox-startDateLabel": "Start Date",
        "dxDateRangeBox-endDateLabel": "End Date",
        "dxFileUploader-selectFile": "Select a file",
        "dxFileUploader-dropFile": "or Drop a file here",
        "dxFileUploader-bytes": "bytes",
        "dxFileUploader-kb": "KB",
        "dxFileUploader-Mb": "MB",
        "dxFileUploader-Gb": "GB",
        "dxFileUploader-upload": "Upload",
        "dxFileUploader-uploaded": "Uploaded",
        "dxFileUploader-readyToUpload": "Ready to upload",
        "dxFileUploader-uploadAbortedMessage": "Upload cancelled",
        "dxFileUploader-uploadFailedMessage": "Upload failed",
        "dxFileUploader-invalidFileExtension": "File type is not allowed",
        "dxFileUploader-invalidMaxFileSize": "File is too large",
        "dxFileUploader-invalidMinFileSize": "File is too small",
        "dxRangeSlider-ariaFrom": "From",
        "dxRangeSlider-ariaTill": "Till",
        "dxSwitch-switchedOnText": "ON",
        "dxSwitch-switchedOffText": "OFF",
        "dxForm-optionalMark": "optional",
        "dxForm-requiredMessage": "{0} is required",
        "dxNumberBox-invalidValueMessage": "Value must be a number",
        "dxNumberBox-noDataText": "No data",
        "dxDataGrid-emptyHeaderWithColumnChooserText": "Use {0} to display columns",
        "dxDataGrid-emptyHeaderWithGroupPanelText": "Drag a column from the group panel here",
        "dxDataGrid-emptyHeaderWithColumnChooserAndGroupPanelText": "Use {0} or drag a column from the group panel",
        "dxDataGrid-emptyHeaderColumnChooserText": "column chooser",
        "dxDataGrid-columnChooserTitle": "Column Chooser",
        "dxDataGrid-columnChooserEmptyText": "Drag a column here to hide it",
        "dxDataGrid-groupContinuesMessage": "Continues on the next page",
        "dxDataGrid-groupContinuedMessage": "Continued from the previous page",
        "dxDataGrid-groupHeaderText": "Group by This Column",
        "dxDataGrid-ungroupHeaderText": "Ungroup",
        "dxDataGrid-ungroupAllText": "Ungroup All",
        "dxDataGrid-editingEditRow": "Edit",
        "dxDataGrid-editingSaveRowChanges": "Save",
        "dxDataGrid-editingCancelRowChanges": "Cancel",
        "dxDataGrid-editingDeleteRow": "Delete",
        "dxDataGrid-editingUndeleteRow": "Undelete",
        "dxDataGrid-editingConfirmDeleteMessage": "Are you sure you want to delete this record?",
        "dxDataGrid-validationCancelChanges": "Cancel changes",
        "dxDataGrid-groupPanelEmptyText": "Drag a column header here to group by that column",
        "dxDataGrid-noDataText": "No data",
        "dxDataGrid-searchPanelPlaceholder": "Search...",
        "dxDataGrid-filterRowShowAllText": "(All)",
        "dxDataGrid-filterRowResetOperationText": "Reset",
        "dxDataGrid-filterRowOperationEquals": "Equals",
        "dxDataGrid-filterRowOperationNotEquals": "Does not equal",
        "dxDataGrid-filterRowOperationLess": "Less than",
        "dxDataGrid-filterRowOperationLessOrEquals": "Less than or equal to",
        "dxDataGrid-filterRowOperationGreater": "Greater than",
        "dxDataGrid-filterRowOperationGreaterOrEquals": "Greater than or equal to",
        "dxDataGrid-filterRowOperationStartsWith": "Starts with",
        "dxDataGrid-filterRowOperationContains": "Contains",
        "dxDataGrid-filterRowOperationNotContains": "Does not contain",
        "dxDataGrid-filterRowOperationEndsWith": "Ends with",
        "dxDataGrid-filterRowOperationBetween": "Between",
        "dxDataGrid-filterRowOperationBetweenStartText": "Start",
        "dxDataGrid-filterRowOperationBetweenEndText": "End",
        "dxDataGrid-ariaSearchBox": "Search box",
        "dxDataGrid-applyFilterText": "Apply filter",
        "dxDataGrid-trueText": "true",
        "dxDataGrid-falseText": "false",
        "dxDataGrid-sortingAscendingText": "Sort Ascending",
        "dxDataGrid-sortingDescendingText": "Sort Descending",
        "dxDataGrid-sortingClearText": "Clear Sorting",
        "dxDataGrid-ariaNotSortedColumn": "Not sorted column",
        "dxDataGrid-ariaSortedAscendingColumn": "Column sorted in ascending order",
        "dxDataGrid-ariaSortedDescendingColumn": "Column sorted in descending order",
        "dxDataGrid-ariaSortIndex": "Sort index {0}",
        "dxDataGrid-editingSaveAllChanges": "Save changes",
        "dxDataGrid-editingCancelAllChanges": "Discard changes",
        "dxDataGrid-editingAddRow": "Add a row",
        "dxDataGrid-summaryMin": "Min: {0}",
        "dxDataGrid-summaryMinOtherColumn": "Min of {1} is {0}",
        "dxDataGrid-summaryMax": "Max: {0}",
        "dxDataGrid-summaryMaxOtherColumn": "Max of {1} is {0}",
        "dxDataGrid-summaryAvg": "Avg: {0}",
        "dxDataGrid-summaryAvgOtherColumn": "Avg of {1} is {0}",
        "dxDataGrid-summarySum": "Sum: {0}",
        "dxDataGrid-summarySumOtherColumn": "Sum of {1} is {0}",
        "dxDataGrid-summaryCount": "Count: {0}",
        "dxDataGrid-columnFixingFix": "Fix",
        "dxDataGrid-columnFixingUnfix": "Unfix",
        "dxDataGrid-columnFixingLeftPosition": "To the left",
        "dxDataGrid-columnFixingRightPosition": "To the right",
        "dxDataGrid-exportTo": "Export",
        "dxDataGrid-exportToExcel": "Export to Excel file",
        "dxDataGrid-exporting": "Exporting...",
        "dxDataGrid-excelFormat": "Excel file",
        "dxDataGrid-selectedRows": "Selected rows",
        "dxDataGrid-exportSelectedRows": "Export selected rows to {0}",
        "dxDataGrid-exportAll": "Export all data to {0}",
        "dxDataGrid-headerFilterLabel": "Filter options",
        "dxDataGrid-headerFilterIndicatorLabel": "Show filter options for column '{0}'",
        "dxDataGrid-headerFilterEmptyValue": "(Blanks)",
        "dxDataGrid-headerFilterOK": "OK",
        "dxDataGrid-headerFilterCancel": "Cancel",
        "dxDataGrid-ariaAdaptiveCollapse": "Hide additional data",
        "dxDataGrid-ariaAdaptiveExpand": "Display additional data",
        "dxDataGrid-ariaColumn": "Column",
        "dxDataGrid-ariaColumnHeader": "Column header",
        "dxDataGrid-ariaValue": "Value",
        "dxDataGrid-ariaError": "Error",
        "dxDataGrid-ariaRevertButton": "Press Escape to discard the changes",
        "dxDataGrid-ariaFilterCell": "Filter cell",
        "dxDataGrid-ariaCollapse": "Collapse",
        "dxDataGrid-ariaModifiedCell": "Modified",
        "dxDataGrid-ariaDeletedCell": "Deleted",
        "dxDataGrid-ariaEditableCell": "Editable",
        "dxDataGrid-ariaExpand": "Expand",
        "dxDataGrid-ariaCollapsedRow": "Collapsed row",
        "dxDataGrid-ariaExpandedRow": "Expanded row",
        "dxDataGrid-ariaDataGrid": "Data grid with {0} rows and {1} columns",
        "dxDataGrid-ariaSearchInGrid": "Search in the data grid",
        "dxDataGrid-ariaSelectAll": "Select all",
        "dxDataGrid-ariaSelectRow": "Select row",
        "dxDataGrid-ariaToolbar": "Data grid toolbar",
        "dxDataGrid-ariaEditForm": "Edit form",
        "dxDataGrid-filterBuilderPopupTitle": "Filter Builder",
        "dxDataGrid-filterPanelCreateFilter": "Create Filter",
        "dxDataGrid-filterPanelClearFilter": "Clear",
        "dxDataGrid-filterPanelFilterEnabledHint": "Enable the filter",
        "dxTreeList-ariaTreeList": "Tree list with {0} rows and {1} columns",
        "dxTreeList-ariaSearchInGrid": "Search in the tree list",
        "dxTreeList-ariaToolbar": "Tree list toolbar",
        "dxTreeList-editingAddRowToNode": "Add",
        "dxPager-infoText": "Page {0} of {1} ({2} items)",
        "dxPager-pagesCountText": "of",
        "dxPager-pageSize": "Items per page: {0}",
        "dxPager-pageSizesAllText": "All",
        "dxPager-page": "Page {0}",
        "dxPager-prevPage": "Previous Page",
        "dxPager-nextPage": "Next Page",
        "dxPager-ariaLabel": "Page Navigation",
        "dxPager-ariaPageSize": "Page size",
        "dxPager-ariaPageNumber": "Page number",
        "dxPivotGrid-grandTotal": "Grand Total",
        "dxPivotGrid-total": "{0} Total",
        "dxPivotGrid-fieldChooserTitle": "Field Chooser",
        "dxPivotGrid-showFieldChooser": "Show Field Chooser",
        "dxPivotGrid-expandAll": "Expand All",
        "dxPivotGrid-collapseAll": "Collapse All",
        "dxPivotGrid-sortColumnBySummary": 'Sort "{0}" by This Column',
        "dxPivotGrid-sortRowBySummary": 'Sort "{0}" by This Row',
        "dxPivotGrid-removeAllSorting": "Remove All Sorting",
        "dxPivotGrid-dataNotAvailable": "N/A",
        "dxPivotGrid-rowFields": "Row Fields",
        "dxPivotGrid-columnFields": "Column Fields",
        "dxPivotGrid-dataFields": "Data Fields",
        "dxPivotGrid-filterFields": "Filter Fields",
        "dxPivotGrid-allFields": "All Fields",
        "dxPivotGrid-columnFieldArea": "Drop Column Fields Here",
        "dxPivotGrid-dataFieldArea": "Drop Data Fields Here",
        "dxPivotGrid-rowFieldArea": "Drop Row Fields Here",
        "dxPivotGrid-filterFieldArea": "Drop Filter Fields Here",
        "dxScheduler-editorLabelTitle": "Subject",
        "dxScheduler-editorLabelStartDate": "Start Date",
        "dxScheduler-editorLabelEndDate": "End Date",
        "dxScheduler-editorLabelDescription": "Description",
        "dxScheduler-editorLabelRecurrence": "Repeat",
        "dxScheduler-openAppointment": "Open appointment",
        "dxScheduler-recurrenceNever": "Never",
        "dxScheduler-recurrenceMinutely": "Every minute",
        "dxScheduler-recurrenceHourly": "Hourly",
        "dxScheduler-recurrenceDaily": "Daily",
        "dxScheduler-recurrenceWeekly": "Weekly",
        "dxScheduler-recurrenceMonthly": "Monthly",
        "dxScheduler-recurrenceYearly": "Yearly",
        "dxScheduler-recurrenceRepeatEvery": "Repeat Every",
        "dxScheduler-recurrenceRepeatOn": "Repeat On",
        "dxScheduler-recurrenceEnd": "End repeat",
        "dxScheduler-recurrenceAfter": "After",
        "dxScheduler-recurrenceOn": "On",
        "dxScheduler-recurrenceRepeatMinutely": "minute(s)",
        "dxScheduler-recurrenceRepeatHourly": "hour(s)",
        "dxScheduler-recurrenceRepeatDaily": "day(s)",
        "dxScheduler-recurrenceRepeatWeekly": "week(s)",
        "dxScheduler-recurrenceRepeatMonthly": "month(s)",
        "dxScheduler-recurrenceRepeatYearly": "year(s)",
        "dxScheduler-switcherDay": "Day",
        "dxScheduler-switcherWeek": "Week",
        "dxScheduler-switcherWorkWeek": "Work Week",
        "dxScheduler-switcherMonth": "Month",
        "dxScheduler-switcherAgenda": "Agenda",
        "dxScheduler-switcherTimelineDay": "Timeline Day",
        "dxScheduler-switcherTimelineWeek": "Timeline Week",
        "dxScheduler-switcherTimelineWorkWeek": "Timeline Work Week",
        "dxScheduler-switcherTimelineMonth": "Timeline Month",
        "dxScheduler-recurrenceRepeatOnDate": "on date",
        "dxScheduler-recurrenceRepeatCount": "occurrence(s)",
        "dxScheduler-allDay": "All day",
        "dxScheduler-confirmRecurrenceEditTitle": "Edit Recurring Appointment",
        "dxScheduler-confirmRecurrenceDeleteTitle": "Delete Recurring Appointment",
        "dxScheduler-confirmRecurrenceEditMessage": "Do you want to edit only this appointment or the whole series?",
        "dxScheduler-confirmRecurrenceDeleteMessage": "Do you want to delete only this appointment or the whole series?",
        "dxScheduler-confirmRecurrenceEditSeries": "Edit series",
        "dxScheduler-confirmRecurrenceDeleteSeries": "Delete series",
        "dxScheduler-confirmRecurrenceEditOccurrence": "Edit appointment",
        "dxScheduler-confirmRecurrenceDeleteOccurrence": "Delete appointment",
        "dxScheduler-noTimezoneTitle": "No timezone",
        "dxScheduler-moreAppointments": "{0} more",
        "dxCalendar-todayButtonText": "Today",
        "dxCalendar-ariaWidgetName": "Calendar",
        "dxCalendar-previousMonthButtonLabel": "Previous month",
        "dxCalendar-previousYearButtonLabel": "Previous year",
        "dxCalendar-previousDecadeButtonLabel": "Previous decade",
        "dxCalendar-previousCenturyButtonLabel": "Previous century",
        "dxCalendar-nextMonthButtonLabel": "Next month",
        "dxCalendar-nextYearButtonLabel": "Next year",
        "dxCalendar-nextDecadeButtonLabel": "Next decade",
        "dxCalendar-nextCenturyButtonLabel": "Next century",
        "dxCalendar-captionMonthLabel": "Month selection",
        "dxCalendar-captionYearLabel": "Year selection",
        "dxCalendar-captionDecadeLabel": "Decade selection",
        "dxCalendar-captionCenturyLabel": "Century selection",
        "dxColorView-ariaRed": "Red",
        "dxColorView-ariaGreen": "Green",
        "dxColorView-ariaBlue": "Blue",
        "dxColorView-ariaAlpha": "Transparency",
        "dxColorView-ariaHex": "Color code",
        "dxTagBox-selected": "{0} selected",
        "dxTagBox-allSelected": "All selected ({0})",
        "dxTagBox-moreSelected": "{0} more",
        "vizExport-printingButtonText": "Print",
        "vizExport-titleMenuText": "Exporting/Printing",
        "vizExport-exportButtonText": "{0} file",
        "dxFilterBuilder-and": "And",
        "dxFilterBuilder-or": "Or",
        "dxFilterBuilder-notAnd": "Not And",
        "dxFilterBuilder-notOr": "Not Or",
        "dxFilterBuilder-addCondition": "Add Condition",
        "dxFilterBuilder-addGroup": "Add Group",
        "dxFilterBuilder-enterValueText": "<enter a value>",
        "dxFilterBuilder-filterOperationEquals": "Equals",
        "dxFilterBuilder-filterOperationNotEquals": "Does not equal",
        "dxFilterBuilder-filterOperationLess": "Is less than",
        "dxFilterBuilder-filterOperationLessOrEquals": "Is less than or equal to",
        "dxFilterBuilder-filterOperationGreater": "Is greater than",
        "dxFilterBuilder-filterOperationGreaterOrEquals": "Is greater than or equal to",
        "dxFilterBuilder-filterOperationStartsWith": "Starts with",
        "dxFilterBuilder-filterOperationContains": "Contains",
        "dxFilterBuilder-filterOperationNotContains": "Does not contain",
        "dxFilterBuilder-filterOperationEndsWith": "Ends with",
        "dxFilterBuilder-filterOperationIsBlank": "Is blank",
        "dxFilterBuilder-filterOperationIsNotBlank": "Is not blank",
        "dxFilterBuilder-filterOperationBetween": "Is between",
        "dxFilterBuilder-filterOperationAnyOf": "Is any of",
        "dxFilterBuilder-filterOperationNoneOf": "Is none of",
        "dxHtmlEditor-dialogColorCaption": "Change Font Color",
        "dxHtmlEditor-dialogBackgroundCaption": "Change Background Color",
        "dxHtmlEditor-dialogLinkCaption": "Add Link",
        "dxHtmlEditor-dialogLinkUrlField": "URL",
        "dxHtmlEditor-dialogLinkTextField": "Text",
        "dxHtmlEditor-dialogLinkTargetField": "Open link in new window",
        "dxHtmlEditor-dialogImageCaption": "Add Image",
        "dxHtmlEditor-dialogImageUrlField": "URL",
        "dxHtmlEditor-dialogImageAltField": "Alternate text",
        "dxHtmlEditor-dialogImageWidthField": "Width (px)",
        "dxHtmlEditor-dialogImageHeightField": "Height (px)",
        "dxHtmlEditor-dialogInsertTableRowsField": "Rows",
        "dxHtmlEditor-dialogInsertTableColumnsField": "Columns",
        "dxHtmlEditor-dialogInsertTableCaption": "Insert Table",
        "dxHtmlEditor-dialogUpdateImageCaption": "Update Image",
        "dxHtmlEditor-dialogImageUpdateButton": "Update",
        "dxHtmlEditor-dialogImageAddButton": "Add",
        "dxHtmlEditor-dialogImageSpecifyUrl": "From the Web",
        "dxHtmlEditor-dialogImageSelectFile": "From This Device",
        "dxHtmlEditor-dialogImageKeepAspectRatio": "Keep Aspect Ratio",
        "dxHtmlEditor-dialogImageEncodeToBase64": "Encode to Base64",
        "dxHtmlEditor-heading": "Heading",
        "dxHtmlEditor-normalText": "Normal text",
        "dxHtmlEditor-background": "Background Color",
        "dxHtmlEditor-bold": "Bold",
        "dxHtmlEditor-color": "Font Color",
        "dxHtmlEditor-font": "Font",
        "dxHtmlEditor-italic": "Italic",
        "dxHtmlEditor-link": "Add Link",
        "dxHtmlEditor-image": "Add Image",
        "dxHtmlEditor-size": "Size",
        "dxHtmlEditor-strike": "Strikethrough",
        "dxHtmlEditor-subscript": "Subscript",
        "dxHtmlEditor-superscript": "Superscript",
        "dxHtmlEditor-underline": "Underline",
        "dxHtmlEditor-blockquote": "Blockquote",
        "dxHtmlEditor-header": "Header",
        "dxHtmlEditor-increaseIndent": "Increase Indent",
        "dxHtmlEditor-decreaseIndent": "Decrease Indent",
        "dxHtmlEditor-orderedList": "Ordered List",
        "dxHtmlEditor-bulletList": "Bullet List",
        "dxHtmlEditor-alignLeft": "Align Left",
        "dxHtmlEditor-alignCenter": "Align Center",
        "dxHtmlEditor-alignRight": "Align Right",
        "dxHtmlEditor-alignJustify": "Align Justify",
        "dxHtmlEditor-codeBlock": "Code Block",
        "dxHtmlEditor-variable": "Add Variable",
        "dxHtmlEditor-undo": "Undo",
        "dxHtmlEditor-redo": "Redo",
        "dxHtmlEditor-clear": "Clear Formatting",
        "dxHtmlEditor-insertTable": "Insert Table",
        "dxHtmlEditor-insertHeaderRow": "Insert Header Row",
        "dxHtmlEditor-insertRowAbove": "Insert Row Above",
        "dxHtmlEditor-insertRowBelow": "Insert Row Below",
        "dxHtmlEditor-insertColumnLeft": "Insert Column Left",
        "dxHtmlEditor-insertColumnRight": "Insert Column Right",
        "dxHtmlEditor-deleteColumn": "Delete Column",
        "dxHtmlEditor-deleteRow": "Delete Row",
        "dxHtmlEditor-deleteTable": "Delete Table",
        "dxHtmlEditor-cellProperties": "Cell Properties",
        "dxHtmlEditor-tableProperties": "Table Properties",
        "dxHtmlEditor-insert": "Insert",
        "dxHtmlEditor-delete": "Delete",
        "dxHtmlEditor-border": "Border",
        "dxHtmlEditor-style": "Style",
        "dxHtmlEditor-width": "Width",
        "dxHtmlEditor-height": "Height",
        "dxHtmlEditor-borderColor": "Color",
        "dxHtmlEditor-borderWidth": "Border Width",
        "dxHtmlEditor-tableBackground": "Background",
        "dxHtmlEditor-dimensions": "Dimensions",
        "dxHtmlEditor-alignment": "Alignment",
        "dxHtmlEditor-horizontal": "Horizontal",
        "dxHtmlEditor-vertical": "Vertical",
        "dxHtmlEditor-paddingVertical": "Vertical Padding",
        "dxHtmlEditor-paddingHorizontal": "Horizontal Padding",
        "dxHtmlEditor-pixels": "Pixels",
        "dxHtmlEditor-list": "List",
        "dxHtmlEditor-ordered": "Ordered",
        "dxHtmlEditor-bullet": "Bullet",
        "dxHtmlEditor-align": "Align",
        "dxHtmlEditor-center": "Center",
        "dxHtmlEditor-left": "Left",
        "dxHtmlEditor-right": "Right",
        "dxHtmlEditor-indent": "Indent",
        "dxHtmlEditor-justify": "Justify",
        "dxHtmlEditor-borderStyleNone": "none",
        "dxHtmlEditor-borderStyleHidden": "hidden",
        "dxHtmlEditor-borderStyleDotted": "dotted",
        "dxHtmlEditor-borderStyleDashed": "dashed",
        "dxHtmlEditor-borderStyleSolid": "solid",
        "dxHtmlEditor-borderStyleDouble": "double",
        "dxHtmlEditor-borderStyleGroove": "groove",
        "dxHtmlEditor-borderStyleRidge": "ridge",
        "dxHtmlEditor-borderStyleInset": "inset",
        "dxHtmlEditor-borderStyleOutset": "outset",
        "dxFileManager-newDirectoryName": "Untitled directory",
        "dxFileManager-rootDirectoryName": "Files",
        "dxFileManager-errorNoAccess": "Access Denied. Operation could not be completed.",
        "dxFileManager-errorDirectoryExistsFormat": "Directory '{0}' already exists.",
        "dxFileManager-errorFileExistsFormat": "File '{0}' already exists.",
        "dxFileManager-errorFileNotFoundFormat": "File '{0}' not found.",
        "dxFileManager-errorDirectoryNotFoundFormat": "Directory '{0}' not found.",
        "dxFileManager-errorWrongFileExtension": "File extension is not allowed.",
        "dxFileManager-errorMaxFileSizeExceeded": "File size exceeds the maximum allowed size.",
        "dxFileManager-errorInvalidSymbols": "This name contains invalid characters.",
        "dxFileManager-errorDefault": "Unspecified error.",
        "dxFileManager-errorDirectoryOpenFailed": "The directory cannot be opened",
        "dxFileManager-commandCreate": "New directory",
        "dxFileManager-commandRename": "Rename",
        "dxFileManager-commandMove": "Move to",
        "dxFileManager-commandCopy": "Copy to",
        "dxFileManager-commandDelete": "Delete",
        "dxFileManager-commandDownload": "Download",
        "dxFileManager-commandUpload": "Upload files",
        "dxFileManager-commandRefresh": "Refresh",
        "dxFileManager-commandThumbnails": "Thumbnails View",
        "dxFileManager-commandDetails": "Details View",
        "dxFileManager-commandClearSelection": "Clear selection",
        "dxFileManager-commandShowNavPane": "Toggle navigation pane",
        "dxFileManager-dialogDirectoryChooserMoveTitle": "Move to",
        "dxFileManager-dialogDirectoryChooserMoveButtonText": "Move",
        "dxFileManager-dialogDirectoryChooserCopyTitle": "Copy to",
        "dxFileManager-dialogDirectoryChooserCopyButtonText": "Copy",
        "dxFileManager-dialogRenameItemTitle": "Rename",
        "dxFileManager-dialogRenameItemButtonText": "Save",
        "dxFileManager-dialogCreateDirectoryTitle": "New directory",
        "dxFileManager-dialogCreateDirectoryButtonText": "Create",
        "dxFileManager-dialogDeleteItemTitle": "Delete",
        "dxFileManager-dialogDeleteItemButtonText": "Delete",
        "dxFileManager-dialogDeleteItemSingleItemConfirmation": "Are you sure you want to delete {0}?",
        "dxFileManager-dialogDeleteItemMultipleItemsConfirmation": "Are you sure you want to delete {0} items?",
        "dxFileManager-dialogButtonCancel": "Cancel",
        "dxFileManager-editingCreateSingleItemProcessingMessage": "Creating a directory inside {0}",
        "dxFileManager-editingCreateSingleItemSuccessMessage": "Created a directory inside {0}",
        "dxFileManager-editingCreateSingleItemErrorMessage": "Directory was not created",
        "dxFileManager-editingCreateCommonErrorMessage": "Directory was not created",
        "dxFileManager-editingRenameSingleItemProcessingMessage": "Renaming an item inside {0}",
        "dxFileManager-editingRenameSingleItemSuccessMessage": "Renamed an item inside {0}",
        "dxFileManager-editingRenameSingleItemErrorMessage": "Item was not renamed",
        "dxFileManager-editingRenameCommonErrorMessage": "Item was not renamed",
        "dxFileManager-editingDeleteSingleItemProcessingMessage": "Deleting an item from {0}",
        "dxFileManager-editingDeleteMultipleItemsProcessingMessage": "Deleting {0} items from {1}",
        "dxFileManager-editingDeleteSingleItemSuccessMessage": "Deleted an item from {0}",
        "dxFileManager-editingDeleteMultipleItemsSuccessMessage": "Deleted {0} items from {1}",
        "dxFileManager-editingDeleteSingleItemErrorMessage": "Item was not deleted",
        "dxFileManager-editingDeleteMultipleItemsErrorMessage": "{0} items were not deleted",
        "dxFileManager-editingDeleteCommonErrorMessage": "Some items were not deleted",
        "dxFileManager-editingMoveSingleItemProcessingMessage": "Moving an item to {0}",
        "dxFileManager-editingMoveMultipleItemsProcessingMessage": "Moving {0} items to {1}",
        "dxFileManager-editingMoveSingleItemSuccessMessage": "Moved an item to {0}",
        "dxFileManager-editingMoveMultipleItemsSuccessMessage": "Moved {0} items to {1}",
        "dxFileManager-editingMoveSingleItemErrorMessage": "Item was not moved",
        "dxFileManager-editingMoveMultipleItemsErrorMessage": "{0} items were not moved",
        "dxFileManager-editingMoveCommonErrorMessage": "Some items were not moved",
        "dxFileManager-editingCopySingleItemProcessingMessage": "Copying an item to {0}",
        "dxFileManager-editingCopyMultipleItemsProcessingMessage": "Copying {0} items to {1}",
        "dxFileManager-editingCopySingleItemSuccessMessage": "Copied an item to {0}",
        "dxFileManager-editingCopyMultipleItemsSuccessMessage": "Copied {0} items to {1}",
        "dxFileManager-editingCopySingleItemErrorMessage": "Item was not copied",
        "dxFileManager-editingCopyMultipleItemsErrorMessage": "{0} items were not copied",
        "dxFileManager-editingCopyCommonErrorMessage": "Some items were not copied",
        "dxFileManager-editingUploadSingleItemProcessingMessage": "Uploading an item to {0}",
        "dxFileManager-editingUploadMultipleItemsProcessingMessage": "Uploading {0} items to {1}",
        "dxFileManager-editingUploadSingleItemSuccessMessage": "Uploaded an item to {0}",
        "dxFileManager-editingUploadMultipleItemsSuccessMessage": "Uploaded {0} items to {1}",
        "dxFileManager-editingUploadSingleItemErrorMessage": "Item was not uploaded",
        "dxFileManager-editingUploadMultipleItemsErrorMessage": "{0} items were not uploaded",
        "dxFileManager-editingUploadCanceledMessage": "Canceled",
        "dxFileManager-editingDownloadSingleItemErrorMessage": "Item was not downloaded",
        "dxFileManager-editingDownloadMultipleItemsErrorMessage": "{0} items were not downloaded",
        "dxFileManager-listDetailsColumnCaptionName": "Name",
        "dxFileManager-listDetailsColumnCaptionDateModified": "Date Modified",
        "dxFileManager-listDetailsColumnCaptionFileSize": "File Size",
        "dxFileManager-listThumbnailsTooltipTextSize": "Size",
        "dxFileManager-listThumbnailsTooltipTextDateModified": "Date Modified",
        "dxFileManager-notificationProgressPanelTitle": "Progress",
        "dxFileManager-notificationProgressPanelEmptyListText": "No operations",
        "dxFileManager-notificationProgressPanelOperationCanceled": "Canceled",
        "dxDiagram-categoryGeneral": "General",
        "dxDiagram-categoryFlowchart": "Flowchart",
        "dxDiagram-categoryOrgChart": "Org Chart",
        "dxDiagram-categoryContainers": "Containers",
        "dxDiagram-categoryCustom": "Custom",
        "dxDiagram-commandExportToSvg": "Export to SVG",
        "dxDiagram-commandExportToPng": "Export to PNG",
        "dxDiagram-commandExportToJpg": "Export to JPEG",
        "dxDiagram-commandUndo": "Undo",
        "dxDiagram-commandRedo": "Redo",
        "dxDiagram-commandFontName": "Font Name",
        "dxDiagram-commandFontSize": "Font Size",
        "dxDiagram-commandBold": "Bold",
        "dxDiagram-commandItalic": "Italic",
        "dxDiagram-commandUnderline": "Underline",
        "dxDiagram-commandTextColor": "Font Color",
        "dxDiagram-commandLineColor": "Line Color",
        "dxDiagram-commandLineWidth": "Line Width",
        "dxDiagram-commandLineStyle": "Line Style",
        "dxDiagram-commandLineStyleSolid": "Solid",
        "dxDiagram-commandLineStyleDotted": "Dotted",
        "dxDiagram-commandLineStyleDashed": "Dashed",
        "dxDiagram-commandFillColor": "Fill Color",
        "dxDiagram-commandAlignLeft": "Align Left",
        "dxDiagram-commandAlignCenter": "Align Center",
        "dxDiagram-commandAlignRight": "Align Right",
        "dxDiagram-commandConnectorLineType": "Connector Line Type",
        "dxDiagram-commandConnectorLineStraight": "Straight",
        "dxDiagram-commandConnectorLineOrthogonal": "Orthogonal",
        "dxDiagram-commandConnectorLineStart": "Connector Line Start",
        "dxDiagram-commandConnectorLineEnd": "Connector Line End",
        "dxDiagram-commandConnectorLineNone": "None",
        "dxDiagram-commandConnectorLineArrow": "Arrow",
        "dxDiagram-commandFullscreen": "Full Screen",
        "dxDiagram-commandUnits": "Units",
        "dxDiagram-commandPageSize": "Page Size",
        "dxDiagram-commandPageOrientation": "Page Orientation",
        "dxDiagram-commandPageOrientationLandscape": "Landscape",
        "dxDiagram-commandPageOrientationPortrait": "Portrait",
        "dxDiagram-commandPageColor": "Page Color",
        "dxDiagram-commandShowGrid": "Show Grid",
        "dxDiagram-commandSnapToGrid": "Snap to Grid",
        "dxDiagram-commandGridSize": "Grid Size",
        "dxDiagram-commandZoomLevel": "Zoom Level",
        "dxDiagram-commandAutoZoom": "Auto Zoom",
        "dxDiagram-commandFitToContent": "Fit to Content",
        "dxDiagram-commandFitToWidth": "Fit to Width",
        "dxDiagram-commandAutoZoomByContent": "Auto Zoom by Content",
        "dxDiagram-commandAutoZoomByWidth": "Auto Zoom by Width",
        "dxDiagram-commandSimpleView": "Simple View",
        "dxDiagram-commandCut": "Cut",
        "dxDiagram-commandCopy": "Copy",
        "dxDiagram-commandPaste": "Paste",
        "dxDiagram-commandSelectAll": "Select All",
        "dxDiagram-commandDelete": "Delete",
        "dxDiagram-commandBringToFront": "Bring to Front",
        "dxDiagram-commandSendToBack": "Send to Back",
        "dxDiagram-commandLock": "Lock",
        "dxDiagram-commandUnlock": "Unlock",
        "dxDiagram-commandInsertShapeImage": "Insert Image...",
        "dxDiagram-commandEditShapeImage": "Change Image...",
        "dxDiagram-commandDeleteShapeImage": "Delete Image",
        "dxDiagram-commandLayoutLeftToRight": "Left-to-right",
        "dxDiagram-commandLayoutRightToLeft": "Right-to-left",
        "dxDiagram-commandLayoutTopToBottom": "Top-to-bottom",
        "dxDiagram-commandLayoutBottomToTop": "Bottom-to-top",
        "dxDiagram-unitIn": "in",
        "dxDiagram-unitCm": "cm",
        "dxDiagram-unitPx": "px",
        "dxDiagram-dialogButtonOK": "OK",
        "dxDiagram-dialogButtonCancel": "Cancel",
        "dxDiagram-dialogInsertShapeImageTitle": "Insert Image",
        "dxDiagram-dialogEditShapeImageTitle": "Change Image",
        "dxDiagram-dialogEditShapeImageSelectButton": "Select image",
        "dxDiagram-dialogEditShapeImageLabelText": "or drop a file here",
        "dxDiagram-uiExport": "Export",
        "dxDiagram-uiProperties": "Properties",
        "dxDiagram-uiSettings": "Settings",
        "dxDiagram-uiShowToolbox": "Show Toolbox",
        "dxDiagram-uiSearch": "Search",
        "dxDiagram-uiStyle": "Style",
        "dxDiagram-uiLayout": "Layout",
        "dxDiagram-uiLayoutTree": "Tree",
        "dxDiagram-uiLayoutLayered": "Layered",
        "dxDiagram-uiDiagram": "Diagram",
        "dxDiagram-uiText": "Text",
        "dxDiagram-uiObject": "Object",
        "dxDiagram-uiConnector": "Connector",
        "dxDiagram-uiPage": "Page",
        "dxDiagram-shapeText": "Text",
        "dxDiagram-shapeRectangle": "Rectangle",
        "dxDiagram-shapeEllipse": "Ellipse",
        "dxDiagram-shapeCross": "Cross",
        "dxDiagram-shapeTriangle": "Triangle",
        "dxDiagram-shapeDiamond": "Diamond",
        "dxDiagram-shapeHeart": "Heart",
        "dxDiagram-shapePentagon": "Pentagon",
        "dxDiagram-shapeHexagon": "Hexagon",
        "dxDiagram-shapeOctagon": "Octagon",
        "dxDiagram-shapeStar": "Star",
        "dxDiagram-shapeArrowLeft": "Left Arrow",
        "dxDiagram-shapeArrowUp": "Up Arrow",
        "dxDiagram-shapeArrowRight": "Right Arrow",
        "dxDiagram-shapeArrowDown": "Down Arrow",
        "dxDiagram-shapeArrowUpDown": "Up Down Arrow",
        "dxDiagram-shapeArrowLeftRight": "Left Right Arrow",
        "dxDiagram-shapeProcess": "Process",
        "dxDiagram-shapeDecision": "Decision",
        "dxDiagram-shapeTerminator": "Terminator",
        "dxDiagram-shapePredefinedProcess": "Predefined Process",
        "dxDiagram-shapeDocument": "Document",
        "dxDiagram-shapeMultipleDocuments": "Multiple Documents",
        "dxDiagram-shapeManualInput": "Manual Input",
        "dxDiagram-shapePreparation": "Preparation",
        "dxDiagram-shapeData": "Data",
        "dxDiagram-shapeDatabase": "Database",
        "dxDiagram-shapeHardDisk": "Hard Disk",
        "dxDiagram-shapeInternalStorage": "Internal Storage",
        "dxDiagram-shapePaperTape": "Paper Tape",
        "dxDiagram-shapeManualOperation": "Manual Operation",
        "dxDiagram-shapeDelay": "Delay",
        "dxDiagram-shapeStoredData": "Stored Data",
        "dxDiagram-shapeDisplay": "Display",
        "dxDiagram-shapeMerge": "Merge",
        "dxDiagram-shapeConnector": "Connector",
        "dxDiagram-shapeOr": "Or",
        "dxDiagram-shapeSummingJunction": "Summing Junction",
        "dxDiagram-shapeContainerDefaultText": "Container",
        "dxDiagram-shapeVerticalContainer": "Vertical Container",
        "dxDiagram-shapeHorizontalContainer": "Horizontal Container",
        "dxDiagram-shapeCardDefaultText": "Person's Name",
        "dxDiagram-shapeCardWithImageOnLeft": "Card with Image on the Left",
        "dxDiagram-shapeCardWithImageOnTop": "Card with Image on the Top",
        "dxDiagram-shapeCardWithImageOnRight": "Card with Image on the Right",
        "dxGantt-dialogTitle": "Title",
        "dxGantt-dialogStartTitle": "Start",
        "dxGantt-dialogEndTitle": "End",
        "dxGantt-dialogProgressTitle": "Progress",
        "dxGantt-dialogResourcesTitle": "Resources",
        "dxGantt-dialogResourceManagerTitle": "Resource Manager",
        "dxGantt-dialogTaskDetailsTitle": "Task Details",
        "dxGantt-dialogEditResourceListHint": "Edit Resource List",
        "dxGantt-dialogEditNoResources": "No resources",
        "dxGantt-dialogButtonAdd": "Add",
        "dxGantt-contextMenuNewTask": "New Task",
        "dxGantt-contextMenuNewSubtask": "New Subtask",
        "dxGantt-contextMenuDeleteTask": "Delete Task",
        "dxGantt-contextMenuDeleteDependency": "Delete Dependency",
        "dxGantt-dialogTaskDeleteConfirmation": "Deleting a task also deletes all its dependencies and subtasks. Are you sure you want to delete this task?",
        "dxGantt-dialogDependencyDeleteConfirmation": "Are you sure you want to delete the dependency from the task?",
        "dxGantt-dialogResourcesDeleteConfirmation": "Deleting a resource also deletes it from tasks to which this resource is assigned. Are you sure you want to delete these resources? Resources: {0}",
        "dxGantt-dialogConstraintCriticalViolationMessage": "The task you are attempting to move is linked to a second task by a dependency relation. This change would conflict with dependency rules. How would you like to proceed?",
        "dxGantt-dialogConstraintViolationMessage": "The task you are attempting to move is linked to a second task by a dependency relation. How would you like to proceed?",
        "dxGantt-dialogCancelOperationMessage": "Cancel the operation",
        "dxGantt-dialogDeleteDependencyMessage": "Delete the dependency",
        "dxGantt-dialogMoveTaskAndKeepDependencyMessage": "Move the task and keep the dependency",
        "dxGantt-dialogConstraintCriticalViolationSeveralTasksMessage": "The task you are attempting to move is linked to another tasks by dependency relations. This change would conflict with dependency rules. How would you like to proceed?",
        "dxGantt-dialogConstraintViolationSeveralTasksMessage": "The task you are attempting to move is linked to another tasks by dependency relations. How would you like to proceed?",
        "dxGantt-dialogDeleteDependenciesMessage": "Delete the dependency relations",
        "dxGantt-dialogMoveTaskAndKeepDependenciesMessage": "Move the task and keep the dependencies",
        "dxGantt-undo": "Undo",
        "dxGantt-redo": "Redo",
        "dxGantt-expandAll": "Expand All",
        "dxGantt-collapseAll": "Collapse All",
        "dxGantt-addNewTask": "Add New Task",
        "dxGantt-deleteSelectedTask": "Delete Selected Task",
        "dxGantt-zoomIn": "Zoom In",
        "dxGantt-zoomOut": "Zoom Out",
        "dxGantt-fullScreen": "Full Screen",
        "dxGantt-quarter": "Q{0}",
        "dxGantt-sortingAscendingText": "Sort Ascending",
        "dxGantt-sortingDescendingText": "Sort Descending",
        "dxGantt-sortingClearText": "Clear Sorting",
        "dxGantt-showResources": "Show Resources",
        "dxGantt-showDependencies": "Show Dependencies",
        "dxGantt-dialogStartDateValidation": "Start date must be after {0}",
        "dxGantt-dialogEndDateValidation": "End date must be after {0}",
        "dxGallery-itemName": "Gallery item",
        "dxMultiView-elementAriaRoleDescription": "MultiView",
        "dxMultiView-elementAriaLabel": "Use the arrow keys or swipe to navigate between views",
        "dxMultiView-itemAriaRoleDescription": "View",
        "dxMultiView-itemAriaLabel": "{0} of {1}"
      }
    };
  }
});

// node_modules/devextreme/esm/localization/message.js
var baseDictionary, getDataByLocale, newMessages, messageLocalization, message_default;
var init_message = __esm({
  "node_modules/devextreme/esm/localization/message.js"() {
    init_dependency_injector();
    init_extend();
    init_string();
    init_inflector();
    init_core();
    init_default_messages();
    baseDictionary = extend(true, {}, defaultMessages);
    getDataByLocale = (localeData, locale2) => {
      var _Object$entries$find;
      return localeData[locale2] || (null === locale2 || void 0 === locale2 ? void 0 : locale2.toLowerCase) && (null === (_Object$entries$find = Object.entries(localeData).find((_ref) => {
        var [key] = _ref;
        return key.toLowerCase() === locale2.toLowerCase();
      })) || void 0 === _Object$entries$find ? void 0 : _Object$entries$find[1]) || {};
    };
    newMessages = {};
    messageLocalization = dependency_injector_default({
      engine: function() {
        return "base";
      },
      _dictionary: baseDictionary,
      load: function(messages) {
        extend(true, this._dictionary, messages);
      },
      _localizablePrefix: "@",
      setup: function(localizablePrefix) {
        this._localizablePrefix = localizablePrefix;
      },
      localizeString: function(text) {
        var that = this;
        var regex = new RegExp("(^|[^a-zA-Z_0-9" + that._localizablePrefix + "-]+)(" + that._localizablePrefix + "{1,2})([a-zA-Z_0-9-]+)", "g");
        var escapeString = that._localizablePrefix + that._localizablePrefix;
        return text.replace(regex, (str, prefix, escape, localizationKey) => {
          var defaultResult = that._localizablePrefix + localizationKey;
          var result;
          if (escape !== escapeString) {
            result = that.format(localizationKey);
          }
          if (!result) {
            newMessages[localizationKey] = humanize(localizationKey);
          }
          return prefix + (result || defaultResult);
        });
      },
      getMessagesByLocales: function() {
        return this._dictionary;
      },
      getDictionary: function(onlyNew) {
        if (onlyNew) {
          return newMessages;
        }
        return extend({}, newMessages, this.getMessagesByLocales()[core_default.locale()]);
      },
      getFormatter: function(key) {
        return this._getFormatterBase(key) || this._getFormatterBase(key, "en");
      },
      _getFormatterBase: function(key, locale2) {
        var message = core_default.getValueByClosestLocale((locale3) => getDataByLocale(this._dictionary, locale3)[key]);
        if (message) {
          return function() {
            var args = 1 === arguments.length && Array.isArray(arguments[0]) ? arguments[0].slice(0) : Array.prototype.slice.call(arguments, 0);
            args.unshift(message);
            return format.apply(this, args);
          };
        }
      },
      format: function(key) {
        var formatter = this.getFormatter(key);
        var values = Array.prototype.slice.call(arguments, 1);
        return formatter && formatter.apply(this, values) || "";
      }
    });
    message_default = messageLocalization;
  }
});

// node_modules/devextreme/esm/core/utils/math.js
function getExponent(value) {
  return Math.abs(parseInt(value.toExponential().split("e")[1]));
}
function getExponentialNotation(value) {
  var parts = value.toExponential().split("e");
  var mantissa = parseFloat(parts[0]);
  var exponent = parseInt(parts[1]);
  return {
    exponent,
    mantissa
  };
}
function multiplyInExponentialForm(value, exponentShift) {
  var exponentialNotation = getExponentialNotation(value);
  return parseFloat("".concat(exponentialNotation.mantissa, "e").concat(exponentialNotation.exponent + exponentShift));
}
function _isEdgeBug() {
  return "0.000300" !== 3e-4.toPrecision(3);
}
function adjust(value, interval) {
  var precision = getPrecision(interval || 0) + 2;
  var separatedValue = value.toString().split(".");
  var sourceValue = value;
  var absValue = Math.abs(value);
  var separatedAdjustedValue;
  var isExponentValue = isExponential(value);
  var integerPart = absValue > 1 ? 10 : 0;
  if (1 === separatedValue.length) {
    return value;
  }
  if (!isExponentValue) {
    if (isExponential(interval)) {
      precision = separatedValue[0].length + getExponent(interval);
    }
    value = absValue;
    value = value - Math.floor(value) + integerPart;
  }
  precision = _isEdgeBug() && getExponent(value) > 6 || precision > 7 ? 15 : 7;
  if (!isExponentValue) {
    separatedAdjustedValue = parseFloat(value.toPrecision(precision)).toString().split(".");
    if (separatedAdjustedValue[0] === integerPart.toString()) {
      return parseFloat(separatedValue[0] + "." + separatedAdjustedValue[1]);
    }
  }
  return parseFloat(sourceValue.toPrecision(precision));
}
function getPrecision(value) {
  var str = value.toString();
  if (str.indexOf(".") < 0) {
    return 0;
  }
  var mantissa = str.split(".");
  var positionOfDelimiter = mantissa[1].indexOf("e");
  return positionOfDelimiter >= 0 ? positionOfDelimiter : mantissa[1].length;
}
function getRoot(x, n) {
  if (x < 0 && n % 2 !== 1) {
    return NaN;
  }
  var y = Math.pow(Math.abs(x), 1 / n);
  return n % 2 === 1 && x < 0 ? -y : y;
}
function solveCubicEquation(a, b, c, d) {
  if (Math.abs(a) < 1e-8) {
    a = b;
    b = c;
    c = d;
    if (Math.abs(a) < 1e-8) {
      a = b;
      b = c;
      if (Math.abs(a) < 1e-8) {
        return [];
      }
      return [-b / a];
    }
    var D2 = b * b - 4 * a * c;
    if (Math.abs(D2) < 1e-8) {
      return [-b / (2 * a)];
    } else if (D2 > 0) {
      return [(-b + Math.sqrt(D2)) / (2 * a), (-b - Math.sqrt(D2)) / (2 * a)];
    }
    return [];
  }
  var p = (3 * a * c - b * b) / (3 * a * a);
  var q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  var roots;
  var u;
  if (Math.abs(p) < 1e-8) {
    roots = [getRoot(-q, 3)];
  } else if (Math.abs(q) < 1e-8) {
    roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
  } else {
    var D3 = q * q / 4 + p * p * p / 27;
    if (Math.abs(D3) < 1e-8) {
      roots = [-1.5 * q / p, 3 * q / p];
    } else if (D3 > 0) {
      u = getRoot(-q / 2 - Math.sqrt(D3), 3);
      roots = [u - p / (3 * u)];
    } else {
      u = 2 * Math.sqrt(-p / 3);
      var t = Math.acos(3 * q / p / u) / 3;
      var k = 2 * Math.PI / 3;
      roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
    }
  }
  for (var i = 0; i < roots.length; i++) {
    roots[i] -= b / (3 * a);
  }
  return roots;
}
function trunc(value) {
  return Math.trunc ? Math.trunc(value) : value > 0 ? Math.floor(value) : Math.ceil(value);
}
function getRemainderByDivision(dividend, divider, digitsCount) {
  if (divider === parseInt(divider)) {
    return dividend % divider;
  }
  var quotient = roundFloatPart(dividend / divider, digitsCount);
  return (quotient - parseInt(quotient)) * divider;
}
function getExponentLength(value) {
  var _valueString$split$;
  var valueString = value.toString();
  return (null === (_valueString$split$ = valueString.split(".")[1]) || void 0 === _valueString$split$ ? void 0 : _valueString$split$.length) || parseInt(valueString.split("e-")[1]) || 0;
}
function roundFloatPart(value) {
  var digitsCount = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
  return parseFloat(value.toFixed(digitsCount));
}
var sign, fitIntoRange, inRange;
var init_math = __esm({
  "node_modules/devextreme/esm/core/utils/math.js"() {
    init_type();
    sign = function(value) {
      if (0 === value) {
        return 0;
      }
      return value / Math.abs(value);
    };
    fitIntoRange = function(value, minValue, maxValue) {
      var isMinValueUndefined = !minValue && 0 !== minValue;
      var isMaxValueUndefined = !maxValue && 0 !== maxValue;
      isMinValueUndefined && (minValue = !isMaxValueUndefined ? Math.min(value, maxValue) : value);
      isMaxValueUndefined && (maxValue = !isMinValueUndefined ? Math.max(value, minValue) : value);
      return Math.min(Math.max(value, minValue), maxValue);
    };
    inRange = function(value, minValue, maxValue) {
      return value >= minValue && value <= maxValue;
    };
  }
});

// node_modules/devextreme/esm/localization/utils.js
function roundByAbs(value) {
  var valueSign = sign(value);
  return valueSign * Math.round(Math.abs(value));
}
function adjustValue(value, precision) {
  var precisionMultiplier = Math.pow(DECIMAL_BASE, precision);
  var intermediateValue = multiplyInExponentialForm(value, precision);
  return roundByAbs(intermediateValue) / precisionMultiplier;
}
function toFixed(value, precision) {
  var valuePrecision = precision || 0;
  var adjustedValue = valuePrecision > 0 ? adjustValue(...arguments) : value;
  return adjustedValue.toFixed(valuePrecision);
}
var DECIMAL_BASE;
var init_utils = __esm({
  "node_modules/devextreme/esm/localization/utils.js"() {
    init_math();
    DECIMAL_BASE = 10;
  }
});

// node_modules/devextreme/esm/localization/ldml/number.js
function getGroupSizes(formatString) {
  return formatString.split(",").slice(1).map(function(str) {
    var singleQuotesLeft = 0;
    return str.split("").filter(function(char, index) {
      singleQuotesLeft += "'" === char;
      var isDigit = "#" === char || "0" === char;
      var isInStub = singleQuotesLeft % 2;
      return isDigit && !isInStub;
    }).length;
  });
}
function getSignParts(format2) {
  var signParts = format2.split(";");
  if (1 === signParts.length) {
    signParts.push("-" + signParts[0]);
  }
  return signParts;
}
function reverseString(str) {
  return str.toString().split("").reverse().join("");
}
function isPercentFormat(format2) {
  return -1 !== format2.indexOf("%") && !format2.match(/'[^']*%[^']*'/g);
}
function removeStubs(str) {
  return str.replace(/'.+'/g, "");
}
function getNonRequiredDigitCount(floatFormat) {
  if (!floatFormat) {
    return 0;
  }
  var format2 = removeStubs(floatFormat);
  return format2.length - format2.replace(/[#]/g, "").length;
}
function getRequiredDigitCount(floatFormat) {
  if (!floatFormat) {
    return 0;
  }
  var format2 = removeStubs(floatFormat);
  return format2.length - format2.replace(/[0]/g, "").length;
}
function normalizeValueString(valuePart, minDigitCount, maxDigitCount) {
  if (!valuePart) {
    return "";
  }
  if (valuePart.length > maxDigitCount) {
    valuePart = valuePart.substr(0, maxDigitCount);
  }
  while (valuePart.length > minDigitCount && "0" === valuePart.slice(-1)) {
    valuePart = valuePart.substr(0, valuePart.length - 1);
  }
  while (valuePart.length < minDigitCount) {
    valuePart += "0";
  }
  return valuePart;
}
function applyGroups(valueString, groupSizes, thousandsSeparator) {
  if (!groupSizes.length) {
    return valueString;
  }
  var groups = [];
  var index = 0;
  while (valueString) {
    var groupSize = groupSizes[index];
    if (!groupSize) {
      break;
    }
    groups.push(valueString.slice(0, groupSize));
    valueString = valueString.slice(groupSize);
    if (index < groupSizes.length - 1) {
      index++;
    }
  }
  return groups.join(thousandsSeparator);
}
function formatNumberPart(format2, valueString) {
  return format2.split(ESCAPING_CHAR).map(function(formatPart, escapeIndex) {
    var isEscape = escapeIndex % 2;
    if (!formatPart && isEscape) {
      return ESCAPING_CHAR;
    }
    return isEscape ? formatPart : formatPart.replace(/[,#0]+/, valueString);
  }).join("");
}
function getFloatPointIndex(format2) {
  var isEscape = false;
  for (var index = 0; index < format2.length; index++) {
    if ("'" === format2[index]) {
      isEscape = !isEscape;
    }
    if ("." === format2[index] && !isEscape) {
      return index;
    }
  }
  return format2.length;
}
function getFormatter(format2, config) {
  config = config || DEFAULT_CONFIG;
  return function(value) {
    if ("number" !== typeof value || isNaN(value)) {
      return "";
    }
    var signFormatParts = getSignParts(format2);
    var isPositiveZero = 1 / value === 1 / 0;
    var isPositive = value > 0 || isPositiveZero;
    var numberFormat = signFormatParts[isPositive ? 0 : 1];
    var floatPointIndex = getFloatPointIndex(numberFormat);
    var floatFormatParts = [numberFormat.substr(0, floatPointIndex), numberFormat.substr(floatPointIndex + 1)];
    var minFloatPrecision = getRequiredDigitCount(floatFormatParts[1]);
    var maxFloatPrecision = minFloatPrecision + getNonRequiredDigitCount(floatFormatParts[1]);
    if (isPercentFormat(numberFormat)) {
      value = multiplyInExponentialForm(value, PERCENT_EXPONENT_SHIFT);
    }
    if (!isPositive) {
      value = -value;
    }
    var minIntegerPrecision = getRequiredDigitCount(floatFormatParts[0]);
    var maxIntegerPrecision = getNonRequiredDigitCount(floatFormatParts[0]) || config.unlimitedIntegerDigits ? void 0 : minIntegerPrecision;
    var integerLength = Math.floor(value).toString().length;
    var floatPrecision = fitIntoRange(maxFloatPrecision, 0, MAXIMUM_NUMBER_LENGTH - integerLength);
    var groupSizes = getGroupSizes(floatFormatParts[0]).reverse();
    var valueParts = toFixed(value, floatPrecision < 0 ? 0 : floatPrecision).split(".");
    var valueIntegerPart = normalizeValueString(reverseString(valueParts[0]), minIntegerPrecision, maxIntegerPrecision);
    var valueFloatPart = normalizeValueString(valueParts[1], minFloatPrecision, maxFloatPrecision);
    valueIntegerPart = applyGroups(valueIntegerPart, groupSizes, config.thousandsSeparator);
    var integerString = reverseString(formatNumberPart(reverseString(floatFormatParts[0]), valueIntegerPart));
    var floatString = maxFloatPrecision ? formatNumberPart(floatFormatParts[1], valueFloatPart) : "";
    var result = integerString + (floatString.match(/\d/) ? config.decimalSeparator : "") + floatString;
    return result;
  };
}
function parseValue(text, isPercent, isNegative) {
  var value = (isPercent ? 0.01 : 1) * parseFloat(text) || 0;
  return isNegative ? -value : value;
}
function prepareValueText(valueText, formatter, isPercent, isIntegerPart) {
  var nextValueText = valueText;
  var char;
  var text;
  var nextText;
  do {
    if (nextText) {
      char = text.length === nextText.length ? "0" : "1";
      valueText = isIntegerPart ? char + valueText : valueText + char;
    }
    text = nextText || formatter(parseValue(nextValueText, isPercent));
    nextValueText = isIntegerPart ? "1" + nextValueText : nextValueText + "1";
    nextText = formatter(parseValue(nextValueText, isPercent));
  } while (text !== nextText && (isIntegerPart ? text.length === nextText.length : text.length <= nextText.length));
  if (isIntegerPart && nextText.length > text.length) {
    var hasGroups = -1 === formatter(12345).indexOf("12345");
    do {
      valueText = "1" + valueText;
    } while (hasGroups && parseValue(valueText, isPercent) < 1e5);
  }
  return valueText;
}
function getFormatByValueText(valueText, formatter, isPercent, isNegative) {
  var format2 = formatter(parseValue(valueText, isPercent, isNegative));
  var valueTextParts = valueText.split(".");
  var valueTextWithModifiedFloat = valueTextParts[0] + ".3" + valueTextParts[1].slice(1);
  var valueWithModifiedFloat = parseValue(valueTextWithModifiedFloat, isPercent, isNegative);
  var decimalSeparatorIndex = formatter(valueWithModifiedFloat).indexOf("3") - 1;
  format2 = format2.replace(/(\d)\D(\d)/g, "$1,$2");
  if (decimalSeparatorIndex >= 0) {
    format2 = format2.slice(0, decimalSeparatorIndex) + "." + format2.slice(decimalSeparatorIndex + 1);
  }
  format2 = format2.replace(/1+/, "1").replace(/1/g, "#");
  if (!isPercent) {
    format2 = format2.replace(/%/g, "'%'");
  }
  return format2;
}
function getFormat(formatter) {
  var valueText = ".";
  var isPercent = formatter(1).indexOf("100") >= 0;
  valueText = prepareValueText(valueText, formatter, isPercent, true);
  valueText = prepareValueText(valueText, formatter, isPercent, false);
  var positiveFormat = getFormatByValueText(valueText, formatter, isPercent, false);
  var negativeFormat = getFormatByValueText(valueText, formatter, isPercent, true);
  return negativeFormat === "-" + positiveFormat ? positiveFormat : positiveFormat + ";" + negativeFormat;
}
var DEFAULT_CONFIG, ESCAPING_CHAR, MAXIMUM_NUMBER_LENGTH, PERCENT_EXPONENT_SHIFT;
var init_number = __esm({
  "node_modules/devextreme/esm/localization/ldml/number.js"() {
    init_math();
    init_utils();
    DEFAULT_CONFIG = {
      thousandsSeparator: ",",
      decimalSeparator: "."
    };
    ESCAPING_CHAR = "'";
    MAXIMUM_NUMBER_LENGTH = 15;
    PERCENT_EXPONENT_SHIFT = 2;
  }
});

// node_modules/devextreme/esm/localization/currency.js
var currency_default;
var init_currency = __esm({
  "node_modules/devextreme/esm/localization/currency.js"() {
    init_extend();
    currency_default = {
      _formatNumberCore: function(value, format2, formatConfig) {
        if ("currency" === format2) {
          formatConfig.precision = formatConfig.precision || 0;
          var result = this.format(value, extend({}, formatConfig, {
            type: "fixedpoint"
          }));
          var currencyPart = this.getCurrencySymbol().symbol.replace(/\$/g, "$$$$");
          result = result.replace(/^(\D*)(\d.*)/, "$1" + currencyPart + "$2");
          return result;
        }
        return this.callBase.apply(this, arguments);
      },
      getCurrencySymbol: function() {
        return {
          symbol: "$"
        };
      },
      getOpenXmlCurrencyFormat: function() {
        return "$#,##0{0}_);\\($#,##0{0}\\)";
      }
    };
  }
});

// node_modules/devextreme/esm/localization/open_xml_currency_format.js
var open_xml_currency_format_default;
var init_open_xml_currency_format = __esm({
  "node_modules/devextreme/esm/localization/open_xml_currency_format.js"() {
    open_xml_currency_format_default = (currencySymbol, accountingFormat) => {
      if (!accountingFormat) {
        return;
      }
      var encodedCurrencySymbol = currencySymbol;
      if ("string" === typeof currencySymbol) {
        encodedCurrencySymbol = "";
        for (var i = 0; i < currencySymbol.length; i++) {
          if ("$" !== currencySymbol[i]) {
            encodedCurrencySymbol += "\\";
          }
          encodedCurrencySymbol += currencySymbol[i];
        }
      }
      var encodeSymbols = {
        ".00": "{0}",
        "'": "\\'",
        "\\(": "\\(",
        "\\)": "\\)",
        " ": "\\ ",
        '"': "&quot;",
        "\\¤": encodedCurrencySymbol
      };
      var result = accountingFormat.split(";");
      for (var _i = 0; _i < result.length; _i++) {
        for (var symbol in encodeSymbols) {
          if (Object.prototype.hasOwnProperty.call(encodeSymbols, symbol)) {
            result[_i] = result[_i].replace(new RegExp(symbol, "g"), encodeSymbols[symbol]);
          }
        }
      }
      return 2 === result.length ? result[0] + "_);" + result[1] : result[0];
    };
  }
});

// node_modules/devextreme/esm/localization/cldr-data/accounting_formats.js
var accounting_formats_default;
var init_accounting_formats = __esm({
  "node_modules/devextreme/esm/localization/cldr-data/accounting_formats.js"() {
    accounting_formats_default = {
      af: "¤#,##0.00;(¤#,##0.00)",
      "af-NA": "¤#,##0.00;(¤#,##0.00)",
      agq: "#,##0.00¤",
      ak: "¤#,##0.00",
      am: "¤#,##0.00;(¤#,##0.00)",
      ar: "¤#,##0.00;(¤#,##0.00)",
      "ar-AE": "¤#,##0.00;(¤#,##0.00)",
      "ar-BH": "¤#,##0.00;(¤#,##0.00)",
      "ar-DJ": "¤#,##0.00;(¤#,##0.00)",
      "ar-DZ": "¤#,##0.00;(¤#,##0.00)",
      "ar-EG": "¤#,##0.00;(¤#,##0.00)",
      "ar-EH": "¤#,##0.00;(¤#,##0.00)",
      "ar-ER": "¤#,##0.00;(¤#,##0.00)",
      "ar-IL": "¤#,##0.00;(¤#,##0.00)",
      "ar-IQ": "¤#,##0.00;(¤#,##0.00)",
      "ar-JO": "¤#,##0.00;(¤#,##0.00)",
      "ar-KM": "¤#,##0.00;(¤#,##0.00)",
      "ar-KW": "¤#,##0.00;(¤#,##0.00)",
      "ar-LB": "¤#,##0.00;(¤#,##0.00)",
      "ar-LY": "¤#,##0.00;(¤#,##0.00)",
      "ar-MA": "¤#,##0.00;(¤#,##0.00)",
      "ar-MR": "¤#,##0.00;(¤#,##0.00)",
      "ar-OM": "¤#,##0.00;(¤#,##0.00)",
      "ar-PS": "¤#,##0.00;(¤#,##0.00)",
      "ar-QA": "¤#,##0.00;(¤#,##0.00)",
      "ar-SA": "¤#,##0.00;(¤#,##0.00)",
      "ar-SD": "¤#,##0.00;(¤#,##0.00)",
      "ar-SO": "¤#,##0.00;(¤#,##0.00)",
      "ar-SS": "¤#,##0.00;(¤#,##0.00)",
      "ar-SY": "¤#,##0.00;(¤#,##0.00)",
      "ar-TD": "¤#,##0.00;(¤#,##0.00)",
      "ar-TN": "¤#,##0.00;(¤#,##0.00)",
      "ar-YE": "¤#,##0.00;(¤#,##0.00)",
      as: "¤ #,##,##0.00",
      asa: "#,##0.00 ¤",
      ast: "#,##0.00 ¤",
      az: "#,##0.00 ¤",
      "az-Cyrl": "#,##0.00 ¤",
      "az-Latn": "#,##0.00 ¤",
      bas: "#,##0.00 ¤",
      be: "#,##0.00 ¤",
      "be-tarask": "#,##0.00 ¤",
      bem: "¤#,##0.00;(¤#,##0.00)",
      bez: "#,##0.00¤",
      bg: "0.00 ¤;(0.00 ¤)",
      bm: "¤#,##0.00;(¤#,##0.00)",
      bn: "#,##,##0.00¤;(#,##,##0.00¤)",
      "bn-IN": "#,##,##0.00¤;(#,##,##0.00¤)",
      bo: "¤ #,##0.00",
      "bo-IN": "¤ #,##0.00",
      br: "#,##0.00 ¤",
      brx: "¤ #,##,##0.00",
      bs: "#,##0.00 ¤",
      "bs-Cyrl": "#,##0.00 ¤",
      "bs-Latn": "#,##0.00 ¤",
      ca: "#,##0.00 ¤;(#,##0.00 ¤)",
      "ca-AD": "#,##0.00 ¤;(#,##0.00 ¤)",
      "ca-ES-valencia": "#,##0.00 ¤;(#,##0.00 ¤)",
      "ca-FR": "#,##0.00 ¤;(#,##0.00 ¤)",
      "ca-IT": "#,##0.00 ¤;(#,##0.00 ¤)",
      ccp: "#,##,##0.00¤;(#,##,##0.00¤)",
      "ccp-IN": "#,##,##0.00¤;(#,##,##0.00¤)",
      ce: "#,##0.00 ¤",
      ceb: "¤#,##0.00;(¤#,##0.00)",
      cgg: "¤#,##0.00",
      chr: "¤#,##0.00;(¤#,##0.00)",
      ckb: "¤ #,##0.00",
      "ckb-IR": "¤ #,##0.00",
      cs: "#,##0.00 ¤",
      cy: "¤#,##0.00;(¤#,##0.00)",
      da: "#,##0.00 ¤",
      "da-GL": "#,##0.00 ¤",
      dav: "¤#,##0.00;(¤#,##0.00)",
      de: "#,##0.00 ¤",
      "de-AT": "#,##0.00 ¤",
      "de-BE": "#,##0.00 ¤",
      "de-CH": "#,##0.00 ¤",
      "de-IT": "#,##0.00 ¤",
      "de-LI": "#,##0.00 ¤",
      "de-LU": "#,##0.00 ¤",
      dje: "#,##0.00¤",
      doi: "¤#,##0.00",
      dsb: "#,##0.00 ¤",
      dua: "#,##0.00 ¤",
      dyo: "#,##0.00 ¤",
      dz: "¤#,##,##0.00",
      ebu: "¤#,##0.00;(¤#,##0.00)",
      ee: "¤#,##0.00;(¤#,##0.00)",
      "ee-TG": "¤#,##0.00;(¤#,##0.00)",
      el: "#,##0.00 ¤",
      "el-CY": "#,##0.00 ¤",
      en: "¤#,##0.00;(¤#,##0.00)",
      "en-001": "¤#,##0.00;(¤#,##0.00)",
      "en-150": "#,##0.00 ¤",
      "en-AE": "¤#,##0.00;(¤#,##0.00)",
      "en-AG": "¤#,##0.00;(¤#,##0.00)",
      "en-AI": "¤#,##0.00;(¤#,##0.00)",
      "en-AS": "¤#,##0.00;(¤#,##0.00)",
      "en-AT": "¤ #,##0.00",
      "en-AU": "¤#,##0.00;(¤#,##0.00)",
      "en-BB": "¤#,##0.00;(¤#,##0.00)",
      "en-BE": "#,##0.00 ¤",
      "en-BI": "¤#,##0.00;(¤#,##0.00)",
      "en-BM": "¤#,##0.00;(¤#,##0.00)",
      "en-BS": "¤#,##0.00;(¤#,##0.00)",
      "en-BW": "¤#,##0.00;(¤#,##0.00)",
      "en-BZ": "¤#,##0.00;(¤#,##0.00)",
      "en-CA": "¤#,##0.00;(¤#,##0.00)",
      "en-CC": "¤#,##0.00;(¤#,##0.00)",
      "en-CH": "¤ #,##0.00;¤-#,##0.00",
      "en-CK": "¤#,##0.00;(¤#,##0.00)",
      "en-CM": "¤#,##0.00;(¤#,##0.00)",
      "en-CX": "¤#,##0.00;(¤#,##0.00)",
      "en-CY": "¤#,##0.00;(¤#,##0.00)",
      "en-DE": "#,##0.00 ¤",
      "en-DG": "¤#,##0.00;(¤#,##0.00)",
      "en-DK": "#,##0.00 ¤",
      "en-DM": "¤#,##0.00;(¤#,##0.00)",
      "en-ER": "¤#,##0.00;(¤#,##0.00)",
      "en-FI": "#,##0.00 ¤",
      "en-FJ": "¤#,##0.00;(¤#,##0.00)",
      "en-FK": "¤#,##0.00;(¤#,##0.00)",
      "en-FM": "¤#,##0.00;(¤#,##0.00)",
      "en-GB": "¤#,##0.00;(¤#,##0.00)",
      "en-GD": "¤#,##0.00;(¤#,##0.00)",
      "en-GG": "¤#,##0.00;(¤#,##0.00)",
      "en-GH": "¤#,##0.00;(¤#,##0.00)",
      "en-GI": "¤#,##0.00;(¤#,##0.00)",
      "en-GM": "¤#,##0.00;(¤#,##0.00)",
      "en-GU": "¤#,##0.00;(¤#,##0.00)",
      "en-GY": "¤#,##0.00;(¤#,##0.00)",
      "en-HK": "¤#,##0.00;(¤#,##0.00)",
      "en-IE": "¤#,##0.00;(¤#,##0.00)",
      "en-IL": "¤#,##0.00;(¤#,##0.00)",
      "en-IM": "¤#,##0.00;(¤#,##0.00)",
      "en-IN": "¤#,##0.00;(¤#,##0.00)",
      "en-IO": "¤#,##0.00;(¤#,##0.00)",
      "en-JE": "¤#,##0.00;(¤#,##0.00)",
      "en-JM": "¤#,##0.00;(¤#,##0.00)",
      "en-KE": "¤#,##0.00;(¤#,##0.00)",
      "en-KI": "¤#,##0.00;(¤#,##0.00)",
      "en-KN": "¤#,##0.00;(¤#,##0.00)",
      "en-KY": "¤#,##0.00;(¤#,##0.00)",
      "en-LC": "¤#,##0.00;(¤#,##0.00)",
      "en-LR": "¤#,##0.00;(¤#,##0.00)",
      "en-LS": "¤#,##0.00;(¤#,##0.00)",
      "en-MG": "¤#,##0.00;(¤#,##0.00)",
      "en-MH": "¤#,##0.00;(¤#,##0.00)",
      "en-MO": "¤#,##0.00;(¤#,##0.00)",
      "en-MP": "¤#,##0.00;(¤#,##0.00)",
      "en-MS": "¤#,##0.00;(¤#,##0.00)",
      "en-MT": "¤#,##0.00;(¤#,##0.00)",
      "en-MU": "¤#,##0.00;(¤#,##0.00)",
      "en-MV": "¤ #,##0.00",
      "en-MW": "¤#,##0.00;(¤#,##0.00)",
      "en-MY": "¤#,##0.00;(¤#,##0.00)",
      "en-NA": "¤#,##0.00;(¤#,##0.00)",
      "en-NF": "¤#,##0.00;(¤#,##0.00)",
      "en-NG": "¤#,##0.00;(¤#,##0.00)",
      "en-NL": "¤ #,##0.00;(¤ #,##0.00)",
      "en-NR": "¤#,##0.00;(¤#,##0.00)",
      "en-NU": "¤#,##0.00;(¤#,##0.00)",
      "en-NZ": "¤#,##0.00;(¤#,##0.00)",
      "en-PG": "¤#,##0.00;(¤#,##0.00)",
      "en-PH": "¤#,##0.00;(¤#,##0.00)",
      "en-PK": "¤#,##0.00;(¤#,##0.00)",
      "en-PN": "¤#,##0.00;(¤#,##0.00)",
      "en-PR": "¤#,##0.00;(¤#,##0.00)",
      "en-PW": "¤#,##0.00;(¤#,##0.00)",
      "en-RW": "¤#,##0.00;(¤#,##0.00)",
      "en-SB": "¤#,##0.00;(¤#,##0.00)",
      "en-SC": "¤#,##0.00;(¤#,##0.00)",
      "en-SD": "¤#,##0.00;(¤#,##0.00)",
      "en-SE": "#,##0.00 ¤",
      "en-SG": "¤#,##0.00;(¤#,##0.00)",
      "en-SH": "¤#,##0.00;(¤#,##0.00)",
      "en-SI": "#,##0.00 ¤;(#,##0.00 ¤)",
      "en-SL": "¤#,##0.00;(¤#,##0.00)",
      "en-SS": "¤#,##0.00;(¤#,##0.00)",
      "en-SX": "¤#,##0.00;(¤#,##0.00)",
      "en-SZ": "¤#,##0.00;(¤#,##0.00)",
      "en-TC": "¤#,##0.00;(¤#,##0.00)",
      "en-TK": "¤#,##0.00;(¤#,##0.00)",
      "en-TO": "¤#,##0.00;(¤#,##0.00)",
      "en-TT": "¤#,##0.00;(¤#,##0.00)",
      "en-TV": "¤#,##0.00;(¤#,##0.00)",
      "en-TZ": "¤#,##0.00;(¤#,##0.00)",
      "en-UG": "¤#,##0.00;(¤#,##0.00)",
      "en-UM": "¤#,##0.00;(¤#,##0.00)",
      "en-VC": "¤#,##0.00;(¤#,##0.00)",
      "en-VG": "¤#,##0.00;(¤#,##0.00)",
      "en-VI": "¤#,##0.00;(¤#,##0.00)",
      "en-VU": "¤#,##0.00;(¤#,##0.00)",
      "en-WS": "¤#,##0.00;(¤#,##0.00)",
      "en-ZA": "¤#,##0.00;(¤#,##0.00)",
      "en-ZM": "¤#,##0.00;(¤#,##0.00)",
      "en-ZW": "¤#,##0.00;(¤#,##0.00)",
      eo: "¤ #,##0.00",
      es: "#,##0.00 ¤",
      "es-419": "¤#,##0.00",
      "es-AR": "¤ #,##0.00;(¤ #,##0.00)",
      "es-BO": "¤#,##0.00",
      "es-BR": "¤#,##0.00",
      "es-BZ": "¤#,##0.00",
      "es-CL": "¤#,##0.00",
      "es-CO": "¤#,##0.00",
      "es-CR": "¤#,##0.00",
      "es-CU": "¤#,##0.00",
      "es-DO": "¤#,##0.00;(¤#,##0.00)",
      "es-EA": "#,##0.00 ¤",
      "es-EC": "¤#,##0.00",
      "es-GQ": "#,##0.00 ¤",
      "es-GT": "¤#,##0.00",
      "es-HN": "¤#,##0.00",
      "es-IC": "#,##0.00 ¤",
      "es-MX": "¤#,##0.00",
      "es-NI": "¤#,##0.00",
      "es-PA": "¤#,##0.00",
      "es-PE": "¤#,##0.00",
      "es-PH": "#,##0.00 ¤",
      "es-PR": "¤#,##0.00",
      "es-PY": "¤#,##0.00",
      "es-SV": "¤#,##0.00",
      "es-US": "¤#,##0.00",
      "es-UY": "¤ #,##0.00;(¤ #,##0.00)",
      "es-VE": "¤#,##0.00",
      et: "#,##0.00 ¤;(#,##0.00 ¤)",
      eu: "#,##0.00 ¤;(#,##0.00 ¤)",
      ewo: "#,##0.00 ¤",
      fa: "‎¤ #,##0.00;‎(¤ #,##0.00)",
      "fa-AF": "¤ #,##0.00;‎(¤ #,##0.00)",
      ff: "#,##0.00 ¤",
      "ff-Adlm": "¤ #,##0.00",
      "ff-Adlm-BF": "¤ #,##0.00",
      "ff-Adlm-CM": "¤ #,##0.00",
      "ff-Adlm-GH": "¤ #,##0.00",
      "ff-Adlm-GM": "¤ #,##0.00",
      "ff-Adlm-GW": "¤ #,##0.00",
      "ff-Adlm-LR": "¤ #,##0.00",
      "ff-Adlm-MR": "¤ #,##0.00",
      "ff-Adlm-NE": "¤ #,##0.00",
      "ff-Adlm-NG": "¤ #,##0.00",
      "ff-Adlm-SL": "¤ #,##0.00",
      "ff-Adlm-SN": "¤ #,##0.00",
      "ff-Latn": "#,##0.00 ¤",
      "ff-Latn-BF": "#,##0.00 ¤",
      "ff-Latn-CM": "#,##0.00 ¤",
      "ff-Latn-GH": "#,##0.00 ¤",
      "ff-Latn-GM": "#,##0.00 ¤",
      "ff-Latn-GN": "#,##0.00 ¤",
      "ff-Latn-GW": "#,##0.00 ¤",
      "ff-Latn-LR": "#,##0.00 ¤",
      "ff-Latn-MR": "#,##0.00 ¤",
      "ff-Latn-NE": "#,##0.00 ¤",
      "ff-Latn-NG": "#,##0.00 ¤",
      "ff-Latn-SL": "#,##0.00 ¤",
      fi: "#,##0.00 ¤",
      fil: "¤#,##0.00;(¤#,##0.00)",
      fo: "#,##0.00 ¤;(#,##0.00 ¤)",
      "fo-DK": "#,##0.00 ¤;(#,##0.00 ¤)",
      fr: "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-BE": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-BF": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-BI": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-BJ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-BL": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CA": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CD": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CF": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CG": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CH": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CI": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-CM": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-DJ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-DZ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-GA": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-GF": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-GN": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-GP": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-GQ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-HT": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-KM": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-LU": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MA": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MC": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MF": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MG": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-ML": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MQ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MR": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-MU": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-NC": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-NE": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-PF": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-PM": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-RE": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-RW": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-SC": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-SN": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-SY": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-TD": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-TG": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-TN": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-VU": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-WF": "#,##0.00 ¤;(#,##0.00 ¤)",
      "fr-YT": "#,##0.00 ¤;(#,##0.00 ¤)",
      fur: "¤ #,##0.00",
      fy: "¤ #,##0.00;(¤ #,##0.00)",
      ga: "¤#,##0.00;(¤#,##0.00)",
      "ga-GB": "¤#,##0.00;(¤#,##0.00)",
      gd: "¤#,##0.00;(¤#,##0.00)",
      gl: "#,##0.00 ¤",
      gsw: "#,##0.00 ¤",
      "gsw-FR": "#,##0.00 ¤",
      "gsw-LI": "#,##0.00 ¤",
      gu: "¤#,##,##0.00;(¤#,##,##0.00)",
      guz: "¤#,##0.00;(¤#,##0.00)",
      gv: "¤#,##0.00",
      ha: "¤ #,##0.00",
      "ha-GH": "¤ #,##0.00",
      "ha-NE": "¤ #,##0.00",
      haw: "¤#,##0.00;(¤#,##0.00)",
      he: "#,##0.00 ¤",
      hi: "¤#,##,##0.00",
      "hi-Latn": "¤#,##,##0.00",
      hr: "#,##0.00 ¤",
      "hr-BA": "#,##0.00 ¤",
      hsb: "#,##0.00 ¤",
      hu: "#,##0.00 ¤",
      hy: "#,##0.00 ¤",
      ia: "¤ #,##0.00;(¤ #,##0.00)",
      id: "¤#,##0.00",
      ig: "¤#,##0.00;(¤#,##0.00)",
      ii: "¤ #,##0.00",
      is: "#,##0.00 ¤",
      it: "#,##0.00 ¤",
      "it-CH": "#,##0.00 ¤",
      "it-SM": "#,##0.00 ¤",
      "it-VA": "#,##0.00 ¤",
      ja: "¤#,##0.00;(¤#,##0.00)",
      jgo: "¤ #,##0.00",
      jmc: "¤#,##0.00",
      jv: "¤ #,##0.00",
      ka: "#,##0.00 ¤",
      kab: "#,##0.00¤",
      kam: "¤#,##0.00;(¤#,##0.00)",
      kde: "¤#,##0.00;(¤#,##0.00)",
      kea: "#,##0.00 ¤;(#,##0.00 ¤)",
      kgp: "¤ #,##0.00",
      khq: "#,##0.00¤",
      ki: "¤#,##0.00;(¤#,##0.00)",
      kk: "#,##0.00 ¤",
      kkj: "¤ #,##0.00",
      kl: "¤#,##0.00;¤-#,##0.00",
      kln: "¤#,##0.00;(¤#,##0.00)",
      km: "#,##0.00¤;(#,##0.00¤)",
      kn: "¤#,##0.00;(¤#,##0.00)",
      ko: "¤#,##0.00;(¤#,##0.00)",
      "ko-KP": "¤#,##0.00;(¤#,##0.00)",
      kok: "¤#,##0.00;(¤#,##0.00)",
      ks: "¤#,##0.00",
      "ks-Arab": "¤#,##0.00",
      "ks-Deva": "¤ #,##0.00",
      ksb: "#,##0.00¤",
      ksf: "#,##0.00 ¤",
      ksh: "#,##0.00 ¤",
      ku: "#,##0.00 ¤;(#,##0.00 ¤)",
      kw: "¤#,##0.00",
      ky: "#,##0.00 ¤",
      lag: "¤ #,##0.00",
      lb: "#,##0.00 ¤",
      lg: "#,##0.00¤",
      lkt: "¤ #,##0.00",
      ln: "#,##0.00 ¤",
      "ln-AO": "#,##0.00 ¤",
      "ln-CF": "#,##0.00 ¤",
      "ln-CG": "#,##0.00 ¤",
      lo: "¤#,##0.00;¤-#,##0.00",
      lrc: "¤ #,##0.00",
      "lrc-IQ": "¤ #,##0.00",
      lt: "#,##0.00 ¤",
      lu: "#,##0.00¤",
      luo: "#,##0.00¤",
      luy: "¤#,##0.00;¤- #,##0.00",
      lv: "#,##0.00 ¤",
      mai: "¤ #,##0.00",
      mas: "¤#,##0.00;(¤#,##0.00)",
      "mas-TZ": "¤#,##0.00;(¤#,##0.00)",
      mer: "¤#,##0.00;(¤#,##0.00)",
      mfe: "¤ #,##0.00",
      mg: "¤#,##0.00",
      mgh: "¤ #,##0.00",
      mgo: "¤ #,##0.00",
      mi: "¤ #,##0.00",
      mk: "#,##0.00 ¤",
      ml: "¤#,##0.00;(¤#,##0.00)",
      mn: "¤ #,##0.00",
      mni: "¤ #,##0.00",
      "mni-Beng": "¤ #,##0.00",
      mr: "¤#,##0.00;(¤#,##0.00)",
      ms: "¤#,##0.00;(¤#,##0.00)",
      "ms-BN": "¤#,##0.00;(¤#,##0.00)",
      "ms-ID": "¤#,##0.00",
      "ms-SG": "¤#,##0.00;(¤#,##0.00)",
      mt: "¤#,##0.00",
      mua: "¤#,##0.00;(¤#,##0.00)",
      my: "¤ #,##0.00",
      mzn: "¤ #,##0.00",
      naq: "¤#,##0.00",
      nb: "¤ #,##0.00;(¤ #,##0.00)",
      "nb-SJ": "¤ #,##0.00;(¤ #,##0.00)",
      nd: "¤#,##0.00;(¤#,##0.00)",
      nds: "¤ #,##0.00",
      "nds-NL": "¤ #,##0.00",
      ne: "¤ #,##,##0.00",
      "ne-IN": "¤ #,##,##0.00",
      nl: "¤ #,##0.00;(¤ #,##0.00)",
      "nl-AW": "¤ #,##0.00;(¤ #,##0.00)",
      "nl-BE": "¤ #,##0.00;(¤ #,##0.00)",
      "nl-BQ": "¤ #,##0.00;(¤ #,##0.00)",
      "nl-CW": "¤ #,##0.00;(¤ #,##0.00)",
      "nl-SR": "¤ #,##0.00;(¤ #,##0.00)",
      "nl-SX": "¤ #,##0.00;(¤ #,##0.00)",
      nmg: "#,##0.00 ¤",
      nn: "#,##0.00 ¤",
      nnh: "¤ #,##0.00",
      no: "¤ #,##0.00;(¤ #,##0.00)",
      nus: "¤#,##0.00;(¤#,##0.00)",
      nyn: "¤#,##0.00",
      om: "¤#,##0.00",
      "om-KE": "¤#,##0.00",
      or: "¤#,##0.00;(¤#,##0.00)",
      os: "¤ #,##0.00",
      "os-RU": "¤ #,##0.00",
      pa: "¤ #,##0.00",
      "pa-Arab": "¤ #,##0.00",
      "pa-Guru": "¤ #,##0.00",
      pcm: "¤#,##0.00",
      pl: "#,##0.00 ¤;(#,##0.00 ¤)",
      ps: "¤#,##0.00;(¤#,##0.00)",
      "ps-PK": "¤#,##0.00;(¤#,##0.00)",
      pt: "¤ #,##0.00",
      "pt-AO": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-CH": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-CV": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-GQ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-GW": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-LU": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-MO": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-MZ": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-PT": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-ST": "#,##0.00 ¤;(#,##0.00 ¤)",
      "pt-TL": "#,##0.00 ¤;(#,##0.00 ¤)",
      qu: "¤ #,##0.00",
      "qu-BO": "¤ #,##0.00",
      "qu-EC": "¤ #,##0.00",
      rm: "#,##0.00 ¤",
      rn: "#,##0.00¤",
      ro: "#,##0.00 ¤;(#,##0.00 ¤)",
      "ro-MD": "#,##0.00 ¤;(#,##0.00 ¤)",
      rof: "¤#,##0.00",
      ru: "#,##0.00 ¤",
      "ru-BY": "#,##0.00 ¤",
      "ru-KG": "#,##0.00 ¤",
      "ru-KZ": "#,##0.00 ¤",
      "ru-MD": "#,##0.00 ¤",
      "ru-UA": "#,##0.00 ¤",
      rw: "¤ #,##0.00",
      rwk: "#,##0.00¤",
      sa: "¤ #,##0.00",
      sah: "#,##0.00 ¤",
      saq: "¤#,##0.00;(¤#,##0.00)",
      sat: "¤ #,##0.00",
      "sat-Olck": "¤ #,##0.00",
      sbp: "#,##0.00¤",
      sc: "#,##0.00 ¤",
      sd: "¤ #,##0.00",
      "sd-Arab": "¤ #,##0.00",
      "sd-Deva": "¤ #,##0.00",
      se: "#,##0.00 ¤",
      "se-FI": "#,##0.00 ¤",
      "se-SE": "#,##0.00 ¤",
      seh: "#,##0.00¤",
      ses: "#,##0.00¤",
      sg: "¤#,##0.00;¤-#,##0.00",
      shi: "#,##0.00¤",
      "shi-Latn": "#,##0.00¤",
      "shi-Tfng": "#,##0.00¤",
      si: "¤#,##0.00;(¤#,##0.00)",
      sk: "#,##0.00 ¤;(#,##0.00 ¤)",
      sl: "#,##0.00 ¤;(#,##0.00 ¤)",
      smn: "#,##0.00 ¤",
      sn: "¤#,##0.00;(¤#,##0.00)",
      so: "¤#,##0.00;(¤#,##0.00)",
      "so-DJ": "¤#,##0.00;(¤#,##0.00)",
      "so-ET": "¤#,##0.00;(¤#,##0.00)",
      "so-KE": "¤#,##0.00;(¤#,##0.00)",
      sq: "#,##0.00 ¤;(#,##0.00 ¤)",
      "sq-MK": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sq-XK": "#,##0.00 ¤;(#,##0.00 ¤)",
      sr: "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Cyrl": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Cyrl-BA": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Cyrl-ME": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Cyrl-XK": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Latn": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Latn-BA": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Latn-ME": "#,##0.00 ¤;(#,##0.00 ¤)",
      "sr-Latn-XK": "#,##0.00 ¤;(#,##0.00 ¤)",
      su: "¤#,##0.00",
      "su-Latn": "¤#,##0.00",
      sv: "#,##0.00 ¤",
      "sv-AX": "#,##0.00 ¤",
      "sv-FI": "#,##0.00 ¤",
      sw: "¤ #,##0.00",
      "sw-CD": "¤ #,##0.00",
      "sw-KE": "¤ #,##0.00",
      "sw-UG": "¤ #,##0.00",
      ta: "¤#,##0.00;(¤#,##0.00)",
      "ta-LK": "¤#,##0.00;(¤#,##0.00)",
      "ta-MY": "¤#,##0.00;(¤#,##0.00)",
      "ta-SG": "¤#,##0.00;(¤#,##0.00)",
      te: "¤#,##0.00;(¤#,##0.00)",
      teo: "¤#,##0.00;(¤#,##0.00)",
      "teo-KE": "¤#,##0.00;(¤#,##0.00)",
      tg: "#,##0.00 ¤",
      th: "¤#,##0.00;(¤#,##0.00)",
      ti: "¤#,##0.00",
      "ti-ER": "¤#,##0.00",
      tk: "#,##0.00 ¤",
      to: "¤ #,##0.00",
      tr: "¤#,##0.00;(¤#,##0.00)",
      "tr-CY": "¤#,##0.00;(¤#,##0.00)",
      tt: "#,##0.00 ¤",
      twq: "#,##0.00¤",
      tzm: "#,##0.00 ¤",
      ug: "¤#,##0.00;(¤#,##0.00)",
      uk: "#,##0.00 ¤",
      und: "¤ #,##0.00",
      ur: "¤#,##0.00;(¤#,##0.00)",
      "ur-IN": "¤#,##0.00;(¤#,##0.00)",
      uz: "#,##0.00 ¤",
      "uz-Arab": "¤ #,##0.00",
      "uz-Cyrl": "#,##0.00 ¤",
      "uz-Latn": "#,##0.00 ¤",
      vai: "¤#,##0.00;(¤#,##0.00)",
      "vai-Latn": "¤#,##0.00;(¤#,##0.00)",
      "vai-Vaii": "¤#,##0.00;(¤#,##0.00)",
      vi: "#,##0.00 ¤",
      vun: "¤#,##0.00",
      wae: "¤ #,##0.00",
      wo: "¤ #,##0.00",
      xh: "¤#,##0.00",
      xog: "#,##0.00 ¤",
      yav: "#,##0.00 ¤;(#,##0.00 ¤)",
      yi: "¤ #,##0.00",
      yo: "¤#,##0.00;(¤#,##0.00)",
      "yo-BJ": "¤#,##0.00;(¤#,##0.00)",
      yrl: "¤ #,##0.00",
      "yrl-CO": "¤ #,##0.00",
      "yrl-VE": "¤ #,##0.00",
      yue: "¤#,##0.00;(¤#,##0.00)",
      "yue-Hans": "¤#,##0.00;(¤#,##0.00)",
      "yue-Hant": "¤#,##0.00;(¤#,##0.00)",
      zgh: "#,##0.00¤",
      zh: "¤#,##0.00;(¤#,##0.00)",
      "zh-Hans": "¤#,##0.00;(¤#,##0.00)",
      "zh-Hans-HK": "¤#,##0.00;(¤#,##0.00)",
      "zh-Hans-MO": "¤#,##0.00;(¤#,##0.00)",
      "zh-Hans-SG": "¤#,##0.00;(¤#,##0.00)",
      "zh-Hant": "¤#,##0.00;(¤#,##0.00)",
      "zh-Hant-HK": "¤#,##0.00;(¤#,##0.00)",
      "zh-Hant-MO": "¤#,##0.00;(¤#,##0.00)",
      zu: "¤#,##0.00;(¤#,##0.00)"
    };
  }
});

// node_modules/devextreme/esm/localization/intl/number.js
var CURRENCY_STYLES, MAX_FRACTION_DIGITS, detectCurrencySymbolRegex, formattersCache, getFormatter2, getCurrencyFormatter, number_default;
var init_number2 = __esm({
  "node_modules/devextreme/esm/localization/intl/number.js"() {
    init_config();
    init_core();
    init_open_xml_currency_format();
    init_accounting_formats();
    CURRENCY_STYLES = ["standard", "accounting"];
    MAX_FRACTION_DIGITS = 20;
    detectCurrencySymbolRegex = /([^\s0]+)?(\s*)0*[.,]*0*(\s*)([^\s0]+)?/;
    formattersCache = {};
    getFormatter2 = (format2) => {
      var key = core_default.locale() + "/" + JSON.stringify(format2);
      if (!formattersCache[key]) {
        formattersCache[key] = new Intl.NumberFormat(core_default.locale(), format2).format;
      }
      return formattersCache[key];
    };
    getCurrencyFormatter = (currency) => new Intl.NumberFormat(core_default.locale(), {
      style: "currency",
      currency
    });
    number_default = {
      engine: function() {
        return "intl";
      },
      _formatNumberCore: function(value, format2, formatConfig) {
        if ("exponential" === format2) {
          return this.callBase.apply(this, arguments);
        }
        return getFormatter2(this._normalizeFormatConfig(format2, formatConfig, value))(value);
      },
      _normalizeFormatConfig: function(format2, formatConfig, value) {
        var config;
        if ("decimal" === format2) {
          var fractionDigits = String(value).split(".")[1];
          config = {
            minimumIntegerDigits: formatConfig.precision || void 0,
            useGrouping: false,
            maximumFractionDigits: fractionDigits && fractionDigits.length,
            round: value < 0 ? "ceil" : "floor"
          };
        } else {
          config = this._getPrecisionConfig(formatConfig.precision);
        }
        if ("percent" === format2) {
          config.style = "percent";
        } else if ("currency" === format2) {
          var _formatConfig$useCurr;
          var useAccountingStyle = null !== (_formatConfig$useCurr = formatConfig.useCurrencyAccountingStyle) && void 0 !== _formatConfig$useCurr ? _formatConfig$useCurr : config_default().defaultUseCurrencyAccountingStyle;
          config.style = "currency";
          config.currency = formatConfig.currency || config_default().defaultCurrency;
          config.currencySign = CURRENCY_STYLES[+useAccountingStyle];
        }
        return config;
      },
      _getPrecisionConfig: function(precision) {
        var config;
        if (null === precision) {
          config = {
            minimumFractionDigits: 0,
            maximumFractionDigits: MAX_FRACTION_DIGITS
          };
        } else {
          config = {
            minimumFractionDigits: precision || 0,
            maximumFractionDigits: precision || 0
          };
        }
        return config;
      },
      format: function(value, _format) {
        if ("number" !== typeof value) {
          return value;
        }
        _format = this._normalizeFormat(_format);
        if ("default" === _format.currency) {
          _format.currency = config_default().defaultCurrency;
        }
        if (!_format || "function" !== typeof _format && !_format.type && !_format.formatter) {
          return getFormatter2(_format)(value);
        }
        return this.callBase.apply(this, arguments);
      },
      _getCurrencySymbolInfo: function(currency) {
        var formatter = getCurrencyFormatter(currency);
        return this._extractCurrencySymbolInfo(formatter.format(0));
      },
      _extractCurrencySymbolInfo: function(currencyValueString) {
        var match = detectCurrencySymbolRegex.exec(currencyValueString) || [];
        var position = match[1] ? "before" : "after";
        var symbol = match[1] || match[4] || "";
        var delimiter = match[2] || match[3] || "";
        return {
          position,
          symbol,
          delimiter
        };
      },
      getCurrencySymbol: function(currency) {
        if (!currency) {
          currency = config_default().defaultCurrency;
        }
        var symbolInfo = this._getCurrencySymbolInfo(currency);
        return {
          symbol: symbolInfo.symbol
        };
      },
      getOpenXmlCurrencyFormat: function(currency) {
        var targetCurrency = currency || config_default().defaultCurrency;
        var currencySymbol = this._getCurrencySymbolInfo(targetCurrency).symbol;
        var closestAccountingFormat = core_default.getValueByClosestLocale((locale2) => accounting_formats_default[locale2]);
        return open_xml_currency_format_default(currencySymbol, closestAccountingFormat);
      }
    };
  }
});

// node_modules/devextreme/esm/localization/number.js
var hasIntl, MAX_LARGE_NUMBER_POWER, DECIMAL_BASE2, NUMERIC_FORMATS, LargeNumberFormatPostfixes, LargeNumberFormatPowers, numberLocalization, number_default2;
var init_number3 = __esm({
  "node_modules/devextreme/esm/localization/number.js"() {
    init_dependency_injector();
    init_common();
    init_iterator();
    init_type();
    init_number();
    init_config();
    init_errors();
    init_utils();
    init_currency();
    init_number2();
    hasIntl = "undefined" !== typeof Intl;
    MAX_LARGE_NUMBER_POWER = 4;
    DECIMAL_BASE2 = 10;
    NUMERIC_FORMATS = ["currency", "fixedpoint", "exponential", "percent", "decimal"];
    LargeNumberFormatPostfixes = {
      1: "K",
      2: "M",
      3: "B",
      4: "T"
    };
    LargeNumberFormatPowers = {
      largenumber: "auto",
      thousands: 1,
      millions: 2,
      billions: 3,
      trillions: 4
    };
    numberLocalization = dependency_injector_default({
      engine: function() {
        return "base";
      },
      numericFormats: NUMERIC_FORMATS,
      defaultLargeNumberFormatPostfixes: LargeNumberFormatPostfixes,
      _parseNumberFormatString: function(formatType) {
        var formatObject = {};
        if (!formatType || "string" !== typeof formatType) {
          return;
        }
        var formatList = formatType.toLowerCase().split(" ");
        each(formatList, (index, value) => {
          if (NUMERIC_FORMATS.includes(value)) {
            formatObject.formatType = value;
          } else if (value in LargeNumberFormatPowers) {
            formatObject.power = LargeNumberFormatPowers[value];
          }
        });
        if (formatObject.power && !formatObject.formatType) {
          formatObject.formatType = "fixedpoint";
        }
        if (formatObject.formatType) {
          return formatObject;
        }
      },
      _calculateNumberPower: function(value, base, minPower, maxPower) {
        var number = Math.abs(value);
        var power = 0;
        if (number > 1) {
          while (number && number >= base && (void 0 === maxPower || power < maxPower)) {
            power++;
            number /= base;
          }
        } else if (number > 0 && number < 1) {
          while (number < 1 && (void 0 === minPower || power > minPower)) {
            power--;
            number *= base;
          }
        }
        return power;
      },
      _getNumberByPower: function(number, power, base) {
        var result = number;
        while (power > 0) {
          result /= base;
          power--;
        }
        while (power < 0) {
          result *= base;
          power++;
        }
        return result;
      },
      _formatNumber: function(value, formatObject, formatConfig) {
        if ("auto" === formatObject.power) {
          formatObject.power = this._calculateNumberPower(value, 1e3, 0, MAX_LARGE_NUMBER_POWER);
        }
        if (formatObject.power) {
          value = this._getNumberByPower(value, formatObject.power, 1e3);
        }
        var powerPostfix = this.defaultLargeNumberFormatPostfixes[formatObject.power] || "";
        var result = this._formatNumberCore(value, formatObject.formatType, formatConfig);
        result = result.replace(/(\d|.$)(\D*)$/, "$1" + powerPostfix + "$2");
        return result;
      },
      _formatNumberExponential: function(value, formatConfig) {
        var power = this._calculateNumberPower(value, DECIMAL_BASE2);
        var number = this._getNumberByPower(value, power, DECIMAL_BASE2);
        if (void 0 === formatConfig.precision) {
          formatConfig.precision = 1;
        }
        if (number.toFixed(formatConfig.precision || 0) >= DECIMAL_BASE2) {
          power++;
          number /= DECIMAL_BASE2;
        }
        var powString = (power >= 0 ? "+" : "") + power.toString();
        return this._formatNumberCore(number, "fixedpoint", formatConfig) + "E" + powString;
      },
      _addZeroes: function(value, precision) {
        var multiplier = Math.pow(10, precision);
        var sign2 = value < 0 ? "-" : "";
        value = (Math.abs(value) * multiplier >>> 0) / multiplier;
        var result = value.toString();
        while (result.length < precision) {
          result = "0" + result;
        }
        return sign2 + result;
      },
      _addGroupSeparators: function(value) {
        var parts = value.toString().split(".");
        return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config_default().thousandsSeparator) + (parts[1] ? config_default().decimalSeparator + parts[1] : "");
      },
      _formatNumberCore: function(value, format2, formatConfig) {
        if ("exponential" === format2) {
          return this._formatNumberExponential(value, formatConfig);
        }
        if ("decimal" !== format2 && null !== formatConfig.precision) {
          formatConfig.precision = formatConfig.precision || 0;
        }
        if ("percent" === format2) {
          value *= 100;
        }
        if (void 0 !== formatConfig.precision) {
          if ("decimal" === format2) {
            value = this._addZeroes(value, formatConfig.precision);
          } else {
            value = null === formatConfig.precision ? value.toPrecision() : toFixed(value, formatConfig.precision);
          }
        }
        if ("decimal" !== format2) {
          value = this._addGroupSeparators(value);
        } else {
          value = value.toString().replace(".", config_default().decimalSeparator);
        }
        if ("percent" === format2) {
          value += "%";
        }
        return value;
      },
      _normalizeFormat: function(format2) {
        if (!format2) {
          return {};
        }
        if ("function" === typeof format2) {
          return format2;
        }
        if (!isPlainObject(format2)) {
          format2 = {
            type: format2
          };
        }
        return format2;
      },
      _getSeparators: function() {
        return {
          decimalSeparator: this.getDecimalSeparator(),
          thousandsSeparator: this.getThousandsSeparator()
        };
      },
      getThousandsSeparator: function() {
        return this.format(1e4, "fixedPoint")[2];
      },
      getDecimalSeparator: function() {
        return this.format(1.2, {
          type: "fixedPoint",
          precision: 1
        })[1];
      },
      convertDigits: function(value, toStandard) {
        var digits = this.format(90, "decimal");
        if ("string" !== typeof value || "0" === digits[1]) {
          return value;
        }
        var fromFirstDigit = toStandard ? digits[1] : "0";
        var toFirstDigit = toStandard ? "0" : digits[1];
        var fromLastDigit = toStandard ? digits[0] : "9";
        var regExp = new RegExp("[" + fromFirstDigit + "-" + fromLastDigit + "]", "g");
        return value.replace(regExp, (char) => String.fromCharCode(char.charCodeAt(0) + (toFirstDigit.charCodeAt(0) - fromFirstDigit.charCodeAt(0))));
      },
      getNegativeEtalonRegExp: function(format2) {
        var separators = this._getSeparators();
        var digitalRegExp = new RegExp("[0-9" + escapeRegExp(separators.decimalSeparator + separators.thousandsSeparator) + "]+", "g");
        var negativeEtalon = this.format(-1, format2).replace(digitalRegExp, "1");
        ["\\", "(", ")", "[", "]", "*", "+", "$", "^", "?", "|", "{", "}"].forEach((char) => {
          negativeEtalon = negativeEtalon.replace(new RegExp("\\".concat(char), "g"), "\\".concat(char));
        });
        negativeEtalon = negativeEtalon.replace(/ /g, "\\s");
        negativeEtalon = negativeEtalon.replace(/1/g, ".*");
        return new RegExp(negativeEtalon, "g");
      },
      getSign: function(text, format2) {
        if (!format2) {
          if ("-" === text.replace(/[^0-9-]/g, "").charAt(0)) {
            return -1;
          }
          return 1;
        }
        var negativeEtalon = this.getNegativeEtalonRegExp(format2);
        return text.match(negativeEtalon) ? -1 : 1;
      },
      format: function(value, _format) {
        if ("number" !== typeof value) {
          return value;
        }
        if ("number" === typeof _format) {
          return value;
        }
        _format = _format && _format.formatter || _format;
        if ("function" === typeof _format) {
          return _format(value);
        }
        _format = this._normalizeFormat(_format);
        if (!_format.type) {
          _format.type = "decimal";
        }
        var numberConfig = this._parseNumberFormatString(_format.type);
        if (!numberConfig) {
          var formatterConfig = this._getSeparators();
          formatterConfig.unlimitedIntegerDigits = _format.unlimitedIntegerDigits;
          return this.convertDigits(getFormatter(_format.type, formatterConfig)(value));
        }
        return this._formatNumber(value, numberConfig, _format);
      },
      parse: function(text, format2) {
        if (!text) {
          return;
        }
        if (format2 && format2.parser) {
          return format2.parser(text);
        }
        text = this.convertDigits(text, true);
        if (format2 && "string" !== typeof format2) {
          errors_default.log("W0011");
        }
        var decimalSeparator = this.getDecimalSeparator();
        var regExp = new RegExp("[^0-9" + escapeRegExp(decimalSeparator) + "]", "g");
        var cleanedText = text.replace(regExp, "").replace(decimalSeparator, ".").replace(/\.$/g, "");
        if ("." === cleanedText || "" === cleanedText) {
          return null;
        }
        if (this._calcSignificantDigits(cleanedText) > 15) {
          return NaN;
        }
        var parsed = +cleanedText * this.getSign(text, format2);
        format2 = this._normalizeFormat(format2);
        var formatConfig = this._parseNumberFormatString(format2.type);
        var power = null === formatConfig || void 0 === formatConfig ? void 0 : formatConfig.power;
        if (power) {
          if ("auto" === power) {
            var match = text.match(/\d(K|M|B|T)/);
            if (match) {
              power = Object.keys(LargeNumberFormatPostfixes).find((power2) => LargeNumberFormatPostfixes[power2] === match[1]);
            }
          }
          parsed *= Math.pow(10, 3 * power);
        }
        if ("percent" === (null === formatConfig || void 0 === formatConfig ? void 0 : formatConfig.formatType)) {
          parsed /= 100;
        }
        return parsed;
      },
      _calcSignificantDigits: function(text) {
        var [integer, fractional] = text.split(".");
        var calcDigitsAfterLeadingZeros = (digits) => {
          var index = -1;
          for (var i = 0; i < digits.length; i++) {
            if ("0" !== digits[i]) {
              index = i;
              break;
            }
          }
          return index > -1 ? digits.length - index : 0;
        };
        var result = 0;
        if (integer) {
          result += calcDigitsAfterLeadingZeros(integer.split(""));
        }
        if (fractional) {
          result += calcDigitsAfterLeadingZeros(fractional.split("").reverse());
        }
        return result;
      }
    });
    numberLocalization.inject(currency_default);
    if (hasIntl) {
      numberLocalization.inject(number_default);
    }
    number_default2 = numberLocalization;
  }
});

// node_modules/devextreme/esm/localization/ldml/date.formatter.js
function leftPad(text, length) {
  while (text.length < length) {
    text = "0" + text;
  }
  return text;
}
var FORMAT_TYPES, LDML_FORMATTERS, getFormatter3;
var init_date_formatter = __esm({
  "node_modules/devextreme/esm/localization/ldml/date.formatter.js"() {
    FORMAT_TYPES = {
      3: "abbreviated",
      4: "wide",
      5: "narrow"
    };
    LDML_FORMATTERS = {
      y: function(date, count, useUtc) {
        var year = date[useUtc ? "getUTCFullYear" : "getFullYear"]();
        if (2 === count) {
          year %= 100;
        }
        return leftPad(year.toString(), count);
      },
      M: function(date, count, useUtc, dateParts) {
        var month = date[useUtc ? "getUTCMonth" : "getMonth"]();
        var formatType = FORMAT_TYPES[count];
        if (formatType) {
          return dateParts.getMonthNames(formatType, "format")[month];
        }
        return leftPad((month + 1).toString(), Math.min(count, 2));
      },
      L: function(date, count, useUtc, dateParts) {
        var month = date[useUtc ? "getUTCMonth" : "getMonth"]();
        var formatType = FORMAT_TYPES[count];
        if (formatType) {
          return dateParts.getMonthNames(formatType, "standalone")[month];
        }
        return leftPad((month + 1).toString(), Math.min(count, 2));
      },
      Q: function(date, count, useUtc, dateParts) {
        var month = date[useUtc ? "getUTCMonth" : "getMonth"]();
        var quarter = Math.floor(month / 3);
        var formatType = FORMAT_TYPES[count];
        if (formatType) {
          return dateParts.getQuarterNames(formatType)[quarter];
        }
        return leftPad((quarter + 1).toString(), Math.min(count, 2));
      },
      E: function(date, count, useUtc, dateParts) {
        var day = date[useUtc ? "getUTCDay" : "getDay"]();
        var formatType = FORMAT_TYPES[count < 3 ? 3 : count];
        return dateParts.getDayNames(formatType)[day];
      },
      a: function(date, count, useUtc, dateParts) {
        var hours = date[useUtc ? "getUTCHours" : "getHours"]();
        var period = hours < 12 ? 0 : 1;
        var formatType = FORMAT_TYPES[count];
        return dateParts.getPeriodNames(formatType)[period];
      },
      d: function(date, count, useUtc) {
        return leftPad(date[useUtc ? "getUTCDate" : "getDate"]().toString(), Math.min(count, 2));
      },
      H: function(date, count, useUtc) {
        return leftPad(date[useUtc ? "getUTCHours" : "getHours"]().toString(), Math.min(count, 2));
      },
      h: function(date, count, useUtc) {
        var hours = date[useUtc ? "getUTCHours" : "getHours"]();
        return leftPad((hours % 12 || 12).toString(), Math.min(count, 2));
      },
      m: function(date, count, useUtc) {
        return leftPad(date[useUtc ? "getUTCMinutes" : "getMinutes"]().toString(), Math.min(count, 2));
      },
      s: function(date, count, useUtc) {
        return leftPad(date[useUtc ? "getUTCSeconds" : "getSeconds"]().toString(), Math.min(count, 2));
      },
      S: function(date, count, useUtc) {
        return leftPad(date[useUtc ? "getUTCMilliseconds" : "getMilliseconds"]().toString(), 3).substr(0, count);
      },
      x: function(date, count, useUtc) {
        var timezoneOffset = useUtc ? 0 : date.getTimezoneOffset();
        var signPart = timezoneOffset > 0 ? "-" : "+";
        var timezoneOffsetAbs = Math.abs(timezoneOffset);
        var hours = Math.floor(timezoneOffsetAbs / 60);
        var minutes = timezoneOffsetAbs % 60;
        var hoursPart = leftPad(hours.toString(), 2);
        var minutesPart = leftPad(minutes.toString(), 2);
        return signPart + hoursPart + (count >= 3 ? ":" : "") + (count > 1 || minutes ? minutesPart : "");
      },
      X: function(date, count, useUtc) {
        if (useUtc || !date.getTimezoneOffset()) {
          return "Z";
        }
        return LDML_FORMATTERS.x(date, count, useUtc);
      },
      Z: function(date, count, useUtc) {
        return LDML_FORMATTERS.X(date, count >= 5 ? 3 : 2, useUtc);
      }
    };
    getFormatter3 = function(format2, dateParts) {
      return function(date) {
        var charIndex;
        var formatter;
        var char;
        var charCount = 0;
        var isEscaping = false;
        var isCurrentCharEqualsNext;
        var result = "";
        if (!date) {
          return null;
        }
        if (!format2) {
          return date;
        }
        var useUtc = "Z" === format2[format2.length - 1] || "'Z'" === format2.slice(-3);
        for (charIndex = 0; charIndex < format2.length; charIndex++) {
          char = format2[charIndex];
          formatter = LDML_FORMATTERS[char];
          isCurrentCharEqualsNext = char === format2[charIndex + 1];
          charCount++;
          if (!isCurrentCharEqualsNext) {
            if (formatter && !isEscaping) {
              result += formatter(date, charCount, useUtc, dateParts);
            }
            charCount = 0;
          }
          if ("'" === char && !isCurrentCharEqualsNext) {
            isEscaping = !isEscaping;
          } else if (isEscaping || !formatter) {
            result += char;
          }
          if ("'" === char && isCurrentCharEqualsNext) {
            charIndex++;
          }
        }
        return result;
      };
    };
  }
});

// node_modules/devextreme/esm/localization/ldml/date.format.js
var ARABIC_COMMA, FORMAT_SEPARATORS, AM_PM_PATTERN, checkDigit, checkPatternContinue, getPatternStartIndex, getDifference, replaceCharsCore, replaceChars, formatValue, ESCAPE_CHARS_REGEXP, escapeChars, getFormat2;
var init_date_format = __esm({
  "node_modules/devextreme/esm/localization/ldml/date.format.js"() {
    init_number3();
    ARABIC_COMMA = "،";
    FORMAT_SEPARATORS = " .,:;/\\<>()-[]" + ARABIC_COMMA;
    AM_PM_PATTERN = ". m.";
    checkDigit = function(char) {
      var code = char && number_default2.convertDigits(char, false).charCodeAt(0);
      var zeroCode = number_default2.convertDigits("0", false).charCodeAt(0);
      return zeroCode <= code && code < zeroCode + 10;
    };
    checkPatternContinue = function(text, patterns, index, isDigit) {
      var char = text[index];
      var nextChar = text[index + 1];
      if (!isDigit) {
        if ("." === char || " " === char && text.slice(index - 1, index + 3) === AM_PM_PATTERN) {
          return true;
        }
        if ("-" === char && !checkDigit(nextChar)) {
          return true;
        }
      }
      var isDigitChanged = isDigit && patterns.some((pattern) => text[index] !== pattern[index]);
      return FORMAT_SEPARATORS.indexOf(char) < 0 && isDigit === checkDigit(char) && (!isDigit || isDigitChanged);
    };
    getPatternStartIndex = function(defaultPattern, index) {
      if (!checkDigit(defaultPattern[index])) {
        while (index > 0 && !checkDigit(defaultPattern[index - 1]) && ("." === defaultPattern[index - 1] || FORMAT_SEPARATORS.indexOf(defaultPattern[index - 1]) < 0)) {
          index--;
        }
      }
      return index;
    };
    getDifference = function(defaultPattern, patterns, processedIndexes, isDigit) {
      var i = 0;
      var result = [];
      var patternsFilter = function(pattern) {
        return defaultPattern[i] !== pattern[i] && (void 0 === isDigit || checkDigit(defaultPattern[i]) === isDigit);
      };
      if (!Array.isArray(patterns)) {
        patterns = [patterns];
      }
      for (i = 0; i < defaultPattern.length; i++) {
        if (processedIndexes.indexOf(i) < 0 && patterns.filter(patternsFilter).length) {
          i = getPatternStartIndex(defaultPattern, i);
          do {
            isDigit = checkDigit(defaultPattern[i]);
            if (!result.length && !isDigit && checkDigit(patterns[0][i])) {
              break;
            }
            result.push(i);
            processedIndexes.unshift(i);
            i++;
          } while (defaultPattern[i] && checkPatternContinue(defaultPattern, patterns, i, isDigit));
          break;
        }
      }
      if (1 === result.length && ("0" === defaultPattern[processedIndexes[0] - 1] || "٠" === defaultPattern[processedIndexes[0] - 1])) {
        processedIndexes.unshift(processedIndexes[0] - 1);
      }
      return result;
    };
    replaceCharsCore = function(pattern, indexes, char, patternPositions) {
      var baseCharIndex = indexes[0];
      var patternIndex = baseCharIndex < patternPositions.length ? patternPositions[baseCharIndex] : baseCharIndex;
      indexes.forEach(function(_, index) {
        pattern = pattern.substr(0, patternIndex + index) + (char.length > 1 ? char[index] : char) + pattern.substr(patternIndex + index + 1);
      });
      if (1 === indexes.length) {
        pattern = pattern.replace("0" + char, char + char);
        pattern = pattern.replace("٠" + char, char + char);
      }
      return pattern;
    };
    replaceChars = function(pattern, indexes, char, patternPositions) {
      var i;
      var index;
      var patternIndex;
      if (!checkDigit(pattern[indexes[0]] || "0")) {
        var letterCount = Math.max(indexes.length <= 3 ? 3 : 4, char.length);
        while (indexes.length > letterCount) {
          index = indexes.pop();
          patternIndex = patternPositions[index];
          patternPositions[index] = -1;
          for (i = index + 1; i < patternPositions.length; i++) {
            patternPositions[i]--;
          }
          pattern = pattern.substr(0, patternIndex) + pattern.substr(patternIndex + 1);
        }
        index = indexes[indexes.length - 1] + 1, patternIndex = index < patternPositions.length ? patternPositions[index] : index;
        while (indexes.length < letterCount) {
          indexes.push(indexes[indexes.length - 1] + 1);
          for (i = index; i < patternPositions.length; i++) {
            patternPositions[i]++;
          }
          pattern = pattern.substr(0, patternIndex) + " " + pattern.substr(patternIndex);
        }
      }
      pattern = replaceCharsCore(pattern, indexes, char, patternPositions);
      return pattern;
    };
    formatValue = function(value, formatter) {
      if (Array.isArray(value)) {
        return value.map(function(value2) {
          return (formatter(value2) || "").toString();
        });
      }
      return (formatter(value) || "").toString();
    };
    ESCAPE_CHARS_REGEXP = /[a-zA-Z]/g;
    escapeChars = function(pattern, defaultPattern, processedIndexes, patternPositions) {
      var escapeIndexes = defaultPattern.split("").map(function(char, index) {
        if (processedIndexes.indexOf(index) < 0 && (char.match(ESCAPE_CHARS_REGEXP) || "'" === char)) {
          return patternPositions[index];
        }
        return -1;
      });
      pattern = pattern.split("").map(function(char, index) {
        var result = char;
        var isCurrentCharEscaped = escapeIndexes.indexOf(index) >= 0;
        var isPrevCharEscaped = index > 0 && escapeIndexes.indexOf(index - 1) >= 0;
        var isNextCharEscaped = escapeIndexes.indexOf(index + 1) >= 0;
        if (isCurrentCharEscaped) {
          if (!isPrevCharEscaped) {
            result = "'" + result;
          }
          if (!isNextCharEscaped) {
            result += "'";
          }
        }
        return result;
      }).join("");
      return pattern;
    };
    getFormat2 = function(formatter) {
      var processedIndexes = [];
      var defaultPattern = formatValue(new Date(2009, 8, 8, 6, 5, 4), formatter);
      var patternPositions = defaultPattern.split("").map(function(_, index) {
        return index;
      });
      var result = defaultPattern;
      var replacedPatterns = {};
      var datePatterns = [{
        date: new Date(2009, 8, 8, 6, 5, 4, 111),
        pattern: "S"
      }, {
        date: new Date(2009, 8, 8, 6, 5, 2),
        pattern: "s"
      }, {
        date: new Date(2009, 8, 8, 6, 2, 4),
        pattern: "m"
      }, {
        date: new Date(2009, 8, 8, 18, 5, 4),
        pattern: "H",
        isDigit: true
      }, {
        date: new Date(2009, 8, 8, 2, 5, 4),
        pattern: "h",
        isDigit: true
      }, {
        date: new Date(2009, 8, 8, 18, 5, 4),
        pattern: "a",
        isDigit: false
      }, {
        date: new Date(2009, 8, 1, 6, 5, 4),
        pattern: "d"
      }, {
        date: [new Date(2009, 8, 2, 6, 5, 4), new Date(2009, 8, 3, 6, 5, 4), new Date(2009, 8, 4, 6, 5, 4)],
        pattern: "E"
      }, {
        date: new Date(2009, 9, 6, 6, 5, 4),
        pattern: "M"
      }, {
        date: new Date(1998, 8, 8, 6, 5, 4),
        pattern: "y"
      }];
      if (!result) {
        return;
      }
      datePatterns.forEach(function(test) {
        var diff = getDifference(defaultPattern, formatValue(test.date, formatter), processedIndexes, test.isDigit);
        var pattern = "M" === test.pattern && !replacedPatterns.d ? "L" : test.pattern;
        result = replaceChars(result, diff, pattern, patternPositions);
        replacedPatterns[pattern] = diff.length;
      });
      result = escapeChars(result, defaultPattern, processedIndexes, patternPositions);
      if (processedIndexes.length) {
        return result;
      }
    };
  }
});

// node_modules/devextreme/esm/localization/ldml/date.parser.js
var FORMAT_TYPES2, monthRegExpGenerator, PATTERN_REGEXPS, parseNumber, caseInsensitiveIndexOf, monthPatternParser, PATTERN_PARSERS, ORDERED_PATTERNS, PATTERN_SETTERS, getSameCharCount, createPattern, getRegExpInfo, digitFieldSymbols, isPossibleForParsingFormat, getPatternSetters, setPatternPart, setPatternPartFromNow, getShortPatterns, getMaxOrderedPatternIndex, getOrderedFormatPatterns, getParser;
var init_date_parser = __esm({
  "node_modules/devextreme/esm/localization/ldml/date.parser.js"() {
    init_common();
    init_console();
    FORMAT_TYPES2 = {
      3: "abbreviated",
      4: "wide",
      5: "narrow"
    };
    monthRegExpGenerator = function(count, dateParts) {
      if (count > 2) {
        return Object.keys(FORMAT_TYPES2).map(function(count2) {
          return ["format", "standalone"].map(function(type) {
            return dateParts.getMonthNames(FORMAT_TYPES2[count2], type).join("|");
          }).join("|");
        }).join("|");
      }
      return 2 === count ? "1[012]|0?[1-9]" : "0??[1-9]|1[012]";
    };
    PATTERN_REGEXPS = {
      ":": function(count, dateParts) {
        var countSuffix = count > 1 ? "{".concat(count, "}") : "";
        var timeSeparator = escapeRegExp(dateParts.getTimeSeparator());
        ":" !== timeSeparator && (timeSeparator = "".concat(timeSeparator, "|:"));
        return "".concat(timeSeparator).concat(countSuffix);
      },
      y: function(count) {
        return 2 === count ? "[0-9]{".concat(count, "}") : "[0-9]+?";
      },
      M: monthRegExpGenerator,
      L: monthRegExpGenerator,
      Q: function(count, dateParts) {
        if (count > 2) {
          return dateParts.getQuarterNames(FORMAT_TYPES2[count], "format").join("|");
        }
        return "0?[1-4]";
      },
      E: function(count, dateParts) {
        return "\\D*";
      },
      a: function(count, dateParts) {
        return dateParts.getPeriodNames(FORMAT_TYPES2[count < 3 ? 3 : count], "format").join("|");
      },
      d: function(count) {
        return 2 === count ? "3[01]|[12][0-9]|0?[1-9]" : "0??[1-9]|[12][0-9]|3[01]";
      },
      H: function(count) {
        return 2 === count ? "2[0-3]|1[0-9]|0?[0-9]" : "0??[0-9]|1[0-9]|2[0-3]";
      },
      h: function(count) {
        return 2 === count ? "1[012]|0?[1-9]" : "0??[1-9]|1[012]";
      },
      m: function(count) {
        return 2 === count ? "[1-5][0-9]|0?[0-9]" : "0??[0-9]|[1-5][0-9]";
      },
      s: function(count) {
        return 2 === count ? "[1-5][0-9]|0?[0-9]" : "0??[0-9]|[1-5][0-9]";
      },
      S: function(count) {
        return "[0-9]{1,".concat(count, "}");
      },
      w: function(count) {
        return 2 === count ? "[1-5][0-9]|0?[0-9]" : "0??[0-9]|[1-5][0-9]";
      },
      x: function(count) {
        return 3 === count ? "[+-](?:2[0-3]|[01][0-9]):(?:[0-5][0-9])|Z" : "[+-](?:2[0-3]|[01][0-9])(?:[0-5][0-9])|Z";
      }
    };
    parseNumber = Number;
    caseInsensitiveIndexOf = function(array, value) {
      return array.map((item) => item.toLowerCase()).indexOf(value.toLowerCase());
    };
    monthPatternParser = function(text, count, dateParts) {
      if (count > 2) {
        return ["format", "standalone"].map(function(type) {
          return Object.keys(FORMAT_TYPES2).map(function(count2) {
            var monthNames = dateParts.getMonthNames(FORMAT_TYPES2[count2], type);
            return caseInsensitiveIndexOf(monthNames, text);
          });
        }).reduce(function(a, b) {
          return a.concat(b);
        }).filter(function(index) {
          return index >= 0;
        })[0];
      }
      return parseNumber(text) - 1;
    };
    PATTERN_PARSERS = {
      y: function(text, count) {
        var year = parseNumber(text);
        if (2 === count) {
          return year < 30 ? 2e3 + year : 1900 + year;
        }
        return year;
      },
      M: monthPatternParser,
      L: monthPatternParser,
      Q: function(text, count, dateParts) {
        if (count > 2) {
          return dateParts.getQuarterNames(FORMAT_TYPES2[count], "format").indexOf(text);
        }
        return parseNumber(text) - 1;
      },
      E: function(text, count, dateParts) {
        var dayNames = dateParts.getDayNames(FORMAT_TYPES2[count < 3 ? 3 : count], "format");
        return caseInsensitiveIndexOf(dayNames, text);
      },
      a: function(text, count, dateParts) {
        var periodNames = dateParts.getPeriodNames(FORMAT_TYPES2[count < 3 ? 3 : count], "format");
        return caseInsensitiveIndexOf(periodNames, text);
      },
      d: parseNumber,
      H: parseNumber,
      h: parseNumber,
      m: parseNumber,
      s: parseNumber,
      S: function(text, count) {
        count = Math.max(count, 3);
        text = text.slice(0, 3);
        while (count < 3) {
          text += "0";
          count++;
        }
        return parseNumber(text);
      }
    };
    ORDERED_PATTERNS = ["y", "M", "d", "h", "m", "s", "S"];
    PATTERN_SETTERS = {
      y: "setFullYear",
      M: "setMonth",
      L: "setMonth",
      a: function(date, value, datePartValues) {
        var hours = date.getHours();
        var hourPartValue = datePartValues.h;
        if (void 0 !== hourPartValue && hourPartValue !== hours) {
          hours--;
        }
        if (!value && 12 === hours) {
          hours = 0;
        } else if (value && 12 !== hours) {
          hours += 12;
        }
        date.setHours(hours);
      },
      d: "setDate",
      H: "setHours",
      h: "setHours",
      m: "setMinutes",
      s: "setSeconds",
      S: "setMilliseconds"
    };
    getSameCharCount = function(text, index) {
      var char = text[index];
      if (!char) {
        return 0;
      }
      var count = 0;
      do {
        index++;
        count++;
      } while (text[index] === char);
      return count;
    };
    createPattern = function(char, count) {
      var result = "";
      for (var i = 0; i < count; i++) {
        result += char;
      }
      return result;
    };
    getRegExpInfo = function(format2, dateParts) {
      var regexpText = "";
      var stubText = "";
      var isEscaping;
      var patterns = [];
      var addPreviousStub = function() {
        if (stubText) {
          patterns.push("'".concat(stubText, "'"));
          regexpText += "".concat(escapeRegExp(stubText), ")");
          stubText = "";
        }
      };
      for (var i = 0; i < format2.length; i++) {
        var char = format2[i];
        var isEscapeChar = "'" === char;
        var regexpPart = PATTERN_REGEXPS[char];
        if (isEscapeChar) {
          isEscaping = !isEscaping;
          if ("'" !== format2[i - 1]) {
            continue;
          }
        }
        if (regexpPart && !isEscaping) {
          var count = getSameCharCount(format2, i);
          var pattern = createPattern(char, count);
          addPreviousStub();
          patterns.push(pattern);
          regexpText += "(".concat(regexpPart(count, dateParts), ")");
          i += count - 1;
        } else {
          if (!stubText) {
            regexpText += "(";
          }
          stubText += char;
        }
      }
      addPreviousStub();
      if (!isPossibleForParsingFormat(patterns)) {
        logger.warn("The following format may be parsed incorrectly: ".concat(format2, "."));
      }
      return {
        patterns,
        regexp: new RegExp("^".concat(regexpText, "$"), "i")
      };
    };
    digitFieldSymbols = ["d", "H", "h", "m", "s", "w", "M", "L", "Q"];
    isPossibleForParsingFormat = function(patterns) {
      var isDigitPattern = (pattern) => {
        if (!pattern) {
          return false;
        }
        var char = pattern[0];
        return ["y", "S"].includes(char) || digitFieldSymbols.includes(char) && pattern.length < 3;
      };
      var possibleForParsing = true;
      var ambiguousDigitPatternsCount = 0;
      return patterns.every((pattern, index, patterns2) => {
        if (isDigitPattern(pattern)) {
          if (((pattern2) => "S" !== pattern2[0] && 2 !== pattern2.length)(pattern)) {
            possibleForParsing = ++ambiguousDigitPatternsCount < 2;
          }
          if (!isDigitPattern(patterns2[index + 1])) {
            ambiguousDigitPatternsCount = 0;
          }
        }
        return possibleForParsing;
      });
    };
    getPatternSetters = function() {
      return PATTERN_SETTERS;
    };
    setPatternPart = function(date, pattern, text, dateParts, datePartValues) {
      var patternChar = pattern[0];
      var partSetter = PATTERN_SETTERS[patternChar];
      var partParser = PATTERN_PARSERS[patternChar];
      if (partSetter && partParser) {
        var value = partParser(text, pattern.length, dateParts);
        datePartValues[pattern] = value;
        if (date[partSetter]) {
          date[partSetter](value);
        } else {
          partSetter(date, value, datePartValues);
        }
      }
    };
    setPatternPartFromNow = function(date, pattern, now) {
      var setterName = PATTERN_SETTERS[pattern];
      var getterName = "g" + setterName.substr(1);
      var value = now[getterName]();
      date[setterName](value);
    };
    getShortPatterns = function(fullPatterns) {
      return fullPatterns.map(function(pattern) {
        if ("'" === pattern[0]) {
          return "";
        } else {
          return "H" === pattern[0] ? "h" : pattern[0];
        }
      });
    };
    getMaxOrderedPatternIndex = function(patterns) {
      var indexes = patterns.map(function(pattern) {
        return ORDERED_PATTERNS.indexOf(pattern);
      });
      return Math.max.apply(Math, indexes);
    };
    getOrderedFormatPatterns = function(formatPatterns) {
      var otherPatterns = formatPatterns.filter(function(pattern) {
        return ORDERED_PATTERNS.indexOf(pattern) < 0;
      });
      return ORDERED_PATTERNS.concat(otherPatterns);
    };
    getParser = function(format2, dateParts) {
      var regExpInfo = getRegExpInfo(format2, dateParts);
      return function(text) {
        var regExpResult = regExpInfo.regexp.exec(text);
        if (regExpResult) {
          var now = /* @__PURE__ */ new Date();
          var date = new Date(now.getFullYear(), 0, 1);
          var formatPatterns = getShortPatterns(regExpInfo.patterns);
          var maxPatternIndex = getMaxOrderedPatternIndex(formatPatterns);
          var orderedFormatPatterns = getOrderedFormatPatterns(formatPatterns);
          var datePartValues = {};
          orderedFormatPatterns.forEach(function(pattern, index) {
            if (!pattern || index < ORDERED_PATTERNS.length && index > maxPatternIndex) {
              return;
            }
            var patternIndex = formatPatterns.indexOf(pattern);
            if (patternIndex >= 0) {
              var regExpPattern = regExpInfo.patterns[patternIndex];
              var regExpText = regExpResult[patternIndex + 1];
              setPatternPart(date, regExpPattern, regExpText, dateParts, datePartValues);
            } else {
              setPatternPartFromNow(date, pattern, now);
            }
          });
          return date;
        }
        return null;
      };
    };
  }
});

// node_modules/devextreme/esm/localization/default_date_names.js
var MONTHS, DAYS, PERIODS, QUARTERS, cutCaptions, default_date_names_default;
var init_default_date_names = __esm({
  "node_modules/devextreme/esm/localization/default_date_names.js"() {
    init_iterator();
    MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    PERIODS = ["AM", "PM"];
    QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
    cutCaptions = (captions, format2) => {
      var lengthByFormat = {
        abbreviated: 3,
        short: 2,
        narrow: 1
      };
      return map(captions, (caption) => caption.substr(0, lengthByFormat[format2]));
    };
    default_date_names_default = {
      getMonthNames: function(format2) {
        return cutCaptions(MONTHS, format2);
      },
      getDayNames: function(format2) {
        return cutCaptions(DAYS, format2);
      },
      getQuarterNames: function(format2) {
        return QUARTERS;
      },
      getPeriodNames: function(format2) {
        return PERIODS;
      }
    };
  }
});

// node_modules/devextreme/esm/localization/cldr-data/first_day_of_week_data.js
var first_day_of_week_data_default;
var init_first_day_of_week_data = __esm({
  "node_modules/devextreme/esm/localization/cldr-data/first_day_of_week_data.js"() {
    first_day_of_week_data_default = {
      "af-NA": 1,
      agq: 1,
      ak: 1,
      ar: 6,
      "ar-EH": 1,
      "ar-ER": 1,
      "ar-KM": 1,
      "ar-LB": 1,
      "ar-MA": 1,
      "ar-MR": 1,
      "ar-PS": 1,
      "ar-SO": 1,
      "ar-SS": 1,
      "ar-TD": 1,
      "ar-TN": 1,
      asa: 1,
      ast: 1,
      az: 1,
      "az-Cyrl": 1,
      bas: 1,
      be: 1,
      bem: 1,
      bez: 1,
      bg: 1,
      bm: 1,
      br: 1,
      bs: 1,
      "bs-Cyrl": 1,
      ca: 1,
      ce: 1,
      cgg: 1,
      ckb: 6,
      cs: 1,
      cy: 1,
      da: 1,
      de: 1,
      dje: 1,
      dsb: 1,
      dua: 1,
      dyo: 1,
      ee: 1,
      el: 1,
      "en-001": 1,
      "en-AE": 6,
      "en-BI": 1,
      "en-MP": 1,
      "en-MV": 5,
      "en-SD": 6,
      eo: 1,
      es: 1,
      et: 1,
      eu: 1,
      ewo: 1,
      fa: 6,
      ff: 1,
      "ff-Adlm": 1,
      fi: 1,
      fo: 1,
      fr: 1,
      "fr-DJ": 6,
      "fr-DZ": 6,
      "fr-SY": 6,
      fur: 1,
      fy: 1,
      ga: 1,
      gd: 1,
      gl: 1,
      gsw: 1,
      gv: 1,
      ha: 1,
      hr: 1,
      hsb: 1,
      hu: 1,
      hy: 1,
      ia: 1,
      ig: 1,
      is: 1,
      it: 1,
      jgo: 1,
      jmc: 1,
      ka: 1,
      kab: 6,
      kde: 1,
      kea: 1,
      khq: 1,
      kk: 1,
      kkj: 1,
      kl: 1,
      "ko-KP": 1,
      ksb: 1,
      ksf: 1,
      ksh: 1,
      ku: 1,
      kw: 1,
      ky: 1,
      lag: 1,
      lb: 1,
      lg: 1,
      ln: 1,
      lrc: 6,
      lt: 1,
      lu: 1,
      lv: 1,
      "mas-TZ": 1,
      mfe: 1,
      mg: 1,
      mgo: 1,
      mi: 1,
      mk: 1,
      mn: 1,
      ms: 1,
      mua: 1,
      mzn: 6,
      naq: 1,
      nds: 1,
      nl: 1,
      nmg: 1,
      nnh: 1,
      no: 1,
      nus: 1,
      nyn: 1,
      os: 1,
      pcm: 1,
      pl: 1,
      ps: 6,
      "pt-AO": 1,
      "pt-CH": 1,
      "pt-CV": 1,
      "pt-GQ": 1,
      "pt-GW": 1,
      "pt-LU": 1,
      "pt-ST": 1,
      "pt-TL": 1,
      "qu-BO": 1,
      "qu-EC": 1,
      rm: 1,
      rn: 1,
      ro: 1,
      rof: 1,
      ru: 1,
      rw: 1,
      rwk: 1,
      sah: 1,
      sbp: 1,
      sc: 1,
      se: 1,
      ses: 1,
      sg: 1,
      shi: 1,
      "shi-Latn": 1,
      si: 1,
      sk: 1,
      sl: 1,
      smn: 1,
      so: 1,
      "so-DJ": 6,
      sq: 1,
      sr: 1,
      "sr-Latn": 1,
      sv: 1,
      sw: 1,
      "ta-LK": 1,
      "ta-MY": 1,
      teo: 1,
      tg: 1,
      "ti-ER": 1,
      tk: 1,
      to: 1,
      tr: 1,
      tt: 1,
      twq: 1,
      tzm: 1,
      uk: 1,
      uz: 1,
      "uz-Arab": 6,
      "uz-Cyrl": 1,
      vai: 1,
      "vai-Latn": 1,
      vi: 1,
      vun: 1,
      wae: 1,
      wo: 1,
      xog: 1,
      yav: 1,
      yi: 1,
      yo: 1,
      zgh: 1
    };
  }
});

// node_modules/devextreme/esm/localization/intl/date.js
function formatDateTime(date, format2) {
  return getFormatter4(format2)(date).replace(SYMBOLS_TO_REMOVE_REGEX, "").replace(NARROW_NO_BREAK_SPACE_REGEX, " ");
}
var SYMBOLS_TO_REMOVE_REGEX, NARROW_NO_BREAK_SPACE_REGEX, getIntlFormatter, formattersCache2, getFormatter4, formatNumber, getAlternativeNumeralsMap, normalizeNumerals, removeLeadingZeroes, dateStringEquals, normalizeMonth, intlFormats, getIntlFormat, monthNameStrategies, date_default;
var init_date = __esm({
  "node_modules/devextreme/esm/localization/intl/date.js"() {
    init_extend();
    init_core();
    SYMBOLS_TO_REMOVE_REGEX = /[\u200E\u200F]/g;
    NARROW_NO_BREAK_SPACE_REGEX = /[\u202F]/g;
    getIntlFormatter = (format2) => (date) => {
      if (!format2.timeZoneName) {
        var year = date.getFullYear();
        var recognizableAsTwentyCentury = String(year).length < 3;
        var temporaryYearValue = recognizableAsTwentyCentury ? year + 400 : year;
        var utcDate = new Date(Date.UTC(temporaryYearValue, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
        if (recognizableAsTwentyCentury) {
          utcDate.setFullYear(year);
        }
        var utcFormat = extend({
          timeZone: "UTC"
        }, format2);
        return formatDateTime(utcDate, utcFormat);
      }
      return formatDateTime(date, format2);
    };
    formattersCache2 = {};
    getFormatter4 = (format2) => {
      var key = core_default.locale() + "/" + JSON.stringify(format2);
      if (!formattersCache2[key]) {
        formattersCache2[key] = new Intl.DateTimeFormat(core_default.locale(), format2).format;
      }
      return formattersCache2[key];
    };
    formatNumber = (number) => new Intl.NumberFormat(core_default.locale()).format(number);
    getAlternativeNumeralsMap = /* @__PURE__ */ (() => {
      var numeralsMapCache = {};
      return (locale2) => {
        if (!(locale2 in numeralsMapCache)) {
          if ("0" === formatNumber(0)) {
            numeralsMapCache[locale2] = false;
            return false;
          }
          numeralsMapCache[locale2] = {};
          for (var i = 0; i < 10; ++i) {
            numeralsMapCache[locale2][formatNumber(i)] = i;
          }
        }
        return numeralsMapCache[locale2];
      };
    })();
    normalizeNumerals = (dateString) => {
      var alternativeNumeralsMap = getAlternativeNumeralsMap(core_default.locale());
      if (!alternativeNumeralsMap) {
        return dateString;
      }
      return dateString.split("").map((sign2) => sign2 in alternativeNumeralsMap ? String(alternativeNumeralsMap[sign2]) : sign2).join("");
    };
    removeLeadingZeroes = (str) => str.replace(/(\D)0+(\d)/g, "$1$2");
    dateStringEquals = (actual, expected) => removeLeadingZeroes(actual) === removeLeadingZeroes(expected);
    normalizeMonth = (text) => text.replace("d’", "de ");
    intlFormats = {
      day: {
        day: "numeric"
      },
      dayofweek: {
        weekday: "long"
      },
      longdate: {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      },
      longdatelongtime: {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      },
      longtime: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      },
      month: {
        month: "long"
      },
      monthandday: {
        month: "long",
        day: "numeric"
      },
      monthandyear: {
        year: "numeric",
        month: "long"
      },
      shortdate: {},
      shorttime: {
        hour: "numeric",
        minute: "numeric"
      },
      shortyear: {
        year: "2-digit"
      },
      year: {
        year: "numeric"
      }
    };
    Object.defineProperty(intlFormats, "shortdateshorttime", {
      get: function() {
        var defaultOptions = Intl.DateTimeFormat(core_default.locale()).resolvedOptions();
        return {
          year: defaultOptions.year,
          month: defaultOptions.month,
          day: defaultOptions.day,
          hour: "numeric",
          minute: "numeric"
        };
      }
    });
    getIntlFormat = (format2) => "string" === typeof format2 && intlFormats[format2.toLowerCase()];
    monthNameStrategies = {
      standalone: function(monthIndex, monthFormat) {
        var date = new Date(1999, monthIndex, 13, 1);
        var dateString = getIntlFormatter({
          month: monthFormat
        })(date);
        return dateString;
      },
      format: function(monthIndex, monthFormat) {
        var date = new Date(0, monthIndex, 13, 1);
        var dateString = normalizeMonth(getIntlFormatter({
          day: "numeric",
          month: monthFormat
        })(date));
        var parts = dateString.split(" ").filter((part) => part.indexOf("13") < 0);
        if (1 === parts.length) {
          return parts[0];
        } else if (2 === parts.length) {
          return parts[0].length > parts[1].length ? parts[0] : parts[1];
        }
        return monthNameStrategies.standalone(monthIndex, monthFormat);
      }
    };
    date_default = {
      engine: function() {
        return "intl";
      },
      getMonthNames: function(format2, type) {
        var monthFormat = {
          wide: "long",
          abbreviated: "short",
          narrow: "narrow"
        }[format2 || "wide"];
        type = "format" === type ? type : "standalone";
        return Array.apply(null, new Array(12)).map((_, monthIndex) => monthNameStrategies[type](monthIndex, monthFormat));
      },
      getDayNames: function(format2) {
        var result = ((format3) => Array.apply(null, new Array(7)).map((_, dayIndex) => getIntlFormatter({
          weekday: format3
        })(new Date(0, 0, dayIndex))))({
          wide: "long",
          abbreviated: "short",
          short: "narrow",
          narrow: "narrow"
        }[format2 || "wide"]);
        return result;
      },
      getPeriodNames: function() {
        var hour12Formatter = getIntlFormatter({
          hour: "numeric",
          hour12: true
        });
        return [1, 13].map((hours) => {
          var hourNumberText = formatNumber(1);
          var timeParts = hour12Formatter(new Date(0, 0, 1, hours)).split(hourNumberText);
          if (2 !== timeParts.length) {
            return "";
          }
          var biggerPart = timeParts[0].length > timeParts[1].length ? timeParts[0] : timeParts[1];
          return biggerPart.trim();
        });
      },
      format: function(date, _format) {
        if (!date) {
          return;
        }
        if (!_format) {
          return date;
        }
        if ("function" !== typeof _format && !_format.formatter) {
          _format = _format.type || _format;
        }
        var intlFormat = getIntlFormat(_format);
        if (intlFormat) {
          return getIntlFormatter(intlFormat)(date);
        }
        var formatType = typeof _format;
        if (_format.formatter || "function" === formatType || "string" === formatType) {
          return this.callBase.apply(this, arguments);
        }
        return getIntlFormatter(_format)(date);
      },
      parse: function(dateString, format2) {
        var formatter;
        if (format2 && !format2.parser && "string" === typeof dateString) {
          dateString = normalizeMonth(dateString);
          formatter = (date) => normalizeMonth(this.format(date, format2));
        }
        return this.callBase(dateString, formatter || format2);
      },
      _parseDateBySimpleFormat: function(dateString, format2) {
        dateString = normalizeNumerals(dateString);
        var formatParts = this.getFormatParts(format2);
        var dateParts = dateString.split(/\D+/).filter((part) => part.length > 0);
        if (formatParts.length !== dateParts.length) {
          return;
        }
        var dateArgs = this._generateDateArgs(formatParts, dateParts);
        var constructValidDate = (ampmShift) => {
          var parsedDate = ((dateArgs2, ampmShift2) => {
            var hoursShift = ampmShift2 ? 12 : 0;
            return new Date(dateArgs2.year, dateArgs2.month, dateArgs2.day, (dateArgs2.hours + hoursShift) % 24, dateArgs2.minutes, dateArgs2.seconds);
          })(dateArgs, ampmShift);
          if (dateStringEquals(normalizeNumerals(this.format(parsedDate, format2)), dateString)) {
            return parsedDate;
          }
        };
        return constructValidDate(false) || constructValidDate(true);
      },
      _generateDateArgs: function(formatParts, dateParts) {
        var currentDate = /* @__PURE__ */ new Date();
        var dateArgs = {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth(),
          day: currentDate.getDate(),
          hours: 0,
          minutes: 0,
          seconds: 0
        };
        formatParts.forEach((formatPart, index) => {
          var datePart = dateParts[index];
          var parsed = parseInt(datePart, 10);
          if ("month" === formatPart) {
            parsed -= 1;
          }
          dateArgs[formatPart] = parsed;
        });
        return dateArgs;
      },
      formatUsesMonthName: function(format2) {
        if ("object" === typeof format2 && !(format2.type || format2.format)) {
          return "long" === format2.month;
        }
        return this.callBase.apply(this, arguments);
      },
      formatUsesDayName: function(format2) {
        if ("object" === typeof format2 && !(format2.type || format2.format)) {
          return "long" === format2.weekday;
        }
        return this.callBase.apply(this, arguments);
      },
      getTimeSeparator: function() {
        return normalizeNumerals(formatDateTime(new Date(2001, 1, 1, 11, 11), {
          hour: "numeric",
          minute: "numeric",
          hour12: false
        })).replace(/\d/g, "");
      },
      getFormatParts: function(format2) {
        if ("string" === typeof format2) {
          return this.callBase(format2);
        }
        var intlFormat = extend({}, intlFormats[format2.toLowerCase()]);
        var date = new Date(2001, 2, 4, 5, 6, 7);
        var formattedDate = getIntlFormatter(intlFormat)(date);
        formattedDate = normalizeNumerals(formattedDate);
        return [{
          name: "year",
          value: 1
        }, {
          name: "month",
          value: 3
        }, {
          name: "day",
          value: 4
        }, {
          name: "hours",
          value: 5
        }, {
          name: "minutes",
          value: 6
        }, {
          name: "seconds",
          value: 7
        }].map((part) => ({
          name: part.name,
          index: formattedDate.indexOf(part.value)
        })).filter((part) => part.index > -1).sort((a, b) => a.index - b.index).map((part) => part.name);
      }
    };
  }
});

// node_modules/devextreme/esm/localization/date.js
var DEFAULT_DAY_OF_WEEK_INDEX, hasIntl2, FORMATS_TO_PATTERN_MAP, possiblePartPatterns, dateLocalization, date_default2;
var init_date2 = __esm({
  "node_modules/devextreme/esm/localization/date.js"() {
    init_dependency_injector();
    init_type();
    init_iterator();
    init_errors();
    init_date_formatter();
    init_date_format();
    init_date_parser();
    init_default_date_names();
    init_first_day_of_week_data();
    init_core();
    init_number3();
    init_date();
    DEFAULT_DAY_OF_WEEK_INDEX = 0;
    hasIntl2 = "undefined" !== typeof Intl;
    FORMATS_TO_PATTERN_MAP = {
      shortdate: "M/d/y",
      shorttime: "h:mm a",
      longdate: "EEEE, MMMM d, y",
      longtime: "h:mm:ss a",
      monthandday: "MMMM d",
      monthandyear: "MMMM y",
      quarterandyear: "QQQ y",
      day: "d",
      year: "y",
      shortdateshorttime: "M/d/y, h:mm a",
      longdatelongtime: "EEEE, MMMM d, y, h:mm:ss a",
      month: "LLLL",
      shortyear: "yy",
      dayofweek: "EEEE",
      quarter: "QQQ",
      hour: "HH",
      minute: "mm",
      second: "ss",
      millisecond: "SSS",
      "datetime-local": "yyyy-MM-ddTHH':'mm':'ss"
    };
    possiblePartPatterns = {
      year: ["y", "yy", "yyyy"],
      day: ["d", "dd"],
      month: ["M", "MM", "MMM", "MMMM"],
      hours: ["H", "HH", "h", "hh", "ah"],
      minutes: ["m", "mm"],
      seconds: ["s", "ss"],
      milliseconds: ["S", "SS", "SSS"]
    };
    dateLocalization = dependency_injector_default({
      engine: function() {
        return "base";
      },
      _getPatternByFormat: function(format2) {
        return FORMATS_TO_PATTERN_MAP[format2.toLowerCase()];
      },
      _expandPattern: function(pattern) {
        return this._getPatternByFormat(pattern) || pattern;
      },
      formatUsesMonthName: function(format2) {
        return -1 !== this._expandPattern(format2).indexOf("MMMM");
      },
      formatUsesDayName: function(format2) {
        return -1 !== this._expandPattern(format2).indexOf("EEEE");
      },
      getFormatParts: function(format2) {
        var pattern = this._getPatternByFormat(format2) || format2;
        var result = [];
        each(pattern.split(/\W+/), (_, formatPart) => {
          each(possiblePartPatterns, (partName, possiblePatterns) => {
            if (possiblePatterns.includes(formatPart)) {
              result.push(partName);
            }
          });
        });
        return result;
      },
      getMonthNames: function(format2) {
        return default_date_names_default.getMonthNames(format2);
      },
      getDayNames: function(format2) {
        return default_date_names_default.getDayNames(format2);
      },
      getQuarterNames: function(format2) {
        return default_date_names_default.getQuarterNames(format2);
      },
      getPeriodNames: function(format2) {
        return default_date_names_default.getPeriodNames(format2);
      },
      getTimeSeparator: function() {
        return ":";
      },
      is24HourFormat: function(format2) {
        var amTime = new Date(2017, 0, 20, 11, 0, 0, 0);
        var pmTime = new Date(2017, 0, 20, 23, 0, 0, 0);
        var amTimeFormatted = this.format(amTime, format2);
        var pmTimeFormatted = this.format(pmTime, format2);
        for (var i = 0; i < amTimeFormatted.length; i++) {
          if (amTimeFormatted[i] !== pmTimeFormatted[i]) {
            return !isNaN(parseInt(amTimeFormatted[i]));
          }
        }
      },
      format: function(date, _format) {
        if (!date) {
          return;
        }
        if (!_format) {
          return date;
        }
        var formatter;
        if ("function" === typeof _format) {
          formatter = _format;
        } else if (_format.formatter) {
          formatter = _format.formatter;
        } else {
          _format = _format.type || _format;
          if (isString(_format)) {
            _format = FORMATS_TO_PATTERN_MAP[_format.toLowerCase()] || _format;
            return number_default2.convertDigits(getFormatter3(_format, this)(date));
          }
        }
        if (!formatter) {
          return;
        }
        return formatter(date);
      },
      parse: function(text, format2) {
        var that = this;
        var ldmlFormat;
        var formatter;
        if (!text) {
          return;
        }
        if (!format2) {
          return this.parse(text, "shortdate");
        }
        if (format2.parser) {
          return format2.parser(text);
        }
        if ("string" === typeof format2 && !FORMATS_TO_PATTERN_MAP[format2.toLowerCase()]) {
          ldmlFormat = format2;
        } else {
          formatter = (value) => {
            var text2 = that.format(value, format2);
            return number_default2.convertDigits(text2, true);
          };
          try {
            ldmlFormat = getFormat2(formatter);
          } catch (e) {
          }
        }
        if (ldmlFormat) {
          text = number_default2.convertDigits(text, true);
          return getParser(ldmlFormat, this)(text);
        }
        errors_default.log("W0012");
        var result = new Date(text);
        if (!result || isNaN(result.getTime())) {
          return;
        }
        return result;
      },
      firstDayOfWeekIndex: function() {
        var index = core_default.getValueByClosestLocale((locale2) => first_day_of_week_data_default[locale2]);
        return void 0 === index ? DEFAULT_DAY_OF_WEEK_INDEX : index;
      }
    });
    if (hasIntl2) {
      dateLocalization.inject(date_default);
    }
    date_default2 = dateLocalization;
  }
});

// node_modules/devextreme/esm/localization.js
var localization_exports = {};
__export(localization_exports, {
  date: () => date_default2,
  disableIntl: () => disableIntl,
  formatDate: () => formatDate,
  formatMessage: () => formatMessage,
  formatNumber: () => formatNumber2,
  loadMessages: () => loadMessages,
  locale: () => locale,
  message: () => message_default,
  number: () => number_default2,
  parseDate: () => parseDate,
  parseNumber: () => parseNumber2
});
function disableIntl() {
  if ("intl" === number_default2.engine()) {
    number_default2.resetInjection();
  }
  if ("intl" === date_default2.engine()) {
    date_default2.resetInjection();
  }
}
var locale, loadMessages, formatMessage, formatNumber2, parseNumber2, formatDate, parseDate;
var init_localization = __esm({
  "node_modules/devextreme/esm/localization.js"() {
    init_core();
    init_message();
    init_number3();
    init_date2();
    init_currency();
    locale = core_default.locale.bind(core_default);
    loadMessages = message_default.load.bind(message_default);
    formatMessage = message_default.format.bind(message_default);
    formatNumber2 = number_default2.format.bind(number_default2);
    parseNumber2 = number_default2.parse.bind(number_default2);
    formatDate = date_default2.format.bind(date_default2);
    parseDate = date_default2.parse.bind(date_default2);
  }
});

export {
  core_default,
  init_core,
  message_default,
  init_message,
  sign,
  fitIntoRange,
  inRange,
  getExponent,
  adjust,
  getPrecision,
  solveCubicEquation,
  trunc,
  getRemainderByDivision,
  getExponentLength,
  roundFloatPart,
  init_math,
  getFormat,
  init_number,
  init_currency,
  number_default2 as number_default,
  init_number3 as init_number2,
  getFormatter3 as getFormatter,
  init_date_formatter,
  getFormat2,
  init_date_format,
  getRegExpInfo,
  getPatternSetters,
  init_date_parser,
  default_date_names_default,
  init_default_date_names,
  date_default2 as date_default,
  init_date2 as init_date,
  locale,
  loadMessages,
  formatMessage,
  formatNumber2 as formatNumber,
  parseNumber2 as parseNumber,
  formatDate,
  parseDate,
  disableIntl,
  localization_exports,
  init_localization
};
//# sourceMappingURL=chunk-IQXVETD3.js.map
