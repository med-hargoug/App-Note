import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FolderSidebarComponent } from './folder-side-bar-component/folder-side-bar-component';
import { NoteService } from './note-service';
import { TruncatePipe } from './truncate-pipe-pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FolderSidebarComponent, TruncatePipe, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AppNote');
  sidebarOpen = true;

  constructor(private noteService: NoteService) {}

  ngOnInit() {
    this.noteService.autoPurgeTrash();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
