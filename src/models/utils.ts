import { Observable } from "rxjs";
import { SimpleChanges } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import * as _ from 'lodash';

// Type declaration for numeral
declare const numeral: any;

export function toBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  })
}

// Store the translate service instance globally
let translateServiceInstance: TranslateService | null = null;

/**
 * Initialize the translate service for error localization
 * This should be called once in app initialization (e.g., AppComponent constructor)
 * @param translateService the TranslateService instance
 */
export function initializeTranslateService(translateService: TranslateService): void {
  translateServiceInstance = translateService;
}

/**
 * parse web api errors that return from server with automatic localization
 * @param response the response from server
 * @param translateService optional TranslateService instance (uses global instance if not provided)
 * @returns an array of errors (localized if translateService available)
 */
export function parseWebAPIErrors(response: any, translateService?: TranslateService): string[] {
  const result: string[] = [];
  const translate = translateService || translateServiceInstance;

  if (response.error) {
    // Handle string error
    if (typeof response.error === 'string') {
      const errorMessage = response.error;
      if (translate) {
        const translationKey = `errors.${normalizeErrorKey(errorMessage)}`;
        const translated = translate.instant(translationKey);
        result.push(translated !== translationKey ? translated : errorMessage);
      } else {
        result.push(errorMessage);
      }
    } 
    // Handle validation errors object format
    else if (response.error.errors) {
      const mapErrors = response.error.errors;
      const entries = Object.entries(mapErrors);
      entries.forEach((arr: any[]) => {
        const rawField = arr[0];
        // Clean up field name: remove $. prefix and get last part after dot
        const cleanField = rawField.replace(/^\$\./, '').split('.').pop() || rawField;
        
        arr[1].forEach((errorMessage: any) => {
          if (translate) {
            // Try to get field label translation from multiple sources
            let fieldLabel = cleanField;
            const possibleKeys = [
              `supplier.${cleanField}`,
              `client.${cleanField}`, 
              `seller.${cleanField}`,
              `general.${cleanField}`,
              `document.${cleanField}`
            ];
            
            for (const key of possibleKeys) {
              const translated = translate.instant(key);
              if (translated !== key) {
                fieldLabel = translated;
                break;
              }
            }
            
            // Build simple error message with field name
            let errorText = '';
            
            // Check for "required" pattern
            if (errorMessage.toLowerCase().includes('required')) {
              errorText = `${fieldLabel}: ${translate.instant('errors.required')}`;
            }
            // Check for "converted" or "int32" pattern (type conversion errors)
            else if (errorMessage.toLowerCase().includes('converted') || errorMessage.toLowerCase().includes('int32') || errorMessage.toLowerCase().includes('invalid')) {
              errorText = `${fieldLabel}: ${translate.instant('errors.invalidValue')}`;
            }
            // Fallback to field name with original error
            else {
              errorText = `${fieldLabel}: ${errorMessage}`;
            }
            
            result.push(errorText);
          } else {
            result.push(`${cleanField}: ${errorMessage}`);
          }
        })
      })
    }
    // Handle problem details format (title/detail)
    else if (response.error.title || response.error.detail) {
      const errorMessage = response.error.detail || response.error.title;
      if (translate) {
        const translationKey = `errors.${normalizeErrorKey(errorMessage)}`;
        const translated = translate.instant(translationKey);
        result.push(translated !== translationKey ? translated : errorMessage);
      } else {
        result.push(errorMessage);
      }
    }
  }

  // Handle network errors and other common HTTP errors
  if (result.length === 0) {
    let errorKey = 'unexpectedError';
    if (response.status === 0) {
      errorKey = 'networkError';
    } else if (response.status >= 500) {
      errorKey = 'serverError';
    } else if (response.status === 401) {
      errorKey = 'unauthorized';
    } else if (response.status === 403) {
      errorKey = 'forbidden';
    } else if (response.status === 404) {
      errorKey = 'notFound';
    } else if (response.status === 400) {
      errorKey = 'badRequest';
    } else if (response.statusText === 'Unknown Error' || response.name === 'TimeoutError') {
      errorKey = 'timeout';
    }
    
    if (translate) {
      const translated = translate.instant(`errors.${errorKey}`);
      result.push(translated !== `errors.${errorKey}` ? translated : response.message || 'An error occurred');
    } else {
      result.push(response.message || 'An error occurred');
    }
  }

  return result;
}

/**
 * Normalize error message to a translation key format
 * @param error the error message
 * @returns normalized key
 */
