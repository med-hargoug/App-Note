import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FolderSidebarComponent } from './folder-side-bar-component/folder-side-bar-component';
import { NoteService } from './note-service';
import { TruncatePipe } from './truncate-pipe-pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FolderSidebarComponent, TruncatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AppNote');

  constructor(private noteService: NoteService) {}

  ngOnInit() {
    this.noteService.autoPurgeTrash();
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
  }
}
