import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteService } from '../note-service';
import { Note } from '../interface/note-interface';
import { NoteCardComponent } from '../note-card-component/note-card-component';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, NoteCardComponent],
  templateUrl: './note-list-component.html',
  styleUrls: ['./note-list-component.css']
})
export class NoteListComponent implements OnInit {
  notes: Note[] = [];
  pinnedNotes: Note[] = [];
  unpinnedNotes: Note[] = [];
  isGridView = true;
  currentSearchTerm = '';
  pageTitle = 'All Notes';

  constructor(private noteService: NoteService, private router: Router) {}

  ngOnInit(): void {
    combineLatest([
      this.noteService.notes$,
      this.noteService.selectedFolderId$,
      this.noteService.searchTerm$
    ]).subscribe(([allNotes, folderId, term]) => {
      this.currentSearchTerm = term;

      if (folderId === 'all') this.pageTitle = 'All Notes';
      else {
        // pageTitle will be set by folder name lookup if needed
        this.pageTitle = 'Notes';
      }

      let filtered = allNotes;
      if (folderId === 'trash') {
        filtered = filtered.filter(n => !!n.deletedAt);
      } else if (folderId === 'all') {
        filtered = filtered.filter(n => !n.deletedAt);
      } else {
        filtered = filtered.filter(n => n.folderId === folderId && !n.deletedAt);
      }

      if (term.trim()) {
        const lower = term.toLowerCase();
        filtered = filtered.filter(n =>
          n.title.toLowerCase().includes(lower) ||
          n.content.toLowerCase().includes(lower)
        );
      }

      filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      this.notes = filtered;
      this.pinnedNotes = filtered.filter(n => n.isPinned);
      this.unpinnedNotes = filtered.filter(n => !n.isPinned);
    });
  }

  toggleView() { this.isGridView = !this.isGridView; }

  createNewNote() {
    const newId = this.noteService.createNote();
    this.router.navigate(['/notes', newId]);
  }

  onSearch(event: Event) {
    const el = event.target as HTMLInputElement;
    this.noteService.setSearchTerm(el.value);
  }

  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.noteService.setSearchTerm('');
  }
}
