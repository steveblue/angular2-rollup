import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServerModule } from '@angular/platform-server';
import { AppModule } from './app.module.server';
import { AppComponent } from './app.component';

@NgModule({
    declarations: [],
    imports: [
        BrowserModule.withServerTransition({
            appId: 'universal'
        }),
        ServerModule,
        AppModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class ServerAppModule { }