import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './tmp/app/app.module';
enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);


