import { NgModule }           from '@angular/core';
import { RouterModule }       from '@angular/router';
import { CommonModule }  from '@angular/common';

import { LazyComponent } from './lazy.component';


@NgModule({
  imports:      [ RouterModule,
                  CommonModule ],
  declarations: [ LazyComponent ],
  exports: [ LazyComponent ]
})

export class LazyModule {}
