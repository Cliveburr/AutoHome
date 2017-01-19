import { AppModule } from './app.module';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

//import { platformBrowser } from '@angular/platform-browser';
//import { AppModuleNgFactory } from './app.module.ngfactory';
//platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);
//enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);