export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: number;
  isPinned: boolean;
  folderId: string | null;
  deletedAt?: number;
  coverImage?: string;  // ← ADD THIS LINE
}
