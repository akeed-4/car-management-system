import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AttachmentService } from '../../../../services/attachment.service';
import { Attachment } from '../../../../models/attachment.model';
import { ToastService } from '../../../../services/toast.service';

/**
 * Generic file attachment list + uploader for any business document, keyed by
 * (documentType, documentId). Backed by the shared api/attachments endpoints so
 * Corporate Delivery, Bank Approval, and Bank Delivery don't each roll their own upload logic.
 *
 * When documentId is not yet known (document not saved yet), files are held locally
 * (pendingFiles) and the host component is responsible for uploading them after save
 * via uploadPending(documentId).
 */
@Component({
  selector: 'app-attachment-uploader',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatListModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './attachment-uploader.component.html',
  styleUrls: ['./attachment-uploader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentUploaderComponent implements OnInit {
  private attachmentService = inject(AttachmentService);
  private toast = inject(ToastService);

  @Input() documentType!: string;
  @Input() documentId: number | null = null;
  @Input() userId = 1;
  @Input() label = 'DOCUMENT.ATTACHMENTS';

  attachments = signal<Attachment[]>([]);
  pendingFiles = signal<File[]>([]);
  uploading = signal(false);

  ngOnInit(): void {
    if (this.documentId) {
      this.loadAttachments();
    }
  }

  private loadAttachments(): void {
    this.attachmentService.getForDocument(this.documentType, this.documentId!).subscribe({
      next: files => this.attachments.set(files),
      error: () => this.toast.showError('DOCUMENT.ATTACHMENTS_LOAD_FAILED')
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    input.value = '';

    if (this.documentId) {
      files.forEach(file => this.uploadFile(file, this.documentId!));
    } else {
      this.pendingFiles.update(list => [...list, ...files]);
    }
  }

  private uploadFile(file: File, documentId: number): void {
    this.uploading.set(true);
    this.attachmentService.upload(file, this.documentType, documentId, this.userId).subscribe({
      next: attachment => {
        this.attachments.update(list => [...list, attachment]);
        this.uploading.set(false);
      },
      error: () => {
        this.toast.showError('DOCUMENT.ATTACHMENT_UPLOAD_FAILED');
        this.uploading.set(false);
      }
    });
  }

  /** Called by the host component once the parent document has a real id. */
  uploadPending(documentId: number): void {
    this.documentId = documentId;
    const files = this.pendingFiles();
    this.pendingFiles.set([]);
    files.forEach(file => this.uploadFile(file, documentId));
  }

  removePending(index: number): void {
    this.pendingFiles.update(list => list.filter((_, i) => i !== index));
  }

  removeAttachment(attachment: Attachment): void {
    this.attachmentService.delete(attachment.id).subscribe({
      next: () => this.attachments.update(list => list.filter(a => a.id !== attachment.id)),
      error: () => this.toast.showError('DOCUMENT.ATTACHMENT_DELETE_FAILED')
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
