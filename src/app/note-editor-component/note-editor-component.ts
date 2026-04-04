

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../note-service';
import { Note } from '../interface/note-interface';


@Component({
  selector: 'app-note-editor',
  templateUrl: './note-editor-component.html',
  styleUrls: ['./note-editor-component.css']
})
export class NoteEditorComponent implements OnInit {
  note?: Note;

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get the ID from the URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.note = this.noteService.getNoteById(id);
    }
  }



  // Inside NoteEditorComponent

// Helper to apply formatting (Bold, Italic, etc.)
execCommand(command: string) {
  document.execCommand(command, false, '');
}

// Requirement #3: Save every time the content changes
onContentChange(event: any) {
  if (this.note) {
    this.note.content = event.target.innerHTML;
    this.save();
  }
}

// Requirement #1 & #6: Update status and save
togglePin() {
  if (this.note) {
    this.note.isPinned = !this.note.isPinned;
    this.save();
  }
}

changeColor(color: string) {
  if (this.note) {
    this.note.color = color;
    this.save();
  }
}

save() {
  if (this.note) {
    this.note.updatedAt = Date.now();
    this.noteService.updateNote(this.note);
  }
}
}




