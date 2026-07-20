export interface GlobalSettingDto {
  id?: number;
  key: string;
  value: string;
  description?: string | null;
}

/** Grouped shape the Global Settings page edits as a form; PlatformService flattens this to/from
 *  the GlobalSettingDto[] the backend stores as generic key/value rows. */
export interface GlobalSettingsFormValue {
  applicationName: string;
  logoUrl?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpUseSsl: boolean;
  storageProvider?: string | null;
  storageBasePath?: string | null;
  tapSecretKey?: string | null;
  tapPublishableKey?: string | null;
  defaultTrialDays: number;
  gracePeriodDays: number;
  allowTenantHeaderResolution: boolean;
}
