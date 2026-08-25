import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../services/notification.service';

/**
 * Workflow describing one print request against a document screen. The screen
 * keeps full ownership of validation and persistence -- it only tells the
 * service whether the document is already persisted, whether it has unsaved
 * modifications, and how to save/print.
 */
export interface DocumentPrintWorkflow {
  /** True when the document already exists on the server (edit mode). */
  isPersisted: boolean;
  /** True when the user modified the document since the last successful save/load. */
  isDirty: boolean;
  /** The persisted document id, when isPersisted is true. */
  currentId?: number | null;
  /**
   * Persists the document and returns the SERVER-CONFIRMED id, or null when
   * validation/save failed (printing is then skipped). Screens funnel their
   * existing save logic through here -- no duplicate save code.
   */
  save: () => Observable<number | null>;
  /** Opens/renders the print view for the confirmed document id. */
  print: (documentId: number) => void;
  /** Always called when the workflow settles (printed, or save failed) -- lets screens clear busy state. */
  onSettled?: () => void;
}

/**
 * Unified Save / Print workflow shared by every document screen.
 *
 * Rules implemented here once (never duplicated per screen):
 * - Existing document with NO unsaved modifications:
 *     Print -> prints the currently persisted document directly (no Save call).
 * - Existing document WITH unsaved modifications:
 *     Save -> wait for server response -> use the confirmed id/data -> Print.
 * - New (not yet persisted) document:
 *     Save & Print -> create -> receive the server-confirmed id -> print it.
 * Never prints stale server data: a modified document is always saved first.
 */
@Injectable({ providedIn: 'root' })
export class DocumentPrintService {
  constructor(
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  printDocument(workflow: DocumentPrintWorkflow): void {
    // Clean, already-persisted document -> print what's on the server right now.
    if (workflow.isPersisted && !workflow.isDirty && workflow.currentId) {
      workflow.print(workflow.currentId);
      workflow.onSettled?.();
      return;
    }

    // New or modified document -> save first, print only on confirmed success.
    workflow.save().subscribe(confirmedId => {
      if (confirmedId) {
        workflow.print(confirmedId);
      } else {
        // save() already surfaced the specific validation/save error.
        this.notificationService.showError(
          this.translate.instant('DOCUMENT_COMMON.PRINT.SAVE_FAILED')
        );
      }
      workflow.onSettled?.();
    });
  }

  /** Opens the printable document view in a new tab (existing app-wide pattern). */
  openPrintRoute(printRoute: string): void {
    window.open(printRoute, '_blank');
  }
}
