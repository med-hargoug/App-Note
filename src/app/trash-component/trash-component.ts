import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoteService } from '../note-service';
import { map } from 'rxjs/operators';
import { TimeAgoPipe } from '../time-ago-pipe-pipe';

@Component({
  selector: 'app-trash-component',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  templateUrl: './trash-component.html',
  styleUrl: './trash-component.css'
})
export class TrashComponent implements OnInit {
  private noteService = inject(NoteService);

  trashNotes$ = this.noteService.notes$.pipe(
    map(notes => notes.filter(n => !!n.deletedAt))
  );

  ngOnInit(): void {
    this.noteService.autoPurgeTrash();
  }

  onRestore(id: string) { this.noteService.restoreNote(id); }

  onPermanentDelete(id: string) {
    if (confirm('Permanently delete this note?')) {
      this.noteService.permanentDelete(id);
    }
  }

  onEmptyTrash() {
    if (confirm('Permanently delete all items in trash?')) {
      // Fix: use the subject directly to get trash notes
      const trashNotes = this.noteService.getTrashNotes();
      trashNotes
         .forEach(n => this.noteService.permanentDelete(n.id));
    }
  }
}
