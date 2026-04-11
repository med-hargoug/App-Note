import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../note-service';
import { Note } from '../interface/note-interface';
import { FormsModule } from '@angular/forms';
import { TimeAgoPipe } from '../time-ago-pipe-pipe';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './note-editor-component.html',
  styleUrls: ['./note-editor-component.css']
})
export class NoteEditorComponent implements OnInit, AfterViewInit {
  note?: Note;
  showTextColorPicker = false;
  showBgColorPicker = false;
  sidebarCollapsed = false;

  // Page background colors (note cover tint)
  pageColors: string[] = [
    '#ffffff', '#fdecec', '#fef3cd', '#e8f5e9',
    '#e3f2fd', '#f3e5f5', '#fce4ec', '#f0f4f8', '#fff8e1'
  ];

  // Text colors for the font color picker
  textColors: string[] = [
    '#37352f', // default black
    '#e03e3e', // red
    '#d9730d', // orange
    '#dfab01', // yellow
    '#0f7b6c', // green
    '#0b6e99', // blue
    '#6940a5', // purple
    '#ad1a72', // pink
    '#9b9a97', // gray
  ];

  // Text highlight colors
  highlightColors: string[] = [
    'transparent',
    '#ffdede', '#fde8c8', '#fef9c3',
    '#d4edda', '#d0e8f1', '#e8d8f5', '#fddde6',
    '#e0e0e0',
  ];

  @ViewChild('editorDiv') editorDiv!: ElementRef<HTMLDivElement>;

  private noteId: string | null = null;
  private contentInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.noteId = params.get('id');
      this.contentInitialized = false;
      if (this.noteId) {
        this.note = this.noteService.getNoteById(this.noteId);
        if (!this.note) this.router.navigate(['/notes']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initEditorContent();
  }

  // KEY FIX: Only set innerHTML once on load, never again on keystroke
  private initEditorContent(): void {
    if (this.contentInitialized || !this.editorDiv || !this.note) return;
    this.editorDiv.nativeElement.innerHTML = this.note.content || '';
    this.contentInitialized = true;
  }

  ngAfterViewChecked(): void {
    if (!this.contentInitialized && this.editorDiv && this.note) {
      this.initEditorContent();
    }
  }

  execCommand(command: string, value: string = '') {
    this.editorDiv.nativeElement.focus();
    document.execCommand(command, false, value || undefined);
    this.saveContent();
  }

  applyTextColor(color: string) {
    this.editorDiv.nativeElement.focus();
    document.execCommand('foreColor', false, color);
    this.saveContent();
    this.showTextColorPicker = false;
  }

  applyHighlight(color: string) {
    this.editorDiv.nativeElement.focus();
    if (color === 'transparent') {
      document.execCommand('removeFormat', false, undefined);
    } else {
      document.execCommand('hiliteColor', false, color);
    }
    this.saveContent();
    this.showBgColorPicker = false;
  }

  onContentChange(event: Event) {
    const el = event.target as HTMLElement;
    if (this.note) {
      this.note.content = el.innerHTML;
      this.noteService.updateNote(this.note);
    }
  }

  private saveContent() {
    if (this.note && this.editorDiv) {
      this.note.content = this.editorDiv.nativeElement.innerHTML;
      this.noteService.updateNote(this.note);
    }
  }

  togglePin() {
    if (this.note) { this.note.isPinned = !this.note.isPinned; this.save(); }
  }

  changeColor(color: string) {
    if (this.note) { this.note.color = color; this.save(); }
  }

  moveToTrash() {
    if (this.note) {
      this.noteService.moveToTrash(this.note.id);
      this.router.navigate(['/notes']);
    }
  }

  goBack() { this.router.navigate(['/notes']); }

  save() {
    if (this.note) {
      this.note.updatedAt = Date.now();
      this.noteService.updateNote(this.note);
    }
  }

  downloadAsPdf() {
    if (!this.note) return;
    const title = this.note.title || 'Untitled';
    const content = this.note.content || '';

    // Build a clean printable HTML page
    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 15px;
      color: #37352f;
      line-height: 1.75;
      background: #fff;
      padding: 60px 80px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1.note-title {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #37352f;
    }
    .note-meta {
      font-size: 12px;
      color: #9b9a97;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9e9e7;
    }
    .note-body { word-break: break-word; }
    ul, ol { padding-left: 24px; margin: 8px 0; }
    b, strong { font-weight: 600; }
  </style>
</head>
<body>
  <h1 class="note-title">${title}</h1>
  <div class="note-meta">Last edited: ${new Date(this.note.updatedAt).toLocaleString()}</div>
  <div class="note-body">${content}</div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`;

    const blob = new Blob([printHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => URL.revokeObjectURL(url);
    }
  }

  toggleTextColorPicker() {
    this.showTextColorPicker = !this.showTextColorPicker;
    this.showBgColorPicker = false;
  }

  toggleBgColorPicker() {
    this.showBgColorPicker = !this.showBgColorPicker;
    this.showTextColorPicker = false;
  }

  closeAllPickers() {
    this.showTextColorPicker = false;
    this.showBgColorPicker = false;
  }
}
