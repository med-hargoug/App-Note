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
import * as html2pdf from 'html2pdf.js';

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

downloadAsPDF() {
  const doc = new jsPDF();
  
  const title = this.note?.title || 'Untitled Note';
  const rawContent = this.note?.content || '';

  // NEW STEP: This line removes all <tags> like <div>, <p>, <b> etc.
  const cleanText = rawContent.replace(/<[^>]*>/g, ''); 

  doc.setFontSize(22);
  doc.text(title, 20, 20);
  
  doc.setFontSize(12);
  // We use the 'cleanText' here instead of 'rawContent'
  const splitContent = doc.splitTextToSize(cleanText, 170); 
  doc.text(splitContent, 20, 40);

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

}
