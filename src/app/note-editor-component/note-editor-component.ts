import {
  Component, OnInit, AfterViewInit, AfterViewChecked,
  ElementRef, ViewChild, NgZone
} from '@angular/core';
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
export class NoteEditorComponent implements OnInit, AfterViewInit, AfterViewChecked {
  note?: Note;

  showTextColorPicker = false;
  showHighlightPicker = false;
  showPageColorPicker = false;

  pageColors: string[] = [
    '#ffffff', '#fdecec', '#fef3cd', '#e8f5e9',
    '#e3f2fd', '#f3e5f5', '#fce4ec', '#f0f4f8', '#fff8e1'
  ];

  textColors: string[] = [
    '#37352f', '#e03e3e', '#d9730d', '#dfab01',
    '#0f7b6c', '#0b6e99', '#6940a5', '#ad1a72', '#9b9a97',
  ];

  highlightColors: string[] = [
    'remove', '#ffdede', '#fde8c8', '#fef9c3',
    '#d4edda', '#d0e8f1', '#e8d8f5', '#fddde6', '#e0e0e0',
  ];

  @ViewChild('editorDiv') editorDiv!: ElementRef<HTMLDivElement>;

  private contentInitialized = false;
  // Stores the saved selection range so we can restore it before execCommand
  private savedRange: Range | null = null;

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.contentInitialized = false;
      if (id) {
        this.note = this.noteService.getNoteById(id);
        if (!this.note) this.router.navigate(['/notes']);
      }
    });
  }

  ngAfterViewInit(): void { this.initEditorContent(); }

  ngAfterViewChecked(): void {
    if (!this.contentInitialized && this.editorDiv?.nativeElement && this.note) {
      this.initEditorContent();
    }
  }

  private initEditorContent(): void {
    if (this.contentInitialized || !this.editorDiv?.nativeElement || !this.note) return;
    this.editorDiv.nativeElement.innerHTML = this.note.content || '';
    this.contentInitialized = true;
  }

  // ── SELECTION MANAGEMENT ──
  // Called on every mouseup/keyup in the editor to remember the caret/selection
  onSelectionChange(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Only save if selection is inside our editor
      if (this.editorDiv?.nativeElement.contains(range.commonAncestorContainer)) {
        this.savedRange = range.cloneRange();
      }
    }
  }

  // Restores the saved selection into the editor before running execCommand
  private restoreSelection(): void {
    this.editorDiv.nativeElement.focus();
    if (this.savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
      }
    }
  }

  // ── FORMATTING COMMANDS ──
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
    if (color === 'remove') {
      // Remove only background color, not all formatting
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      document.execCommand('hiliteColor', false, color);
    }
    this.saveContent();
    this.showHighlightPicker = false;
  }

  onContentChange(event: Event): void {
    const el = event.target as HTMLElement;
    if (this.note) {
      this.note.content = el.innerHTML;
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
  togglePin(): void {
    if (this.note) { this.note.isPinned = !this.note.isPinned; this.save(); }
  }

  changeColor(color: string): void {
    if (this.note) { this.note.color = color; this.save(); }
    this.showPageColorPicker = false;
  }

  moveToTrash(): void {
    if (this.note) {
      this.noteService.moveToTrash(this.note.id);
      this.router.navigate(['/notes']);
    }
  }

  goBack(): void { this.router.navigate(['/notes']); }

  save(): void {
    if (this.note) {
      this.note.updatedAt = Date.now();
      this.noteService.updateNote(this.note);
    }
  }

  // ── PICKER TOGGLES ──
  // Each toggle: stop propagation so the document click listener doesn't immediately close it
  toggleTextColorPicker(e: MouseEvent): void {
    e.stopPropagation();
    this.showTextColorPicker = !this.showTextColorPicker;
    this.showHighlightPicker = false;
    this.showPageColorPicker = false;
  }

  toggleHighlightPicker(e: MouseEvent): void {
    e.stopPropagation();
    this.showHighlightPicker = !this.showHighlightPicker;
    this.showTextColorPicker = false;
    this.showPageColorPicker = false;
  }

  togglePageColorPicker(e: MouseEvent): void {
    e.stopPropagation();
    this.showPageColorPicker = !this.showPageColorPicker;
    this.showTextColorPicker = false;
    this.showHighlightPicker = false;
  }

  closeAllPickers(): void {
    this.showTextColorPicker = false;
    this.showHighlightPicker = false;
    this.showPageColorPicker = false;
  }

  stopProp(e: MouseEvent): void { e.stopPropagation(); }

  // ── PDF DOWNLOAD ──
  downloadAsPdf(): void {
    if (!this.note) return;
    const title = this.note.title || 'Untitled';
    const content = this.note.content || '';
    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 15px; color: #37352f;
           line-height: 1.75; background: #fff; padding: 60px 80px; max-width: 800px; margin: 0 auto; }
    h1.note-title { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .note-meta { font-size: 12px; color: #9b9a97; margin-bottom: 32px; padding-bottom: 16px;
                 border-bottom: 1px solid #e9e9e7; }
    .note-body { word-break: break-word; }
    ul, ol { padding-left: 24px; margin: 8px 0; }
  </style>
</head>
<body>
  <h1 class="note-title">${title}</h1>
  <div class="note-meta">Last edited: ${new Date(this.note.updatedAt).toLocaleString()}</div>
  <div class="note-body">${content}</div>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;
    const blob = new Blob([printHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.onload = () => URL.revokeObjectURL(url);
  }
}
