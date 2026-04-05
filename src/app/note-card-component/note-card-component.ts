import { Component, Input } from '@angular/core';
import { Note } from '../interface/note-interface';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../time-ago-pipe-pipe';
import { TruncatePipe } from '../truncate-pipe-pipe';
import { HighlightPipePipe } from '../highlight-pipe-pipe';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, TruncatePipe, HighlightPipePipe],
  templateUrl: './note-card-component.html',
  styleUrls: ['./note-card-component.css']
})
export class NoteCardComponent {
  @Input() note!: Note;
  @Input() displayMode: 'grid' | 'list' = 'grid';
  @Input() searchTerm: string = '';

  constructor(private router: Router) {}

  onOpen() {
    this.router.navigate(['/notes', this.note.id]);
  }

  get cardColor(): string {
    return this.note.color && this.note.color !== '#ffffff' ? this.note.color : 'transparent';
  }
}
