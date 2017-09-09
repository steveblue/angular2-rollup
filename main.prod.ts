import { platformBrowser } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { AppModule } from './tmp/app/app.module';
enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModule);