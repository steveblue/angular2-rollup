import { NgModule }           from '@angular/core';
import { RouterModule }       from '@angular/router';

import { routing } from './home.routes';

import { HomeComponent } from './home.component';

@NgModule({
  imports:      [ RouterModule,
                  routing ],
  declarations: [ HomeComponent ]
})

export class HomeModule {}
