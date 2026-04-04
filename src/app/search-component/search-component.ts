import { Component } from '@angular/core';
import { NoteService } from '../note-service';

@Component({
  selector: 'app-search-component',
  imports: [],
  templateUrl: './search-component.html',
  styleUrl: './search-component.css',

})
export class SearchComponent {
  onSearch(event: any) {
  const term = event.target.value;
  this.noteService.setSearchTerm(term);
}
}

