import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipePipe implements PipeTransform {
  transform(value: string, term: string): string {
    if (!term || !value) return value;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    return value.replace(re, '<mark class="search-highlight">$1</mark>');
  }
}
