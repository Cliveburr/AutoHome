import { Injectable } from '@angular/core';
import { ActivatedRoute, Router, RoutesRecognized, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

import { ModalService } from '../../component/modal/modal.service';
import { NotifyService } from '../../component/notify.service';

@Injectable()
export class BaseView {
    public params: Promise<any>;

    public constructor(
        public route: ActivatedRoute,
        public router: Router,
        public location: Location,
        public modal: ModalService,
        public notify: NotifyService
    ) {
    }

    public back(): void {
        this.location.back();
    }
}