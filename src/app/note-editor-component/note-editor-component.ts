import { Component, OnInit } from '@angular/core';
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
export class NoteEditorComponent implements OnInit {
  note?: Note;

  colors: string[] = [
    '#ffffff',
    '#fdecec', '#fef3cd', '#e8f5e9',
    '#e3f2fd', '#f3e5f5', '#fce4ec',
    '#f0f4f8', '#fff8e1'
  ];

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.note = this.noteService.getNoteById(id);
        if (!this.note) this.router.navigate(['/notes']);
      }
    });
  }

  execCommand(command: string, value: string = '') {
    document.execCommand(command, false, value);
    this.save();
  }

  onContentChange(event: Event) {
    const el = event.target as HTMLElement;
    if (this.note) {
      this.note.content = el.innerHTML;
      this.save();
    }
  }

  updateTitle(newTitle: string) {
    if (this.note) { this.note.title = newTitle; this.save(); }
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

  goBack() {
    this.router.navigate(['/notes']);
  }

  save() {
    if (this.note) {
      this.note.updatedAt = Date.now();
      this.noteService.updateNote(this.note);
    }
  }
}
