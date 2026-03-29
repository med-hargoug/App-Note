import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlightPipe',
})
export class HighlightPipePipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
