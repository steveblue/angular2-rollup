import { platformBrowser } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { AppModuleNgFactory } from './ngfactory/tmp/app/app.module';
enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);