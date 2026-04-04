export interface Note {
  id: string;
  title: string;
  content: string;       // For the rich editor HTML content
  color: string;         // Feature 6: Marquage couleurs
  updatedAt: number;     // Feature 1: date de modification (using timestamp)
  isPinned: boolean;     // Feature 1: épinglée ou non
  folderId: string | null; // Feature 2: Link the note to a specific folder
  deletedAt?: number;    // Feature 7: Corbeille. Track when it was deleted for the 30-day limit.
}