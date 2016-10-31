import { AppModule } from './app.module';
import { enableProdMode } from '@angular/core';

//import { platformBrowser } from '@angular/platform-browser';
//import { AppModuleNgFactory } from './app.module.ngfactory';
//platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
const platform = platformBrowserDynamic();
//enableProdMode();
platform.bootstrapModule(AppModule);