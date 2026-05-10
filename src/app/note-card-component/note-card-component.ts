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
  getPlainText(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText?.trim() || '';
}

getHeaderGradient(color: string): string {
  const colorMap: { [key: string]: string } = {
    '#fdecec': 'linear-gradient(135deg, #fdecec 0%, #ffd6d6 100%)',
    '#fef3cd': 'linear-gradient(135deg, #fef3cd 0%, #fde68a 100%)',
    '#e8f5e9': 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    '#e3f2fd': 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    '#f3e5f5': 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    '#fce4ec': 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
    '#fff8e1': 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
    '#f0f4f8': 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
  };
  return colorMap[color] || 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)';
}
getPlainTitle(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText?.trim() || '';
}
}
