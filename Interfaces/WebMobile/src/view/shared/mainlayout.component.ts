import { Component } from '@angular/core';
import { SessionService } from 'src/service';

@Component({
    selector: 'body',
    templateUrl: './mainlayout.component.html'
})
export class MainLayoutComponent {

    public constructor(
        public sessionService: SessionService
    ) {
    }
}