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
import { jsPDF } from 'jspdf';


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
    '#ffffff', '#ff7b7b', '#ffe482', '#73f37e',
    '#79c7ff', '#e379f4', '#f3739e', '#7ebeff', '#ffde72'
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
  if (this.titleDiv?.nativeElement) {
    this.titleDiv.nativeElement.innerHTML = this.note.title || '';
  }
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

downloadAsPDF(): void {
  if (!this.note) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = this.note.title || '';
  const title = tmp.innerText?.trim() || 'Untitled Note';
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  // ── Title ──
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 12;

  // ── Divider line ──
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Parse HTML content ──
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(this.note.content || '', 'text/html');

  const addNewPageIfNeeded = () => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Handles both #hex and rgb() color formats
  const hexToRgb = (color: string): [number, number, number] => {
    if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    if (color.startsWith('#')) {
      const clean = color.replace('#', '');
      const bigint = parseInt(clean, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }
    return [55, 53, 47]; // default dark
  };

  const processNode = (node: Node, inheritedStyle: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    color: string;
    fontSize: number;
  }) => {

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim()) return;

      // Apply font style
      let fontStyle = 'normal';
      if (inheritedStyle.bold && inheritedStyle.italic) fontStyle = 'bolditalic';
      else if (inheritedStyle.bold) fontStyle = 'bold';
      else if (inheritedStyle.italic) fontStyle = 'italic';

      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(inheritedStyle.fontSize);

      // Apply color
      const [r, g, b] = hexToRgb(inheritedStyle.color);
      doc.setTextColor(r, g, b);

      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        addNewPageIfNeeded();
        doc.text(line, margin, y);

        // Underline
        if (inheritedStyle.underline) {
          const lineWidth = doc.getStringUnitWidth(line) * inheritedStyle.fontSize / doc.internal.scaleFactor;
          doc.setDrawColor(r, g, b);
          doc.line(margin, y + 1, margin + lineWidth, y + 1);
        }

        // Strikethrough
        if (inheritedStyle.strike) {
          const lineWidth = doc.getStringUnitWidth(line) * inheritedStyle.fontSize / doc.internal.scaleFactor;
          doc.setDrawColor(r, g, b);
          doc.line(margin, y - 3, margin + lineWidth, y - 3);
        }

        y += inheritedStyle.fontSize * 0.5;
      });

    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      const style = { ...inheritedStyle };
      const inlineColor = el.style.color || el.getAttribute('color') || '';
      const inlineFontWeight = el.style.fontWeight;
      const inlineFontStyle = el.style.fontStyle;
      const inlineTextDec = el.style.textDecoration;

      if (tag === 'b' || tag === 'strong' || inlineFontWeight === 'bold' || inlineFontWeight === '700') style.bold = true;
      if (tag === 'i' || tag === 'em' || inlineFontStyle === 'italic') style.italic = true;
      if (tag === 'u' || inlineTextDec?.includes('underline')) style.underline = true;
      if (tag === 's' || tag === 'strike' || inlineTextDec?.includes('line-through')) style.strike = true;
      if (inlineColor && (inlineColor.startsWith('#') || inlineColor.startsWith('rgb'))) {
        style.color = inlineColor;
      }

      if (tag === 'h1') { style.bold = true; style.fontSize = 18; }
      if (tag === 'h2') { style.bold = true; style.fontSize = 15; }
      if (tag === 'h3') { style.bold = true; style.fontSize = 13; }

      if (tag === 'p' || tag === 'div') {
        el.childNodes.forEach(child => processNode(child, style));
        y += 4;
        return;
      }

      if (tag === 'br') {
        y += style.fontSize * 0.5;
        return;
      }

      if (tag === 'li') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(style.fontSize);
        doc.setTextColor(55, 53, 47);
        doc.text('•', margin, y);
        el.childNodes.forEach(child => processNode(child, style));
        y += 2;
        return;
      }

      el.childNodes.forEach(child => processNode(child, style));

      if (['p', 'div', 'h1', 'h2', 'h3', 'li', 'ul', 'ol'].includes(tag)) {
        y += 4;
      }
    }
  };

  const defaultStyle = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    color: '#37352f',
    fontSize: 12,
  };

  htmlDoc.body.childNodes.forEach(node => processNode(node, defaultStyle));

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}
@ViewChild('titleDiv') titleDiv!: ElementRef<HTMLDivElement>;
onTitleChange(event: Event): void {
  const el = event.target as HTMLElement;
  if (this.note) {
    this.note.title = el.innerText;
    this.noteService.updateNote(this.note);
  }
}
}
