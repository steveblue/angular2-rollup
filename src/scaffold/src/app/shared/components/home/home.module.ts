import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home.component';

@NgModule({
  imports:      [ RouterModule,
                  CommonModule ],
  declarations: [ HomeComponent ],
  exports: [ HomeComponent ]
})

export class HomeModule {}
