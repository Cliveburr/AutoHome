import { Component } from '@angular/core';
import { ModuleService, SessionService } from 'src/service';

@Component({
    selector: 'body',
    templateUrl: './mainlayout.component.html'
})
export class MainLayoutComponent {

    public constructor(
        public sessionService: SessionService,
        public moduleService: ModuleService
    ) {
    }

    public homeClick(): void {
        //this.moduleService.selected = undefined;
    }
}