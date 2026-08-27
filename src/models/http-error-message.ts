import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

/** Surfaces the real business-validation reason from the backend (e.g. "Debit account with ID 42
 *  not found", "Purchase invoice INV-1 is CANCELLED and can no longer be edited") instead of a
 *  generic toast -- Create/Update endpoints across this app return BadRequest(response) or
 *  BadRequest(response.Message)/BadRequest(ex.Message) with that text in the body, which arrives
 *  here as HttpErrorResponse.error (either a plain string, or an ApiResponse<T>-shaped object with
 *  a `message` property). Falls back to a translated generic message for anything that isn't a
 *  real business error (network failure, 500, framework-level model-binding rejection) so a raw
 *  stack trace is never shown to the user. Same pattern as
 *  AddAccountComponent.extractErrorMessage, generalized so Sales/Purchase invoice saves (and any
 *  future caller) don't duplicate it. */
export function extractErrorMessage(error: unknown, translate: TranslateService, fallbackKey: string): string {
  if (error instanceof HttpErrorResponse && error.status === 400 && error.error) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    const message = (error.error as { message?: string; Message?: string; title?: string })?.message
      ?? (error.error as { Message?: string })?.Message
      ?? (error.error as { title?: string })?.title;
    if (message) return message;
  }
  return translate.instant(fallbackKey);
}
