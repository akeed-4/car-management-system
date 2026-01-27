import { Direction } from '@angular/cdk/bidi';
import { Injectable } from '@angular/core';
import { LanguageService } from './language.service';
import { CurrentSettingService } from './current-setting.service';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { formatNumber } from '@angular/common';
import { printSettingVm } from '../models/setting.model';
import { roundNumber } from '../models/utils';
import { reportFilterDto, dataGridData, printFormData, PrintOptions } from '../models/grid.model';
import { DateManagerService } from './date-manager.service';
import { NotificationService } from './notification.service';
import { SettingService } from './setting.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  constructor(private languageService:LanguageService,private dateManagerService : DateManagerService,private currentSettingService:CurrentSettingService,private translateService:TranslateService,private settingService: SettingService,private dialog:MatDialog,private notificationService:NotificationService) {
  }
    textDir : Direction = this.languageService.getCurrentLanguage() == 'en' ? 'ltr' : 'rtl';
    textAlign = this.languageService.getCurrentLanguage() == 'en' ? 'left' : 'right';
    dxFormat = this.currentSettingService.getDxFormat();
    dxFormatSummary = this.currentSettingService.getDxFormatSummary();
    setting! : printSettingVm;
    handleGridPrint(dataGrid: any,menuCode:number|null,title = 'Report',filterModel:reportFilterDto){
      var settings = this.settingService.getPrintSetting(menuCode);

      forkJoin([settings]).subscribe({
        next: ([setting]) => {
          this.setting = setting;
        },
        error: (error) => {
          console.error('Error in one of the requests:', error);
        },
        complete: () => {
          this.dialog.closeAll();
          if(this.setting.printFormId == printFormData.formal){
            this.printGridFormal(dataGrid,title,filterModel,menuCode);
          }
          if(this.setting.printFormId == printFormData.semiFormal){
            this.printGridSemiFormal(dataGrid,title,filterModel,menuCode);
          }
        }
      });
    }

    //#region printGridSemiFormal
    printGridSemiFormal(dataGrid: any, title = 'Report', filterModel: any, menuCode: number | null = null) {
      debugger;
      var serial = this.translateService.instant('general.serial');
      var page = this.translateService.instant('general.page');
      var of = this.translateService.instant('general.of');
      const columns = dataGrid.getVisibleColumns();
      const dataSource = dataGrid.getDataSource();
      const data = dataSource.items();
      const summaryItems = dataGrid.option('summary.totalItems');
      const summaries = this.getSummaryValues(data, summaryItems, columns);
      var user = this.setting.printUserName ? this.translateService.instant('general.printedBy') + this.currentSettingService.getUserFullName() : '';
      var dateTime = this.setting.printDateTime ? this.translateService.instant('general.printedOn') + ' ' + this.dateManagerService.formatToDayFirst(new Date(),true) : '';
      var period = filterModel.fullPeriod
        ? this.translateService.instant('report.allPeriod')
        : `${this.translateService.instant('report.aboutPeriod', { fromDate: this.dateManagerService.formatToDayFirst(filterModel.fromDate), toDate: this.dateManagerService.formatToDayFirst(filterModel.toDate) })}`;
        var businessName = this.getReportAbout(filterModel);

      // Create printable HTML content
      const printContent = `
          <html dir="${this.textDir}">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <meta name="format-detection" content="telephone=no, email=no, address=no">
        <style>
          @media print {
            @page {
              margin: ${this.setting.topMargin}px ${this.setting.rightMargin}px ${this.setting.bottomMargin}px ${this.setting.leftMargin}px;
              @top-left { content: "${user}"; font-family: Arial; font-size: 10px; }
              @top-center { content: ""; }
              @top-right { content: "${dateTime}"; font-family: Arial; font-size: 10px; }
              @bottom-left { content: ""; }
              @bottom-center { content: "${page}" counter(page) "${of}" counter(pages); font-family: Arial; font-size: 10px; }
              @bottom-right { content: ""; }
            }

            body {
              margin: 0;
              font-family: Arial;
            }
            .report-name {
              text-align: center;
              font-size: ${this.setting.reportNameFont}px;
              font-weight: bold;
              line-height: 1.1;
              margin: 0;
              margin-bottom: 5px;
            }
            .period {
              text-align: center;
              font-size: ${this.setting.reportNameFont}px;
              font-weight: bold;
              line-height: 1;
              margin: 0;
              margin-bottom: 5px;
            }
            .institution-name {
              text-align: center;
              font-size: ${this.setting.institutionNameFont}px;
              font-weight: bold;
              line-height: 1.2;
              margin: 0;
              margin-bottom: 5px;
            }
            .institution-other-name {
              text-align: center;
              font-size: ${this.setting.institutionOtherNameFont}px;
              font-weight: bold;
              line-height: 1.1;
              margin: 0;
              margin-bottom: 5px;
            }
            .store-name {
              text-align: center;
              font-size: ${this.setting.businessFont}px;
              font-weight: bold;
              line-height: 1.1;
              margin: 0;
              margin-bottom: 5px;
            }
            .address1 {
              text-align: center;
              font-size: ${this.setting.address1Font}px;
              font-weight: bold;
              line-height: 1;
              margin: 0;
              margin-bottom: 5px;
            }
            .address2 {
              text-align: center;
              font-size: ${this.setting.address2Font}px;
              font-weight: bold;
              line-height: 1;
              margin: 0;
              margin-bottom: 5px;
            }
            .address3 {
              text-align: center;
              font-size: ${this.setting.address3Font}px;
              font-weight: bold;
              line-height: 1;
              margin: 0;
              margin-bottom: 5px;
            }
            .user-print {
              text-align: right;
              font-size: 10px;
            }
            .print-institution {
              text-align: center;
              margin-bottom: 10px;
            }
            .print-address {
              text-align: center;
              margin-bottom: 10px;
            }
            .top-notes {
              text-align: ${this.textAlign};
              margin-top: 20px;
              margin-bottom: 20px;
              font-size: ${this.setting.topNotesFirstPageOnlyFont}px;
              font-weight: bold;
            }
            .bottom-notes {
              text-align: ${this.textAlign};
              margin-top: 20px;
              font-size: ${this.setting.bottomNotesLastPageOnlyFont}px;
              font-weight: bold;
            }
            .bottom-all-notes {
              text-align: ${this.textAlign};
              margin-top: 10px;
              font-size: ${this.setting.bottomNotesAllPagesFont}px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              page-break-inside: auto;
              font-family: Calibri;
              font-size: ${this.setting.gridFont}px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f2f2f2;
              position: sticky;
              top: 0;
            }
            tbody tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            /* The tfoot below will only contain the repeated notes */
            tfoot {
              display: table-footer-group;
            }
            tfoot tr td {
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            footer {
              position: fixed;
              bottom: -10pt;
              height: 25pt;
              z-index: 1000;
            }
            .align-right{
              text-align: right;
            }
            .account-details {
              page-break-inside: avoid;
            }
            .account-details table {
              margin-top: 0;
              border: none !important;
            }
            .account-details th, .account-details td {
              border: none !important;
            }
          }

          @media screen {
            .print-only {
              display: none;
            }
          }
        </style>
        <style>
        @media print {
        .no-print {
          display: none !important;
          }
        }
        /* Modern close button styling */
        .close-btn-modern {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 2em auto 0 auto;
          padding: 0.75em 2.5em;
          background: linear-gradient(90deg, #e53935 60%, #ffb300 100%);
          color: #fff;
          border: none;
          border-radius: 30px;
          font-size: 1.15em;
          font-weight: 600;
          box-shadow: 0 2px 8px 0 rgba(229,57,53,0.10);
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          outline: none;
          letter-spacing: 1px;
          min-width: 180px;
        }
        .close-btn-modern:hover, .close-btn-modern:focus {
          background: linear-gradient(90deg, #d32f2f 60%, #ffa000 100%);
          box-shadow: 0 4px 16px 0 rgba(229,57,53,0.15);
          transform: translateY(-2px) scale(1.03);
        }
        </style>
      </head>
      <script>
      document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('closeBtn');
        if (btn) {
          btn.addEventListener('click', () => window.close());
        }
      });
      </script>
      <body>
        <div class="print-institution">
          ${(((this.setting.institutionName?.trim()?.length || 0) > 0) && this.setting.institutionName != null)
              ? '<p class="institution-name">' + this.setting.institutionName + '</p>'
              : ''}
          ${(((this.setting.institutionOtherName?.trim()?.length || 0) > 0) && this.setting.institutionOtherName != null)
              ? '<p class="institution-other-name">' + this.setting.institutionOtherName + '</p>'
              : ''}
          ${this.setting.printBusinessName
              ? '<p class="store-name">' + businessName + '</p>'
              : ''}
        </div>
        <div class="print-address">
          ${(((this.setting.address1?.trim()?.length || 0) > 0) && this.setting.address1 != null)
              ? '<p class="address1">' + this.setting.address1 + '</p>'
              : ''}
          ${(((this.setting.address2?.trim()?.length || 0) > 0) && this.setting.address2 != null)
              ? '<p class="address2">' + this.setting.address2 + '</p>'
              : ''}
          ${(((this.setting.address3?.trim()?.length || 0) > 0) && this.setting.address3 != null)
              ? '<p class="address3">' + this.setting.address3 + '</p>'
              : ''}
        </div>
        <p class="report-name">${title}</p>
        <p class="period">${period}</p>
        ${(((this.setting.topNotesFirstPageOnly?.trim()?.length || 0) > 0) && this.setting.topNotesFirstPageOnly != null)
              ? '<p class="top-notes">' + this.setting.topNotesFirstPageOnly + '</p>'
              : ''}
        ${this.generateAccountDetailsHtml(menuCode, data, columns.length + 1, false)}
        <table>
          <thead>
            ${(((this.setting.topNotesAllPages?.trim()?.length || 0) > 0) && this.setting.topNotesAllPages != null)
                ? `<tr><th colspan="${columns.length + 1}" style="text-align: center; border: none !important;">${this.setting.topNotesAllPages}</th></tr>`
                : ''}
            <tr>
              <th>${serial}</th>
              ${columns.map((col: { caption: any; dataField: any }) => `<th>${col.caption || col.dataField}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((item: { [x: string]: any }, index: number) => `
              <tr>
                <td>${index + 1}</td>
                ${columns.map((col: {format: string;dataType: string; lookup: any; dataField: string | number }) =>
                `<td class="${(col.format ==this.dxFormat && col.dataType ==dataGridData.dataTypeNumber ) ? 'align-right' : ''}">${this.formatField(col, item)}</td>`).join('')}
              </tr>
            `).join('')}
            <!-- Summary row appears only once at the end of tbody -->
            <tr class="summary-row">
              <td></td>
              ${columns.map((col: any) => `<td>${this.getColumnSummary(col, summaries)}</td>`).join('')}
            </tr>
          </tbody>
          <tfoot class="print-only">
            ${(((this.setting.bottomNotesAllPages?.trim()?.length || 0) > 0) && this.setting.bottomNotesAllPages != null)
                ? `<tr>
                      <td colspan="${columns.length + 1}" class="bottom-all-notes" style="text-align: center; border: none !important;">
                        ${this.setting.bottomNotesAllPages}
                      </td>
                   </tr>`
                : ''}
          </tfoot>
        </table>
        ${(((this.setting.bottomNotesLastPageOnly?.trim()?.length || 0) > 0) && this.setting.bottomNotesLastPageOnly != null)
              ? '<p class="bottom-notes">' + this.setting.bottomNotesLastPageOnly + '</p>'
              : ''}
      <button id="closeBtn" class="no-print close-btn-modern">
        &#10005; ${this.translateService.instant('general.closeWindow') || 'Close window'}
      </button>
    </body>
    </html>
      `;

      // Open print window
      this.print(printContent);

      // const printWindow = window.open('', '_blank');
      // if (!printWindow) { this.notificationService.warningAlert(this.translateService.instant('general.printWindowBlocked')); return; }
      // printWindow?.document.write(printContent);
      // printWindow?.document.close();

      // // Delay print to ensure content loads
      // setTimeout(() => {
      //   printWindow?.print();
      //   printWindow?.close();
      // }, 250);
    }
    //#endregion


    //#region printGridFormal
printGridFormal(dataGrid: any, title = 'Report',filterModel:any, menuCode: number | null = null): void {
  debugger;
  var serial = this.translateService.instant('general.serial');
  var page = this.translateService.instant('general.page');
  var of = this.translateService.instant('general.of');
  const columns = dataGrid.getVisibleColumns();
  const dataSource = dataGrid.getDataSource();
  const data = dataSource.items();
  const summaryItems = dataGrid.option('summary.totalItems');
  const summaries = this.getSummaryValues(data, summaryItems, columns);
  var user = this.setting.printUserName
    ? this.translateService.instant('general.printedBy') + this.currentSettingService.getUserFullName()
    : '';
  var dateTime = this.setting.printDateTime
    ? this.translateService.instant('general.printedOn') + ' ' + this.dateManagerService.formatToDayFirst(new Date(),true)
    : '';
    var period = filterModel.fullPeriod ? this.translateService.instant('report.allPeriod') : `${this.translateService.instant('report.aboutPeriod',{fromDate:this.dateManagerService.formatToDayFirst(filterModel.fromDate),toDate:this.dateManagerService.formatToDayFirst(filterModel.toDate)})}`;
    var businessName = this.getReportAbout(filterModel);

  //Dynamic header/footer lines and table data.
  var headerLines = [
    title,
    this.setting.printBusinessName ? businessName : null,
    period,
    this.setting.topNotesAllPages ? this.setting.topNotesAllPages : null,
  ];

  var footerLines = [
    this.setting.bottomNotesAllPages ? this.setting.bottomNotesAllPages : null,
  ];

  var tableColumns = [{ caption: serial, dataField: 'serial', dataType: dataGridData.dataTypeNumber }];
  var captions = columns.map((x: any) => ({
    caption: x.caption,
    dataField: x.dataField,
    dataType: x.dataType,
    format: x.format
  }));

  var allCaptions = tableColumns.concat(captions);

  var tableData = data.map((item: any, index: any) => {
    const newItem = allCaptions.reduce((acc: any, field: any) => {
      if (item.hasOwnProperty(field.dataField)) {
        acc[field.dataField] = this.formatField(field, item);
      }
      return acc;
    }, {});
    // Add Serial Number
    newItem.serial = index + 1;
    return newItem;
  });

  const options: PrintOptions = {
    headerLines: headerLines.filter(x=>x != null),
    footerLines: footerLines.filter(x=>x != null),
    tableColumns: allCaptions,
    tableData: tableData,
    title: title
  };

  // Generate account details HTML dynamically
  const accountDetailsHtml = this.generateAccountDetailsHtml(menuCode, data, options.tableColumns.length, true);

  // const printWindow = window.open('', '_blank');
  // if (!printWindow) {
  //   console.error('Unable to open print window.');
  //   return;
  // }

  // Build the top header row with logo and current datetime.
  const headerTopRow = `
    <tr class="header-top-row">
      <td colspan="${options.tableColumns.length}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
          <p style="/* white-space: pre-line; */display: contents;">
         <span class="institution-name">${((this.setting.institutionName?.trim()?.length || 0 > 0) && this.setting.institutionName != null) ? this.setting.institutionName + '</span><br>' : '</span>'}
         <span class="institution-other-name">${((this.setting.institutionOtherName?.trim()?.length || 0 > 0) && this.setting.institutionOtherName != null) ? this.setting.institutionOtherName + '</span><br>' : '</span>'}
         <span class="address1">${((this.setting.address1?.trim()?.length || 0 > 0) && this.setting.address1 != null) ? this.setting.address1 + '</span><br>' : '</span>'}
         <span class="address2">${((this.setting.address2?.trim()?.length || 0 > 0) && this.setting.address2 != null) ? this.setting.address2 + '</span><br>' : '</span>'}
         <span class="address3">${((this.setting.address3?.trim()?.length || 0 > 0) && this.setting.address3 != null) ? this.setting.address3 + '</span><br>' : '</span>'}
          </p>
          </div>
          ${(this.setting.printInstitutionLogo && (this.setting?.logo?.trim()?.length || 0 ) > 30) ? '<div class="logo"><img src="' + this.setting.logo + '" alt="Logo"></div>' : ''}
        </div>
      </td>
    </tr>
  `;

  // Build additional header rows.
  const additionalHeaderRows = options.headerLines
    .map(line => `
      <tr class="dynamic-header-row">
        <td colspan="${options.tableColumns.length}" style="text-align: center;">${line}</td>
      </tr>
    `)
    .join('');

  // Build the column header row.
  const columnHeaderRow = `<tr>${options.tableColumns.map(col => `<th>${col.caption}</th>`).join('')}</tr>`;

  // Combine into <thead>.
  const theadHtml = `<thead>
                       ${headerTopRow}
                       ${additionalHeaderRows}
                       ${accountDetailsHtml}
                       ${columnHeaderRow}
                     </thead>`;

  // Build the table body rows. We insert the summary row only after the last data row.
  const tbodyHtml = `<tbody>
                       ${options.tableData.map((row, index) => {
                         let rowHtml = '';
                         if (typeof row === 'object' && !Array.isArray(row)) {
                           rowHtml = `<tr>${options.tableColumns
                             .map(col => `<td class="${(col.dataType == dataGridData.dataTypeNumber && col.format == this.dxFormat) ? 'align-right' : ''}">${row[col.dataField] !== undefined ? row[col.dataField] : ''}</td>`)
                             .join('')}</tr>`;
                         } else if (Array.isArray(row)) {
                           rowHtml = `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                         }
                         // If this is the last row, append the summary row.
                         if (index === options.tableData.length - 1) {
                           rowHtml += `
                             <tr class="summary-row print-only">
                               <td></td>
                               ${columns
                                 .map((col: any) => `<td>${this.getColumnSummary(col, summaries)}</td>`)
                                 .join('')}
                             </tr>
                           `;
                         }
                         return rowHtml;
                       }).join('')}
                     </tbody>`;

  // Build the dynamic footer rows (from footerLines) inside <tfoot>.
  const footerRows = options.footerLines
    .map(line => `
      <tr class="dynamic-footer-row">
        <td colspan="${options.tableColumns.length}" style="text-align: center;">${line}</td>
      </tr>
    `)
    .join('');

  const tfootHtml = `<tfoot>
                       ${footerRows}
                     </tfoot>`;

  // Construct the complete HTML document.
  const htmlContent = `
    <html dir="${this.textDir}">
    <head>
    <meta charset="UTF-8" />
      <title>${options.title || 'Print Document'}</title>
      <meta name="format-detection" content="telephone=no, email=no, address=no">
      <style>
        @page {
          margin: ${this.setting.topMargin}px ${this.setting.rightMargin}px ${this.setting.bottomMargin}px  ${this.setting.leftMargin}px;
          @top-left { content: "${user}";font-family: Arial;font-size: 10px;}
          @top-center { content: ""; }
          @top-right { content: "${dateTime}";font-family: Arial;font-size: 10px; }
          @bottom-left { content: ""; }
          @bottom-center { content: "${page}" counter(page) "${of}" counter(pages); font-family: Arial;font-size: 10px;}
          @bottom-right { content: ""; }
        }
        .first-page-line {
          text-align: ${this.textAlign};
          margin: 10px 0;
          font-weight: bold;
          font-size: ${this.setting.topNotesFirstPageOnly}px;
        }
        .last-page-line {
          text-align: ${this.textAlign};
          margin: 10px 0;
          font-weight: bold;
          font-size: ${this.setting.bottomNotesLastPageOnly}px;
        }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; font-family: Calibri; font-size: ${this.setting.gridFont}px; }
        th, td { border: 1px solid #000; padding: 5px; text-align: center; }
        .header-top-row td,
        .dynamic-header-row td,
        .dynamic-footer-row td { border: none !important; }
        .logo img { width: 80px; height: 80px; object-fit: contain; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .institution-name { font-size: ${this.setting.institutionNameFont}px; font-weight: bold; line-height: 1.2; margin: 0; }
        .institution-other-name { font-size: ${this.setting.institutionOtherNameFont}px; font-weight: bold; line-height: 1.1; margin: 0; }
        .address1 { font-size: ${this.setting.address1Font}px; font-weight: bold; line-height: 1; margin: 0; }
        .address2 { font-size: ${this.setting.address2Font}px; font-weight: bold; line-height: 1; margin: 0; }
        .address3 { font-size: ${this.setting.address3Font}px; font-weight: bold; line-height: 1; margin: 0; }
        .dynamic-header-row{ font-size: ${this.setting.reportNameFont}px; font-weight: bold; line-height: 1; margin: 0; }
        .dynamic-footer-row{ font-size: ${this.setting.bottomNotesAllPagesFont}px; font-weight: bold; line-height: 1; margin: 0; }
        .account-details-row td { border: none !important; background-color: #f5f5f5; }
        .top-notes { text-align: ${this.textAlign}; font-size: ${this.setting.topNotesFirstPageOnlyFont}px; margin-top: 20px; }
        .align-right{text-align: right;}
      </style>
      <style>
        @media print {
        .no-print {
          display: none !important;
          }
        }
        /* Modern close button styling */
        .close-btn-modern {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 2em auto 0 auto;
          padding: 0.75em 2.5em;
          background: linear-gradient(90deg, #e53935 60%, #ffb300 100%);
          color: #fff;
          border: none;
          border-radius: 30px;
          font-size: 1.15em;
          font-weight: 600;
          box-shadow: 0 2px 8px 0 rgba(229,57,53,0.10);
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          outline: none;
          letter-spacing: 1px;
          min-width: 180px;
        }
        .close-btn-modern:hover, .close-btn-modern:focus {
          background: linear-gradient(90deg, #d32f2f 60%, #ffb300 100%);
          box-shadow: 0 4px 16px 0 rgba(229,57,53,0.15);
          transform: translateY(-2px) scale(1.03);
        }
      </style>
    </head>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('closeBtn');
        if (btn) {
          btn.addEventListener('click', () => window.close());
        }
      });
    </script>
    <body>
      ${((this.setting.topNotesFirstPageOnly?.trim()?.length || 0 > 0) && this.setting.topNotesFirstPageOnly != null) ? '<div class="first-page-line">' + this.setting.topNotesFirstPageOnly + '</div>' : ''}
      <table>
        ${theadHtml}
        ${tbodyHtml}
        ${tfootHtml}
      </table>
      ${((this.setting.bottomNotesLastPageOnly?.trim()?.length || 0 > 0) && this.setting.bottomNotesLastPageOnly != null) ? '<div class="last-page-line">' + this.setting.bottomNotesLastPageOnly + '</div>' : ''}
      <button id="closeBtn" class="no-print close-btn-modern">
        &#10005; ${this.translateService.instant('general.closeWindow') || 'Close window'}
      </button>
    </body>
    </html>
  `;

  this.print(htmlContent);

//   printWindow.document.open();
//   printWindow.document.write(htmlContent);
//   printWindow.document.close();

//   setTimeout(() => {
//     printWindow?.print();
//     printWindow?.close();
// }, 250);
}

  //#endregion


 // Print the HTML content
  print(html: string) {
    this.currentSettingService
      .usingSmallScreen()
      .pipe(take(1))
      .subscribe({
        next: (isSmallScreen) => {
          // 1. Create a blob and blob‑URL
          const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
          const url = URL.createObjectURL(blob);

          // 2. Open a new tab at that blob‑URL
          const w = window.open(url, '_blank');
          if (!w) {
            this.notificationService.warningAlert(
              this.translateService.instant(isSmallScreen ? 'general.printWindowBlockedOnMobile' : 'general.printWindowBlocked')
            );
            URL.revokeObjectURL(url);
            return;
          }

          // 3. When it's loaded, focus, hook afterprint, then print
          w.onload = () => {
            w.focus();

            // 4. Only revoke (and optionally close) after the print/save flow finishes
            w.onafterprint = () => {
              URL.revokeObjectURL(url);
              if (!isSmallScreen) {
                w.close();
              }
            };

            // 5. Trigger Chrome's print / Save as PDF dialog
            w.print();
          };
        },
        error: (error) => {
          console.error('Error in print subscription:', error);
        }
      });
  }


private formatField(column:any, item:any){
  let value = item[column.dataField];
  return this.applyColumnFormat(column, value);
}

// New summary-related functions
getSummaryValues(data: any, summaryItems: any, columns: any) {
  const summaries: any = {};

  summaryItems.forEach((item: { column: any; summaryType: any; displayFormat: any; }) => {
      const column = columns.find((c: { dataField: any; }) => c.dataField === item.column);
      if (!column) return;

      if (!summaries[item.column]) {
          summaries[item.column] = [];
      }

      const summary = {
          type: item.summaryType,
          value: this.calculateSummary(data, item, column),
          format: column.format,
          displayFormat: item.displayFormat
      };

      summaries[item.column].push(summary);
  });

  return summaries;
}

calculateSummary(data: any, summaryItem: any, column: any) {
  const values = data.map((item: { [x: string]: any; }) => {
      const value = item[summaryItem.column];
      return typeof value === 'number' ? value : 0;
  });

  switch(summaryItem.summaryType) {
      case 'sum':
          return values.reduce((a: any, b: any) => a + b, 0);
      case 'avg':
          return values.length ? values.reduce((a: any, b: any) => a + b, 0) / values.length : 0;
      case 'count':
          return data.length;
      case 'min':
          return Math.min(...values);
      case 'max':
          return Math.max(...values);
      case 'custom':
          return summaryItem.calculateCustomSummary(Option);
      default:
          return '';
  }
}

getColumnSummary(column: any, summaries: any) {
  const columnSummaries = summaries[column.dataField];
  if (!columnSummaries) return '&nbsp;';

  return columnSummaries.map((summary: { value: any; }) => {
      const formattedValue = this.applyColumnFormat(column, summary.value);
      return this.formatSummaryDisplay(summary, formattedValue);
  }).join(', ');
}

formatSummaryDisplay(summary: any, value: any) {
  if (summary.displayFormat) {
      return summary.displayFormat
          .replace('{0}', value)
          .replace('{1}', summary.type.toUpperCase());
  }

  return `${summary.type.toUpperCase()}: ${value}`;
}

private applyColumnFormat(column:any, value:any) {
    if (!column.dataType) return value;

    if(column.dataType == dataGridData.dataTypeString){
      return value ? value : '';
    }
    if (column.dataType == dataGridData.dataTypeDate) {
      if (!value || !this.dateManagerService.isValidDate(value)) {
        return '';
      }
      return this.dateManagerService.formatToDayFirst(value);
    }
    if (column.dataType === dataGridData.dataTypeDatetime) {
      if (!value || !this.dateManagerService.isValidDate(value)) {
        return '';
      }
      return this.dateManagerService.formatToDayFirst(value, true);
    }
    if (column.dataType === dataGridData.dataTypeNumber) {
    //   if(column.format == this.dxFormat){
    //     var returnedNumber = roundNumber(value,this.setting.detailRounding);
    //       return 
    //     //   formatNumber(returnedNumber, this.setting.detailRounding);
    //   }
    //   else if(column.format == this.dxFormatSummary){
    //     var returnedNumber = roundNumber(value,this.setting.sumRounding);
    //     return formatNumber(returnedNumber,this.setting.sumRounding);
    //   }
    //   else{
    //     return roundNumber(value,this.setting.detailRounding);
    //   }
    }
    return value;
}

getReportAbout(filterModel:reportFilterDto){
  var companyName = this.currentSettingService.getCompanyName();
  var branchName = this.currentSettingService.getBranchName();
  if(filterModel.basedOnCompany){
    return `${this.translateService.instant('report.aboutReportCompanyOnly', { companyName: filterModel.companyNames})}`;
  }
  if(filterModel.basedOnStore){
   return `${this.translateService.instant('report.aboutReportFull', { companyName: companyName,branchName:branchName,storeName:filterModel.storeNames})}`;
  }
  return this.setting.businessName;
}

// Generate account details HTML dynamically
private generateAccountDetailsHtml(menuCode: number | null, data: any[], tableColspan: number, isFormalPrint: boolean = false): string {
  if ( !data || data.length === 0) {
    return '';
  }

  const accountData = data[0];
  const fields = [
    { key: 'accountName', label: 'account.accountName' },
    { key: 'accountCode', label: 'account.accountCode' },
    { key: 'taxCode', label: 'company.taxCode' },
    { key: 'commercialRegister', label: 'nationalAddress.commercialRegister' },
    { key: 'iban', label: 'bank.iban' }
  ];

  // Filter fields that have values
  const availableFields = fields.filter(field => accountData[field.key]);
  
  if (availableFields.length === 0) {
    return '';
  }

  // Build rows dynamically - 2 fields per row, except iban which spans full width
  let rows = '';
  let i = 0;
  
  while (i < availableFields.length) {
    const field1 = availableFields[i];
    const field2 = i + 1 < availableFields.length && availableFields[i + 1].key !== 'iban' ? availableFields[i + 1] : null;
    
    if (field1.key === 'iban') {
      // IBAN gets full width
      rows += `
      <tr>
        <td colspan="2" style="text-align: ${this.textAlign}; padding: 10px 15px; border: none; vertical-align: middle;">
          <strong style="display: inline-block; min-width: 120px;">${this.translateService.instant(field1.label)}:</strong> 
          <span>${accountData[field1.key]}</span>
        </td>
      </tr>`;
      i++;
    } else if (field2) {
      // Two fields in one row
      rows += `
      <tr>
        <td style="text-align: center; width: 50%; border: none; vertical-align: middle;">
          <strong style="display: inline-block; min-width: 120px;">${this.translateService.instant(field1.label)}:</strong> 
          <span>${accountData[field1.key]}</span>
        </td>
        <td style="text-align: ${this.textAlign}; width: 50%; border: none; vertical-align: middle;">
          <strong style="display: inline-block; min-width: 120px;">${this.translateService.instant(field2.label)}:</strong> 
          <span>${accountData[field2.key]}</span>
        </td>
      </tr>`;
      i += 2;
    } else {
      // Single field centered in row
      rows += `
      <tr>
        <td colspan="2" style="text-align: ${this.textAlign}; padding: 10px 15px; border: none; vertical-align: middle;">
          <strong style="display: inline-block; min-width: 120px;">${this.translateService.instant(field1.label)}:</strong> 
          <span>${accountData[field1.key]}</span>
        </td>
      </tr>`;
      i++;
    }
  }

  if (isFormalPrint) {
    // For formal print - inside table header
    return `
      <tr class="account-details-row">
        <td colspan="${tableColspan}" style="padding: 0; border: none;">
          <div style="padding: 12px 0;">
            <table style="width: 100%; border: none; margin: 0; font-size: ${this.setting.reportNameFont}px; table-layout: fixed;">
              <colgroup>
                <col style="width: 50%;">
                <col style="width: 50%;">
              </colgroup>
              ${rows}
            </table>
          </div>
        </td>
      </tr>`;
  } else {
    // For semi-formal print - standalone div
    return `
        <div class="account-details" style="margin: 15px 0; padding: 15px; background-color: #f5f5f5; border-${this.textAlign}: 4px solid #333;">
          <table style="border: none; margin: 0; font-size: ${this.setting.reportNameFont}px; table-layout: fixed; width: 100%;">
            <colgroup>
              <col style="width: 50%;">
              <col style="width: 50%;">
            </colgroup>
            ${rows}
          </table>
        </div>`;
  }
}
}