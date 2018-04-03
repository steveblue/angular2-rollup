import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './shared/components/home/home.component';
import { LazyComponent } from './shared/components/lazy/lazy.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lazy', component: LazyComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);