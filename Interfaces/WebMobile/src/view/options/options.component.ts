import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from 'src/service';

@Component({
    templateUrl: './options.component.html'
})
export class OptionsComponent {

    public constructor(
        private sessionService: SessionService,
        private router: Router

    ) {
    }

    public Logout(): void {
        this.sessionService.clearToken();
        this.router.navigateByUrl('/login');
    }
}
