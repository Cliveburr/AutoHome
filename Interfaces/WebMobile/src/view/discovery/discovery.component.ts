import { Component } from '@angular/core';
//import { LoginService } from '../../service';

// interface IProfileLoginModel {
//     login: string;
//     password: string;
// }

@Component({
    templateUrl: './discovery.component.html'
})
export class DiscoveryComponent {

    //public model: IProfileLoginModel;

    public constructor(
        //private loginService: LoginService
    ) {
      //  this.model = <any>{};
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
