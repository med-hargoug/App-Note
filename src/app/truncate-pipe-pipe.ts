import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 100): string {
    if (!value) return '';
    const plain = value.replace(/<[^>]*>/g, '');
    return plain.length > limit ? plain.slice(0, limit) + '…' : plain;
  }
}
