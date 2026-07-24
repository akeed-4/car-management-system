import { Injectable } from '@angular/core';

/** Minimal shape of the global `window.CardSDK` object that Tap's Card Web SDK v2 attaches once
 *  its script has loaded (https://developers.tap.company/docs/card-sdk-web-v2). No official
 *  @types package exists for it, so this is typed just enough for what this app calls. */
interface TapCardSdk {
  renderTapCard(containerId: string, config: TapCardConfig): { unmount: () => void };
  tokenize(): void;
}

interface TapCardConfig {
  publicKey: string;
  merchant: { id: string };
  transaction: { amount: number; currency: string };
  customer: {
    id: string;
    name: Array<{ lang: 'en' | 'ar'; first: string; last: string }>;
    contact: { email: string };
  };
  acceptance: { supportedBrands: string[]; supportedCards: 'ALL' };
  interface: { locale: 'en' | 'ar'; theme: 'light' | 'dark' };
  onSuccess: (token: { id: string }) => void;
  onError: (error: unknown) => void;
}

declare global {
  interface Window {
    CardSDK?: TapCardSdk;
  }
}

export interface TapCardInitOptions {
  containerId: string;
  publicKey: string;
  merchantId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  locale: 'en' | 'ar';
}

const TAP_SDK_SRC = 'https://tap-sdks.b-cdn.net/card/1.0.2/index.js';

/** Wraps Tap's Card Web SDK so card details are tokenized entirely in the browser -- this app's
 *  backend (and thus this repo) only ever sees the resulting `tok_...` token, never the PAN/CVV.
 *  That keeps subscription checkout out of full PCI-DSS scope (SAQ A instead of SAQ D). */
@Injectable({ providedIn: 'root' })
export class TapPaymentService {
  private scriptPromise: Promise<void> | null = null;

  private loadScript(): Promise<void> {
    if (window.CardSDK) {
      return Promise.resolve();
    }
    if (!this.scriptPromise) {
      this.scriptPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = TAP_SDK_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Tap Card SDK'));
        document.head.appendChild(script);
      });
    }
    return this.scriptPromise;
  }

  /** Mounts the hosted card form into `#{containerId}` and resolves once the user submits a
   *  valid card and Tap successfully tokenizes it. Call `tokenize()` on the returned handle from
   *  a "Pay" button click; the promise this method returns settles on the SDK's onSuccess/onError. */
  async mount(options: TapCardInitOptions): Promise<{
    tokenize: () => void;
    unmount: () => void;
    result: Promise<{ id: string }>;
  }> {
    await this.loadScript();
    if (!window.CardSDK) {
      throw new Error('Tap Card SDK failed to initialize');
    }

    let resolveResult!: (token: { id: string }) => void;
    let rejectResult!: (error: unknown) => void;
    const result = new Promise<{ id: string }>((resolve, reject) => {
      resolveResult = resolve;
      rejectResult = reject;
    });

    const [first, ...rest] = options.customerName.trim().split(/\s+/);
    const { unmount } = window.CardSDK.renderTapCard(options.containerId, {
      publicKey: options.publicKey,
      merchant: { id: options.merchantId },
      transaction: { amount: options.amount, currency: options.currency },
      customer: {
        id: options.customerEmail,
        name: [{ lang: options.locale, first: first || options.customerName, last: rest.join(' ') || '-' }],
        contact: { email: options.customerEmail },
      },
      acceptance: { supportedBrands: ['VISA', 'MASTERCARD'], supportedCards: 'ALL' },
      interface: { locale: options.locale, theme: 'light' },
      onSuccess: (token) => resolveResult(token),
      onError: (error) => rejectResult(error),
    });

    return {
      tokenize: () => window.CardSDK!.tokenize(),
      unmount,
      result,
    };
  }
}
