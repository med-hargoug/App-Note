import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Note } from '../interface/note-interface';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TimeAgoPipe } from '../time-ago-pipe-pipe';
import { HighlightPipePipe } from '../highlight-pipe-pipe';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './note-card-component.html',
  styleUrls: ['./note-card-component.css']
})
export class NoteCardComponent implements OnChanges {
  @Input() note!: Note;
  @Input() displayMode: 'grid' | 'list' = 'grid';
  @Input() searchTerm: string = '';

  safeTitle: SafeHtml = '';
  safePreview: SafeHtml = '';

  constructor(private router: Router, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] || changes['searchTerm']) {
      this.safeTitle   = this.buildSafeTitle();
      this.safePreview = this.buildSafePreview();
    }
  }

  private buildSafeTitle(): SafeHtml {
    const plain = this.getPlainText(this.note?.title) || 'Untitled';
    const pipe  = new HighlightPipePipe();
    return this.sanitizer.bypassSecurityTrustHtml(pipe.transform(plain, this.searchTerm));
  }

  private buildSafePreview(): SafeHtml {
    const plain     = this.getPlainText(this.note?.content) || 'No content yet...';
    const truncated = plain.length > 120 ? plain.slice(0, 120) + '…' : plain;
    const pipe      = new HighlightPipePipe();
    return this.sanitizer.bypassSecurityTrustHtml(pipe.transform(truncated, this.searchTerm));
  }

  getPlainText(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.innerText?.trim() || '';
  }

  onOpen(): void { this.router.navigate(['/notes', this.note.id]); }

  get cardColor(): string {
    return this.note.color && this.note.color !== '#ffffff' ? this.note.color : 'transparent';
  }

  getHeaderGradient(color: string): string {
    const m: Record<string, string> = {
      '#fdecec': 'linear-gradient(135deg,#fdecec,#ffd6d6)',
      '#fef3cd': 'linear-gradient(135deg,#fef3cd,#fde68a)',
      '#e8f5e9': 'linear-gradient(135deg,#e8f5e9,#c8e6c9)',
      '#e3f2fd': 'linear-gradient(135deg,#e3f2fd,#bbdefb)',
      '#f3e5f5': 'linear-gradient(135deg,#f3e5f5,#e1bee7)',
      '#fce4ec': 'linear-gradient(135deg,#fce4ec,#f8bbd0)',
      '#fff8e1': 'linear-gradient(135deg,#fff8e1,#ffecb3)',
      '#f0f4f8': 'linear-gradient(135deg,#f0f4f8,#e2e8f0)',
      '#ff7b7b': 'linear-gradient(135deg,#ff7b7b,#ff5252)',
      '#ffe482': 'linear-gradient(135deg,#ffe482,#ffd740)',
      '#73f37e': 'linear-gradient(135deg,#73f37e,#43a047)',
      '#79c7ff': 'linear-gradient(135deg,#79c7ff,#1e88e5)',
      '#e379f4': 'linear-gradient(135deg,#e379f4,#ab47bc)',
      '#f3739e': 'linear-gradient(135deg,#f3739e,#e91e63)',
      '#7ebeff': 'linear-gradient(135deg,#7ebeff,#42a5f5)',
      '#ffde72': 'linear-gradient(135deg,#ffde72,#ffca28)',
    };
    return m[color] || 'linear-gradient(135deg,#f0f4f8,#e2e8f0)';
  }
}
