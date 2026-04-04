import { Component, OnInit } from '@angular/core';
import { NoteService } from '../note-service';
import { Note } from '../interface/note-interface';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list-component.html'
})
export class NoteListComponent implements OnInit {
  notes: Note[] = [];
  isGridView: boolean = true; // State for Requirement #5

  constructor(private noteService: NoteService) {}

 

  toggleView() {
    this.isGridView = !this.isGridView;
  }
  ngOnInit(): void {
    this.noteService.selectedFolderId$.subscribe(filter => {
     this.notes = this.noteService.getNotes();
    const allNotes = this.noteService.getAllRawNotes(); // Get everything from storage

    if (filter === 'all') {
      this.notes = allNotes.filter(n => !n.deletedAt);
    } else if (filter === 'trash') {
      this.notes = allNotes.filter(n => !!n.deletedAt);
    } else {
      this.notes = allNotes.filter(n => n.folderId === filter && !n.deletedAt);
    }
  });

  // combineLatest listens to BOTH folder changes and search changes
  combineLatest([
    this.noteService.selectedFolderId$,
    this.noteService.searchTerm$
  ]).subscribe(([folderId, term]) => {
    let filtered = this.noteService.getAllRawNotes();

    // 1. Filter by Folder/Trash
    if (folderId === 'all') {
      filtered = filtered.filter(n => !n.deletedAt);
    } else if (folderId === 'trash') {
      filtered = filtered.filter(n => !!n.deletedAt);
    } else {
      filtered = filtered.filter(n => n.folderId === folderId && !n.deletedAt);
    }

    // 2. Filter by Search Term (Requirement #4)
    if (term.trim()) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(lowerTerm) || 
        n.content.toLowerCase().includes(lowerTerm)
      );
    }

    this.notes = filtered;
  });
}
}


