import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent }  from './app.component';
import { routing }       from './app.routes';
import { HomeModule } from './shared/components/home/home.module';
import { LazyModule } from './shared/components/lazy/lazy.module';

@NgModule({

    imports: [ BrowserModule,
               BrowserAnimationsModule,
               CommonModule,
               HttpClientModule,
               HomeModule,
               LazyModule,
               routing],
    declarations: [ AppComponent ],
    bootstrap:    [ AppComponent ]
})

export class AppModule {}
