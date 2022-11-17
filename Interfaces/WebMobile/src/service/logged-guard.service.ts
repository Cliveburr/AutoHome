import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivate, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionService } from './session.service';

@Injectable()
export class LoggedGuardService implements CanActivateChild  {

    public constructor(
        private router: Router,
        private sessionService: SessionService
    ) {
    }

    public canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if (this.sessionService.isLogged) {
            return true;
        }
        else {
            this.router.navigateByUrl('/login');
            return false;
        }
    }
}


@Injectable()
export class NotLoggedGuardService implements CanActivate  {

    public constructor(
        private router: Router,
        private sessionService: SessionService
    ) {
    }
    
    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        if (this.sessionService.isLogged) {
            this.router.navigateByUrl('/home');
            return false;
        }
        else {
            return true;
        }
    }
}