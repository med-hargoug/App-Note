import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Note } from './interface/note-interface';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private readonly STORAGE_KEY = 'notion_clone_notes';
  private notes: Note[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  // --- CRUD Operations ---

  getNotes(): Note[] {
    // Filter out notes that are in the trash (deletedAt exists)
    return this.notes.filter(note => !note.deletedAt);
  }

  addNote(note: Note) {
    this.notes.push(note);
    this.saveToLocalStorage();
  }

  updateNote(updatedNote: Note) {
    const index = this.notes.findIndex(n => n.id === updatedNote.id);
    if (index !== -1) {
      this.notes[index] = { ...updatedNote, updatedAt: Date.now() };
      this.saveToLocalStorage();
    }
  }

  moveToTrash(noteId: string) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.deletedAt = Date.now();
      this.saveToLocalStorage();
    }
  }
  // Inside NoteService...
 private selectedFolderId = new BehaviorSubject<string | 'all' | 'trash'>('all');
 selectedFolderId$ = this.selectedFolderId.asObservable();

 setFilter(filter: string | 'all' | 'trash') {
   this.selectedFolderId.next(filter);
 }

  // --- Persistence Logic ---

  private saveToLocalStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes));
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.notes = saved ? JSON.parse(saved) : [];
  }
  // Inside note.service.ts
  private searchTerm = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTerm.asObservable();

  setSearchTerm(term: string) {
    this.searchTerm.next(term);
 }

 createNote(folderId: string | null = null): string {
  const newNote: Note = {
    id: crypto.randomUUID(), // Modern way to get unique IDs
    title: 'Untitled Note',
    content: '',
    color: '#ffffff',
    updatedAt: Date.now(),
    isPinned: false,
    folderId: folderId === 'all' || folderId === 'trash' ? null : folderId
  };
  
  this.notes.push(newNote);
  this.saveToLocalStorage();
  return newNote.id; // Return ID so we can navigate to it
 }
 // Inside NoteService

restoreNote(id: string) {
  const note = this.notes.find(n => n.id === id);
  if (note) {
    delete note.deletedAt; // Remove the deleted timestamp
    this.saveToLocalStorage();
  }
}

permanentDelete(id: string) {
  this.notes = this.notes.filter(n => n.id !== id);
  this.saveToLocalStorage();
}

// Logic for Requirement #7: Auto-delete after 30 days
autoPurgeTrash() {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  this.notes = this.notes.filter(n => {
    if (n.deletedAt) {
      return (Date.now() - n.deletedAt) < thirtyDaysInMs;
    }
    return true;
  });
  this.saveToLocalStorage();
}
 cleanOldTrash() {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const now = Date.now();

  this.notes = this.notes.filter(note => {
    if (note.deletedAt) {
      // Keep only if it was deleted less than 30 days ago
      return (now - note.deletedAt) < THIRTY_DAYS;
    }
    return true; // Keep all non-deleted notes
  });
  
  this.saveToLocalStorage();
}

}


