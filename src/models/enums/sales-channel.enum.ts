/**
 * Sales Channel Enumeration
 * Defines the three primary sales distribution channels in the dealership system
 */
export enum SalesChannel {
  /** Individual/Retail Sales - Direct cash or financed sales to individual customers */
  Afrad = 1,
  
  /** Corporate/Fleet Sales - Bulk sales to companies and organizations */
  Sharikat = 2,
  
  /** Bank/Finance Sales - Sales facilitated through banking and financing institutions */
  Bunuk = 3
}

/**
 * Helper utility for SalesChannel enum
 */
export class SalesChannelHelper {
  static getLabel(channel: SalesChannel): string {
    const labels: Record<SalesChannel, string> = {
      [SalesChannel.Afrad]: 'SALES_LIFECYCLE.CHANNELS.AFRAD',
      [SalesChannel.Sharikat]: 'SALES_LIFECYCLE.CHANNELS.SHARIKAT',
      [SalesChannel.Bunuk]: 'SALES_LIFECYCLE.CHANNELS.BUNUK'
    };
    return labels[channel];
  }

  static getAll(): Array<{ value: SalesChannel; label: string }> {
    return [
      { value: SalesChannel.Afrad, label: this.getLabel(SalesChannel.Afrad) },
      { value: SalesChannel.Sharikat, label: this.getLabel(SalesChannel.Sharikat) },
      { value: SalesChannel.Bunuk, label: this.getLabel(SalesChannel.Bunuk) }
    ];
  }
}
