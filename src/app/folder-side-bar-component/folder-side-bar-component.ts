import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FolderService } from '../folder-service';
import { Folder } from '../interface/folder-interface';
import { NoteService } from '../note-service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-folder-side-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './folder-side-bar-component.html',
  styleUrls: ['./folder-side-bar-component.css']
})
export class FolderSidebarComponent implements OnInit {
  folders: Folder[] = [];
  isAddingFolder = false;
  newFolderName = '';
  editingFolderId: string | null = null;
  editingFolderName = '';
  activeFilter: string = 'all';
  isDarkMode = false;

  constructor(
    private folderService: FolderService,
    private noteService: NoteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.folderService.folders$.subscribe(data => {
      this.folders = data;
    });
  }

  selectFilter(filter: string) {
    this.activeFilter = filter;
    this.noteService.setFilter(filter);
    if (filter === 'trash') {
      this.router.navigate(['/trash']);
    } else {
      this.router.navigate(['/notes']);
    }
  }

  addNewNote() {
    const newId = this.noteService.createNote(
      this.activeFilter !== 'all' && this.activeFilter !== 'trash' ? this.activeFilter : null
    );
    this.router.navigate(['/notes', newId]);
  }

  startAddFolder() {
    this.isAddingFolder = true;
    this.newFolderName = '';
  }

  confirmAddFolder() {
    if (this.newFolderName.trim()) {
      this.folderService.addFolder(this.newFolderName.trim());
    }
    this.isAddingFolder = false;
    this.newFolderName = '';
  }

  cancelAddFolder() {
    this.isAddingFolder = false;
    this.newFolderName = '';
  }

  startEditFolder(folder: Folder, event: Event) {
    event.stopPropagation();
    this.editingFolderId = folder.id;
    this.editingFolderName = folder.name;
  }

  confirmEditFolder(id: string) {
    if (this.editingFolderName.trim()) {
      this.folderService.updateFolder(id, this.editingFolderName.trim());
    }
    this.editingFolderId = null;
  }

  deleteFolder(id: string, event: Event) {
    event.stopPropagation();
    this.folderService.deleteFolder(id);
    if (this.activeFilter === id) {
      this.selectFilter('all');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }
}
