import './rxjs-extensions';

import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule }     from './app-routing.module';
import { LayoutComponent }   from './view/shared/layout.component';

import { ConfigService } from './service/configService';

@NgModule({
  imports: [ BrowserModule, AppRoutingModule, FormsModule, HttpModule, NgbModule.forRoot() ],
  declarations: [ LayoutComponent ],
  bootstrap: [ LayoutComponent ],
  providers: [ ConfigService ],
  exports: [  ]
})
export class AppModule {

  public constructor() {
    this.hideChildsOnbody();
  }

  private hideChildsOnbody(): void {
    let html = document.getElementsByTagName('html')[0].childNodes;
    let passBody = false;
    for (var iel = 0; iel < html.length; iel++) {
      let child = html.item(iel);
      if (child instanceof HTMLElement) {
        if (passBody) {
          child.style.display = 'none';
        }
        else {
          if (child.tagName == 'BODY')
              passBody = true;
        }
      }
    }
  }
}