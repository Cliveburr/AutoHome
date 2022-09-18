import { ChangeDetectorRef, Component } from '@angular/core';
import { ModuleModel } from 'src/model';
import { ModuleService } from 'src/service';
//import { LoginService } from '../../service';

@Component({
    templateUrl: './home.component.html'
})
export class HomeComponent {

    public constructor(
        public moduleService: ModuleService
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
