import { NgModule }           from '@angular/core';
import { RouterModule }       from '@angular/router';
import { CommonModule }  from '@angular/common';

import { routing } from './home.routes';

import { HomeComponent } from './home.component';

@NgModule({
  imports:      [ RouterModule,
                  CommonModule,
                  routing ],
  declarations: [ HomeComponent ]
})

export class HomeModule {}
