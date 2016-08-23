import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }   from './app.component';
import { routing } from './app.routes';

import { HomeModule } from './shared/components/home/home.module';

@NgModule({

    imports: [ BrowserModule,
               HttpModule,
               HomeModule,
               routing],
    declarations: [ AppComponent ],
    bootstrap:    [ AppComponent ]
})

export class AppModule {}
