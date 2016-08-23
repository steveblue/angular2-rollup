import { NgModule }           from '@angular/core';

import { routing } from './home.routes';

import { HomeComponent } from './home.component';

@NgModule({
  imports:      [ routing ],
  declarations: [ HomeComponent ]
})

export class HomeModule {}
