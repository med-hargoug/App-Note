import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { FolderSidebarComponent } from './folder-side-bar-component/folder-side-bar-component';
import { NoteService } from './note-service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AppNote');
  constructor(private noteService: NoteService) {}

  ngOnInit() {
    // This runs once when the user opens the app
    this.noteService.autoPurgeTrash();
  }
  toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}
}
