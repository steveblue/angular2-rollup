import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppConfig } from './app.config';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { HomeModule } from './shared/components/home/home.module';

export function initConfig(config: AppConfig) {
    return () => config.load()
}


@NgModule({

    imports: [ BrowserModule,
               BrowserAnimationsModule,
               HttpModule,
               CommonModule,
               HomeModule,
               routing],
    declarations: [ AppComponent ],
    bootstrap: [ AppComponent ],
    providers:  [ AppConfig, { provide: APP_INITIALIZER, useFactory: initConfig, deps: [AppConfig], multi: true } ]
})

export class AppModule { }
