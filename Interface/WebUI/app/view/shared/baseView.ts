import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, RoutesRecognized, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

@Injectable()
export class BaseView {
    public params: Promise<any>;

    public constructor(
        public route: ActivatedRoute,
        public router: Router,
        public location: Location
    ) {
    }

    public back(): void {
        this.location.back();
    }
}