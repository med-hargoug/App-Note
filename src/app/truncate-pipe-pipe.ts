import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncatePipe',
})
export class TruncatePipePipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
