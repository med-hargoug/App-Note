
import { Component, OnInit } from '@angular/core';
import { FolderService } from '../folder-service';
import { Folder } from '../interface/folder-interface';
import { NoteService } from '../note-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-folder-side-bar',
  templateUrl: './folder-side-bar-component.html',
  styleUrls: ['./folder-side-bar-component.css']
})
export class FolderSidebarComponent implements OnInit {
  folders: Folder[] = [];

  constructor(private folderService: FolderService) {}

  ngOnInit(): void {
    // Get the initial list of folders
    this.folders = this.folderService.getFolders();
  }
  // Inside NoteService...
  private selectedFolderId = new BehaviorSubject<string | 'all' | 'trash'>('all');
  selectedFolderId$ = this.selectedFolderId.asObservable();

  setFilter(filter: string | 'all' | 'trash') {
    this.selectedFolderId.next(filter);
  }
  addNewNote() {
  const newId = this.noteService.createNote();
  this.router.navigate(['/notes', newId]); // Go straight to the editor
}
}
