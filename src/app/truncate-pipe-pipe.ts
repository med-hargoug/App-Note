import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncatePipe',
})
export class TruncatePipePipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  // limit: how many characters to show
  // ellipsis: what to show at the end (default is '...')
  transform(value: string, limit: number = 40, ellipsis: string = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + ellipsis : value;
  }
}