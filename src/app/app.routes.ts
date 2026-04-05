import { Routes } from '@angular/router';
import { NoteListComponent } from './note-list-component/note-list-component';
import { NoteEditorComponent } from './note-editor-component/note-editor-component';
import { TrashComponent } from './trash-component/trash-component';

export const routes: Routes = [
  { path: '', redirectTo: '/notes', pathMatch: 'full' },
  { path: 'notes', component: NoteListComponent },
  { path: 'notes/:id', component: NoteEditorComponent },
  { path: 'trash', component: TrashComponent }
];
