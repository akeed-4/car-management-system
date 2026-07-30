/**
 * Notification feed models. These mirror the backend DTOs in
 * CarERP.Core/DTOs/System/NotificationDto.cs.
 *
 * Enums arrive as strings ("Approval", not 0) because the API and the SignalR hub both serialize
 * with JsonStringEnumConverter — see Program.cs / AddCarErpNotifications.
 */

/** Category of a notification. Drives the icon and accent colour in the bell. */
export type NotificationType =
  | 'Approval'
  | 'Approved'
  | 'Rejected'
  | 'Returned'
  | 'Cancelled'
  | 'Mention'
  | 'Assignment'
  | 'Reminder'
  | 'System'
  | 'Inventory'
  | 'Accounting'
  | 'Sales'
  | 'Purchase'
  | 'POS'
  | 'Assets';

/** Relative urgency; maps to a priority colour. */
export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

/** Lifecycle state. The bell shows only `Active` rows. */
export type NotificationStatus = 'Active' | 'Archived' | 'Dismissed';

/** A single notification addressed to the signed-in user. */
export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  userId: number;
  companyId?: number | null;
  branchId?: number | null;
  /** Primary key of the referenced business document. */
  referenceId?: number | null;
  /** Document type discriminator, e.g. "PurchaseInvoice". */
  referenceType?: string | null;
  /** Human-readable document number, e.g. "PI-000152". */
  documentNo?: string | null;
  /** Angular route to open when the row is clicked. */
  url?: string | null;
  isRead: boolean;
  createdBy?: number | null;
  createdByName?: string | null;
  createdDate: string;
  readDate?: string | null;
  image?: string | null;
  /** Material icon name. */
  icon?: string | null;
  action?: string | null;
  jsonData?: string | null;
}

/** One page of the feed plus the counters the bell renders. */
export interface NotificationList {
  items: AppNotification[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

/**
 * The `ReceiveNotification` SignalR payload: the new notification plus the recipient's resulting
 * unread count, so the badge updates without a follow-up request.
 */
export interface NotificationPushPayload {
  notification: AppNotification;
  unreadCount: number;
  timestamp: string;
}

/** Standard API envelope used across this backend. */
export interface NotificationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
