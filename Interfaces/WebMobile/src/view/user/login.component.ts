import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService, UserService } from 'src/service';

interface IProfileLoginModel {
    login: string;
    password: string;
}

@Component({
    templateUrl: './login.component.html'
})
export class UserLoginComponent {

    public model: IProfileLoginModel;

    public constructor(
        private userService: UserService,
        private sessionService: SessionService,
        private router: Router
    ) {
        this.model = <any>{};
    }

    public async enter(form: NgForm): Promise<void> {
        const res = await <any>this.userService.enter(form.form.value.password);
        this.sessionService.setToken(res.token);
        this.router.navigateByUrl('/home');
        // this.loginService.base.withLoadingNav(
        //     this.loginService.authenticationByLogin(
        //         this.model.login,
        //         this.model.password),
        //         '/site'
        // );
    }
}
