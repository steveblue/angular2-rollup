import { platformBrowser } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { AppModuleNgFactory } from './out-tsc/src/app/app.module.out-tsc';
enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);