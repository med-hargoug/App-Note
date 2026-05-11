import {
  Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy,
  ElementRef, ViewChild, NgZone
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
  @ViewChild('titleDiv')  titleDiv!:  ElementRef<HTMLDivElement>;
  @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;

  private initializedForId: string | null = null;
  private savedRange: Range | null = null;
  private activeEditable: HTMLElement | null = null;

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
      this.initializedForId = null;
    }
  });

  // ← ADD THIS: save selection on every change
  document.addEventListener('selectionchange', this.onSelectionChange.bind(this));
}

  ngOnDestroy(): void {
  this.routeSub?.unsubscribe();
  document.removeEventListener('selectionchange', this.onSelectionChange.bind(this));
}
  ngAfterViewInit(): void { this.initDom(); }
  ngAfterViewChecked(): void { this.initDom(); }

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
      this.activeEditable = this.editorDiv.nativeElement;
    } else if (this.titleDiv?.nativeElement.contains(range.commonAncestorContainer)) {
      this.savedRange = range.cloneRange();
      this.activeEditable = this.titleDiv.nativeElement;
    }
  }
}

private restoreSelection(): void {
  if (this.activeEditable) {
    this.activeEditable.focus();
  } else {
    this.editorDiv.nativeElement.focus();
  }
  if (this.savedRange) {
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(this.savedRange);
    }
  }
}
  // ── FORMAT COMMANDS ──
  execCommand(command: string, value?: string): void {
  // Small delay lets the browser process mousedown before we restore selection
  setTimeout(() => {
    this.restoreSelection();
    document.execCommand(command, false, value);
    this.saveContent();
    this.closeAllPickers();
  }, 0);
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
    const el = event.target as HTMLElement;
    if (this.note) {
      this.note.title = el.innerHTML;
      this.noteService.updateNote(this.note);
    }
  }
  applyUnderline(): void {
  this.restoreSelection();
  document.execCommand('underline', false);
  this.saveContent();
}

applyStrike(): void {
  this.restoreSelection();
  document.execCommand('strikeThrough', false);
  this.saveContent();
}

 private saveContent(): void {
  if (this.note && this.editorDiv?.nativeElement) {
    this.note.content = this.editorDiv.nativeElement.innerHTML;
    if (this.titleDiv?.nativeElement) {
      this.note.title = this.titleDiv.nativeElement.innerHTML;
    }
    this.noteService.updateNote(this.note);
  }
}

  // ── NOTE ACTIONS ──
  togglePin(): void { if (this.note) { this.note.isPinned = !this.note.isPinned; this.save(); } }
  changeColor(c: string): void { if (this.note) { this.note.color = c; this.save(); } this.showPageColorPicker = false; }
  moveToTrash(): void { if (this.note) { this.noteService.moveToTrash(this.note.id); this.router.navigate(['/notes']); } }
  goBack(): void { this.router.navigate(['/notes']); }
  save(): void { if (this.note) { this.note.updatedAt = Date.now(); this.noteService.updateNote(this.note); } }

  // ── COVER IMAGE ──
  hasCover(): boolean {
    return !!(this.note?.coverImage && this.note.coverImage.length > 0);
  }

  triggerCoverUpload(): void {
    this.coverInput.nativeElement.click();
  }

  onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.note) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (this.note) {
        this.note.coverImage = result;
        this.noteService.updateNote(this.note);
      }
    };
    reader.readAsDataURL(file);
    this.coverInput.nativeElement.value = '';
  }

  removeCover(): void {
    if (this.note) {
      this.note.coverImage = '';
      this.noteService.updateNote(this.note);
    }
  }

  // ── PICKER TOGGLES ──
  toggleTextColorPicker(e: MouseEvent): void { e.stopPropagation(); this.showTextColorPicker = !this.showTextColorPicker; this.showHighlightPicker = false; this.showPageColorPicker = false; }
  toggleHighlightPicker(e: MouseEvent): void { e.stopPropagation(); this.showHighlightPicker = !this.showHighlightPicker; this.showTextColorPicker = false; this.showPageColorPicker = false; }
  togglePageColorPicker(e: MouseEvent): void { e.stopPropagation(); this.showPageColorPicker = !this.showPageColorPicker; this.showTextColorPicker = false; this.showHighlightPicker = false; }
  closeAllPickers(): void { this.showTextColorPicker = false; this.showHighlightPicker = false; this.showPageColorPicker = false; }
  stopProp(e: MouseEvent): void { e.stopPropagation(); }

  // ── PDF ──
  downloadAsPDF(): void {
  if (!this.note) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = this.note.title || '';
  const plainTitle = tmp.innerText?.trim() || 'Untitled Note';
  const richTitle = this.note.title || plainTitle;
  const content = this.note.content || '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${plainTitle}</title>
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
      line-height: 1.2;
    }
    .note-meta { font-size: 12px; color: #9b9a97; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e9e9e7; }
    .note-body { word-break: break-word; }
    ul { padding-left: 24px; list-style: disc; margin: 8px 0; }
    ol { padding-left: 24px; list-style: decimal; margin: 8px 0; }
    b, strong { font-weight: 600; }
  </style>
</head>
<body>
  <h1 class="note-title">${richTitle}</h1>
  <div class="note-meta">Last edited: ${new Date(this.note.updatedAt).toLocaleString()}</div>
  <div class="note-body">${content}</div>
  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.onload = () => URL.revokeObjectURL(url);
}
}
