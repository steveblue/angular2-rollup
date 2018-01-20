import { AppModule } from './app.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

@NgModule({
    declarations: [],
    imports: [
        BrowserModule.withServerTransition({
            appId: 'universal'
        }),
        AppModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class BrowserAppModule { }