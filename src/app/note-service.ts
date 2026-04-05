import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Note } from './interface/note-interface';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly STORAGE_KEY = 'notion_clone_notes';

  notesSubject = new BehaviorSubject<Note[]>([]);
  notes$ = this.notesSubject.asObservable();

  private selectedFolderId = new BehaviorSubject<string | 'all' | 'trash'>('all');
  selectedFolderId$ = this.selectedFolderId.asObservable();

  private searchTerm = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTerm.asObservable();

  constructor() { this.loadFromLocalStorage(); }

  getNoteById(id: string): Note | undefined {
    return this.notesSubject.getValue().find(n => n.id === id);
  }

  getNotes(): Note[] {
    return this.notesSubject.getValue().filter(note => !note.deletedAt);
  }

  getTrashNotes(): Note[] {
    return this.notesSubject.getValue().filter(note => !!note.deletedAt);
  }

  createNote(folderId: string | null = null): string {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      color: '#ffffff',
      updatedAt: Date.now(),
      isPinned: false,
      folderId: folderId === 'all' || folderId === 'trash' ? null : folderId
    };
    const updatedNotes = [...this.notesSubject.getValue(), newNote];
    this.updateAndSave(updatedNotes);
    return newNote.id;
  }

  updateNote(updatedNote: Note) {
    const notes = this.notesSubject.getValue();
    const index = notes.findIndex(n => n.id === updatedNote.id);
    if (index !== -1) {
      notes[index] = { ...updatedNote, updatedAt: Date.now() };
      this.updateAndSave(notes);
    }
  }

  moveToTrash(noteId: string) {
    const notes = this.notesSubject.getValue();
    const note = notes.find(n => n.id === noteId);
    if (note) { note.deletedAt = Date.now(); this.updateAndSave(notes); }
  }

  restoreNote(id: string) {
    const notes = this.notesSubject.getValue();
    const note = notes.find(n => n.id === id);
    if (note) { delete note.deletedAt; this.updateAndSave(notes); }
  }

  permanentDelete(id: string) {
    const updatedNotes = this.notesSubject.getValue().filter(n => n.id !== id);
    this.updateAndSave(updatedNotes);
  }

  setFilter(filter: string | 'all' | 'trash') { this.selectedFolderId.next(filter); }
  setSearchTerm(term: string) { this.searchTerm.next(term); }

  private updateAndSave(notes: Note[]) {
    this.notesSubject.next(notes);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.notesSubject.next(saved ? JSON.parse(saved) : []);
  }

  autoPurgeTrash() {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const filtered = this.notesSubject.getValue().filter(n =>
      n.deletedAt ? (now - n.deletedAt) < THIRTY_DAYS : true
    );
    this.updateAndSave(filtered);
  }
}
