import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'new'
})

export class NewPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return null;
  }

}