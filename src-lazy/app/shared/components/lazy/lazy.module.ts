import { NgModule }           from '@angular/core';
import { RouterModule }       from '@angular/router';
import { CommonModule }  from '@angular/common';

import { LazyComponent } from './lazy.component';
import { routing } from './lazy.routes';

@NgModule({
  imports:      [ RouterModule,
                  CommonModule,
                  routing ],
  declarations: [ LazyComponent ],
  exports: [ LazyComponent ]
})

export class LazyModule {}