function normalizeErrorKey(error: string): string {
  if (!error) return 'unexpectedError';
  // Convert error message to camelCase key
  // e.g., "User not found" -> "userNotFound"
  return error
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Interface for localized error with translation key
 */
export interface LocalizedError {
  key: string;
  params?: any;
  fallback: string;
}

/**
 * Parse web api errors and return localized error objects
 * @param response the response from server
 * @param errorKeyPrefix optional prefix for translation keys (e.g., 'errors.api')
 * @returns an array of localized error objects
 * @deprecated Use parseWebAPIErrors with translateService parameter instead
 */
export function parseWebAPIErrorsLocalized(response: any, errorKeyPrefix: string = 'errors'): LocalizedError[] {
  const result: LocalizedError[] = [];

  if (response.error) {
    if (typeof response.error === 'string') {
      // Try to map common error messages to translation keys
      result.push({
        key: `${errorKeyPrefix}.${normalizeErrorKey(response.error)}`,
        fallback: response.error
      });
    } else if (response.error.errors) {
      const mapErrors = response.error.errors;
      const entries = Object.entries(mapErrors);
      entries.forEach((arr: any[]) => {
        const field = arr[0];
        arr[1].forEach((errorMessage: any) => {
          result.push({
            key: `${errorKeyPrefix}.${normalizeErrorKey(errorMessage)}`,
            params: { field },
            fallback: `${field}: ${errorMessage}`
          });
        })
      })
    } else if (response.error.title || response.error.detail) {
      // Handle problem details format
      const message = response.error.detail || response.error.title;
      result.push({
        key: `${errorKeyPrefix}.${normalizeErrorKey(message)}`,
        fallback: message
      });
    }
  }

  // Fallback for unexpected error format
  if (result.length === 0) {
    result.push({
      key: `${errorKeyPrefix}.unexpectedError`,
      fallback: 'An unexpected error occurred'
    });
  }

  return result;
}

export function formatDateFormData(date: Date) {
  date = new Date(date);
  const format = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const [
    { value: month }, ,
    { value: day }, ,
    { value: year }
  ] = format.formatToParts(date);

  // yyyy-MM-dd
  return `${year}-${month}-${day}`;
}

export function fillArrayWithinRange(start: number, end: number): Observable<number[]> {
  const numbers: number[] = [];

  return Observable.create((observer: { next: (arg0: number[]) => void; complete: () => void; }) => {
    for (let i = start; i <= end; i++) {
      numbers.push(i);
      observer.next(numbers);
    }

    observer.complete();
  });
}


// export function roundNumber(num:number, dec:number): number {
//  return Math.round(parseFloat(num.toFixed(dec)) * Math.pow(10, dec)) / Math.pow(10, dec)
// }

/**
 * rounds a number to the nearest decimal
 * @param num the number to round
 * @param dec the decimal count
 * @returns the rounded number
 */
export function roundNumber(num: number, dec: number): number {
  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}

/**
 * format number with seperated comma
 * @param number the number to format
 * @param decimalCount the decimal count of the number
 * @returns the formatted number
 */
export function formatNumber(number: number, decimalCount: number = 2) {
  var format = decimalCount == 3 ? '0,0.000' : decimalCount == 4 ? '0,0.0000' : '0,0.00';
  return numeral(number).format(format);
}

/**
 * group an array of objects by a property
 * @param items the array of objects
 * @param groupBy the property to group by
 * @returns the grouped array
 */
export function groupBy(items: any, groupBy: any) {
  return _.groupBy(items, groupBy);
}

/**
 * sum an array of objects by a property
 * @param items the array of objects
 * @param sumBy the property to sum
 * @returns the result of the sum
 */
export function sumBy(items: any, sumBy: any) {
  return _.sumBy(items, sumBy);
}

/**
 * group an array of objects by a property and sum the values of another property.
 * @param data the array of objects to group
 * @param groupBy the property to group by
 * @param sumBy the property to sum
 * @returns the grouped array
 */



/**
 * Sorts an array of objects by multiple properties.
 * @param array - The array of objects to sort.
 * @param properties - The properties to sort by.
 * @param orders - The sort orders for each property ('asc' for ascending, 'desc' for descending).
 * @returns The sorted array.
 */
export function orderBy<T>(array: T[], properties: Array<keyof T>, orders?: Array<'asc' | 'desc'>): T[] {
  return _.orderBy(array, properties, orders);
}

export function hasDecimal(num: number): boolean {
  return num !== Math.trunc(num);
}

export function getDecimalPart(value: number): number {
  return value - Math.trunc(value);
}

export function normalizeArabic(text?: string): string {
  if (typeof text !== 'string') return text ?? "";
  return text.replace(/[أآإ]/g, 'ا');
}

export function isActualChange(changes: SimpleChanges, key: string): boolean {
  const change = changes[key];
  if (!change) return false;
  return (
    !_.isEqual(change.previousValue, change.currentValue) &&
    change.currentValue !== undefined
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// client-time-info.ts
export function getClientTimeInfo(date?: Date) {
  const d = date ?? new Date();
  // signed offset in minutes: e.g. +120 for UTC+02
  const signedOffsetMinutes = -d.getTimezoneOffset();

  // IANA tz name (may be undefined in very old browsers)
  const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || null;

  // best to send an ISO in UTC and/or ISO with offset:
  // toISOString() returns UTC "Z". If you want local ISO with offset, use a small helper:
  function isoWithOffset(date: Date) {
    const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
    const year = date.getFullYear();
    const mo = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);
    return `${year}-${mo}-${day}T${hh}:${mm}:${ss}${sign}${offsetHours}:${offsetMinutes}`;
  }

  return {
    // UTC instant (always safe)
    isoUtc: d.toISOString(),          // e.g. "2025-08-25T09:34:00.000Z"
    // optional: local ISO including offset
    isoLocalWithOffset: isoWithOffset(d), // e.g. "2025-08-25T11:34:00+02:00"
    timezone: tz,                     // e.g. "Europe/Cairo"
    offsetMinutes: signedOffsetMinutes // e.g. 120
  };
}

