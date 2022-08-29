import { Component } from '@angular/core';
//import { LoginService } from '../../service';

@Component({
    templateUrl: './home.component.html'
})
export class HomeComponent {


    public constructor(
        //private loginService: LoginService
    ) {
        //this.model = <any>{};
    }

    public login(): void {
        // this.loginService.base.withLoadingNav(
        //     this.loginService.authenticationByLogin(
        //         this.model.login,
        //         this.model.password),
        //         '/site'
        // );
    }
}
