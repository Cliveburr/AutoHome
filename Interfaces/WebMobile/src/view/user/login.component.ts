import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseService, SessionService, UserService } from 'src/service';

interface IUserLoginModel {
    password: string;
}

@Component({
    templateUrl: './login.component.html'
})
export class UserLoginComponent {

    public constructor(
        private base: BaseService,
        private userService: UserService,
        private sessionService: SessionService,
        private router: Router
    ) {
    }

    public async enter(form: NgForm): Promise<void> {
        const model = <IUserLoginModel>form.form.value;
        const res = await this.base.withLoading(
            this.userService.login({
                password: model.password,
                uniqueId: this.sessionService.getUniqueId()
            })
        );
        this.sessionService.setLogin(res);
        this.router.navigateByUrl('/home');
    }
}
