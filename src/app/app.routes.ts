import { Routes } from '@angular/router';
import { NoteListComponent }  from './note-list-component/note-list-component';
import { NoteCardComponent } from './note-card-component/note-card-component';
import { NoteEditorComponent } from './note-editor-component/note-editor-component';
import { FolderSideBarComponent } from './folder-side-bar-component/folder-side-bar-component';
import { SearchComponent } from './search-component/search-component';
import { TrashComponent } from './trash-component/trash-component';


export const routes: Routes = [
   { path : '', redirectTo : '/contacts', pathMatch : 'full' },
   { path : 'folder-side-bar-component' , component : FolderSideBarComponent}

];
