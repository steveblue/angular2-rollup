import { NgModule }           from '@angular/core';
import { RouterModule }       from '@angular/router';
import { CommonModule }       from '@angular/common';

import { routing }            from './new.routes';


@NgModule({
  imports:      [ RouterModule,
                  CommonModule,
                  routing ],

  declarations: [ ]
})

export class NewModule {}
