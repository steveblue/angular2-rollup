import { Component, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';


@Component({
  selector: 'cmp-prefix1-app-lazy',
  templateUrl: 'lazy.component.html',
  styleUrls: ['lazy.component.css'],
  animations: [
    trigger('intro', [
      state('void', style({
        opacity: '0.0',
        transform: 'translateZ(-1000px)'
      })),
      state('active', style({
        opacity: '1.0',
        transform: 'translateZ(0px)',
        perspective: '1000px'
      })),
      state('inactive',   style({
        opacity: '0.0',
        transform: 'translateZ(-1000px)',
        perspective: '1000px'
      })),
      transition('active => void', animate('5000ms cubic-bezier(0.19, 1, 0.22, 1)')),
      transition('void => active', animate('5000ms cubic-bezier(0.19, 1, 0.22, 1)')),
      transition('inactive => active', animate('5000ms cubic-bezier(0.19, 1, 0.22, 1)')),
      transition('active => inactive', animate('5000ms cubic-bezier(0.19, 1, 0.22, 1)'))
    ])
  ]
})

export class LazyComponent implements OnDestroy {

  angularMode: string;

  constructor() {

    this.angularMode = 'active';

  }

  ngOnDestroy() {

    this.angularMode = 'inactive';

  }

}
