export interface Attachment {
  id: number;
  documentType: string;
  documentId: number;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedBy: number;
  uploadedAt: string;
}
