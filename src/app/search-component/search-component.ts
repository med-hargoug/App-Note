import { Component } from '@angular/core';
import { NoteService } from '../note-service'; // Double-check this path
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-component.html',
  styleUrl: './search-component.css'
})
export class SearchComponent {

  // 1. You must inject the service to update the search term globally
  constructor(private noteService: NoteService) {}

  onSearch(event: Event) {
    const element = event.target as HTMLInputElement;
    this.noteService.setSearchTerm(element.value);
  }

  // 2. Add this missing function
  clearSearch(input: HTMLInputElement) {
    input.value = ''; // Clears the text in the HTML input
    this.noteService.setSearchTerm(''); // Tells the NoteService to show all notes again
  }
}
