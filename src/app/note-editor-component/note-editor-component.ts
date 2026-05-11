import {
  Component, OnInit, AfterViewInit, AfterViewChecked,
  ElementRef, ViewChild, NgZone, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../note-service';
import { Note } from '../interface/note-interface';
import { FormsModule } from '@angular/forms';
import { TimeAgoPipe } from '../time-ago-pipe-pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './note-editor-component.html',
  styleUrls: ['./note-editor-component.css']
})
export class NoteEditorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  note?: Note;
  private routeSub?: Subscription;

  showTextColorPicker  = false;
  showHighlightPicker  = false;
  showPageColorPicker  = false;

  pageColors: string[] = [
    '#ffffff', '#ff7b7b', '#ffe482', '#73f37e',
    '#79c7ff', '#e379f4', '#f3739e', '#7ebeff', '#ffde72'
  ];
  textColors: string[] = [
    '#37352f','#e03e3e','#d9730d','#dfab01',
    '#0f7b6c','#0b6e99','#6940a5','#ad1a72','#9b9a97',
  ];
  highlightColors: string[] = [
    'remove','#ffdede','#fde8c8','#fef9c3',
    '#d4edda','#d0e8f1','#e8d8f5','#fddde6','#e0e0e0',
  ];

  @ViewChild('editorDiv') editorDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('titleDiv')  titleDiv!:  ElementRef<HTMLDivElement>;

  // Track which note ID the DOM was last initialized for
  private initializedForId: string | null = null;
  private savedRange: Range | null = null;

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.note = this.noteService.getNoteById(id);
        if (!this.note) { this.router.navigate(['/notes']); return; }
        // Reset so AfterViewChecked re-initializes the DOM for the new note
        this.initializedForId = null;
      }
    });
  }

  ngOnDestroy(): void { this.routeSub?.unsubscribe(); }

  ngAfterViewInit(): void  { this.initDom(); }
  ngAfterViewChecked(): void { this.initDom(); }

  /** Set the DOM content ONCE per note ID — never on every digest */
  private initDom(): void {
    if (!this.note || this.initializedForId === this.note.id) return;
    if (!this.editorDiv?.nativeElement) return;

    this.editorDiv.nativeElement.innerHTML = this.note.content || '';

    if (this.titleDiv?.nativeElement) {
      this.titleDiv.nativeElement.innerHTML = this.note.title || '';
    }

    this.initializedForId = this.note.id;
  }

  // ── SELECTION ──
  onSelectionChange(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (this.editorDiv?.nativeElement.contains(range.commonAncestorContainer)) {
        this.savedRange = range.cloneRange();
      }
    }
  }

  private restoreSelection(): void {
    this.editorDiv.nativeElement.focus();
    if (this.savedRange) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(this.savedRange); }
    }
  }

  // ── FORMAT COMMANDS ──
  execCommand(command: string, value?: string): void {
    this.restoreSelection();
    document.execCommand(command, false, value);
    this.saveContent();
    this.closeAllPickers();
  }

  applyTextColor(color: string): void {
    this.restoreSelection();
    document.execCommand('foreColor', false, color);
    this.saveContent();
    this.showTextColorPicker = false;
  }

  applyHighlight(color: string): void {
    this.restoreSelection();
    document.execCommand('hiliteColor', false, color === 'remove' ? 'transparent' : color);
    this.saveContent();
    this.showHighlightPicker = false;
  }

  onContentChange(event: Event): void {
    if (this.note) {
      this.note.content = (event.target as HTMLElement).innerHTML;
      this.noteService.updateNote(this.note);
    }
  }

  onTitleChange(event: Event): void {
    if (this.note) {
      this.note.title = (event.target as HTMLElement).innerText;
      this.noteService.updateNote(this.note);
    }
  }

  private saveContent(): void {
    if (this.note && this.editorDiv?.nativeElement) {
      this.note.content = this.editorDiv.nativeElement.innerHTML;
      this.noteService.updateNote(this.note);
    }
  }

  // ── NOTE ACTIONS ──
  togglePin():   void { if (this.note) { this.note.isPinned = !this.note.isPinned; this.save(); } }
  changeColor(c: string): void { if (this.note) { this.note.color = c; this.save(); } this.showPageColorPicker = false; }
  moveToTrash(): void { if (this.note) { this.noteService.moveToTrash(this.note.id); this.router.navigate(['/notes']); } }
  goBack():      void { this.router.navigate(['/notes']); }
  save():        void { if (this.note) { this.note.updatedAt = Date.now(); this.noteService.updateNote(this.note); } }

  // ── PICKER TOGGLES ──
  toggleTextColorPicker(e: MouseEvent):  void { e.stopPropagation(); this.showTextColorPicker = !this.showTextColorPicker; this.showHighlightPicker = false; this.showPageColorPicker = false; }
  toggleHighlightPicker(e: MouseEvent):  void { e.stopPropagation(); this.showHighlightPicker  = !this.showHighlightPicker;  this.showTextColorPicker = false; this.showPageColorPicker = false; }
  togglePageColorPicker(e: MouseEvent):  void { e.stopPropagation(); this.showPageColorPicker  = !this.showPageColorPicker;  this.showTextColorPicker = false; this.showHighlightPicker = false;  }
  closeAllPickers(): void { this.showTextColorPicker = false; this.showHighlightPicker = false; this.showPageColorPicker = false; }
  stopProp(e: MouseEvent): void { e.stopPropagation(); }

  // ── PDF — browser print (no npm dependency needed) ──
  downloadAsPDF(): void {
    if (!this.note) return;

    const tmp = document.createElement('div');
    tmp.innerHTML = this.note.title || '';
    const title   = tmp.innerText?.trim() || 'Untitled Note';
    const content = this.note.content || '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 15px; color: #37352f;
      line-height: 1.8; background: #fff;
      padding: 60px 80px; max-width: 800px; margin: 0 auto;
    }
    h1.note-title {
      font-size: 36px; font-weight: 700;
      letter-spacing: -0.02em; margin-bottom: 8px;
    }
    .note-meta {
      font-size: 12px; color: #9b9a97;
      margin-bottom: 32px; padding-bottom: 16px;
      border-bottom: 1px solid #e9e9e7;
    }
    .note-body { word-break: break-word; }
    ul { padding-left: 24px; list-style: disc;    margin: 8px 0; }
    ol { padding-left: 24px; list-style: decimal; margin: 8px 0; }
    b, strong { font-weight: 600; }
    mark { background: rgba(255,220,0,0.45); padding: 0 2px; border-radius: 2px; }
    /* Preserve text colors from the editor */
    [style*="color"] { color: inherit; }
  </style>
</head>
<body>
  <h1 class="note-title">${title}</h1>
  <div class="note-meta">Last edited: ${new Date(this.note.updatedAt).toLocaleString()}</div>
  <div class="note-body">${content}</div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) win.onload = () => URL.revokeObjectURL(url);
  }
}
