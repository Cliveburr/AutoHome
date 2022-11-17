import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ModuleService } from './modules/module.service';

@Injectable()
export class WithModuleGuardService implements CanActivateChild  {

    public constructor(
        private router: Router,
        private moduleService: ModuleService
    ) {
    }

    public canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
       if (this.moduleService.selected) {
            return true;
        }
        else {
            this.router.navigateByUrl('/home');
            return false;
        }
    }
}