import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-report-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './report-toolbar.component.html',
  styleUrl: './report-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportToolbarComponent {
  @Input() recordCount = 0;
  @Input() canPrint = true;
  @Input() canExportExcel = true;
  @Input() canExportPdf = true;

  @Output() refresh = new EventEmitter<void>();
  @Output() exportExcel = new EventEmitter<void>();
  @Output() exportPdf = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() columnChooser = new EventEmitter<void>();
}
