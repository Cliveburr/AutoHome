import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { StandardModel, StandardType } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';

@Component({
  moduleId: module.id,
  templateUrl: 'standard-edit.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class StandardEditComponent implements OnInit {
    public standard: StandardModel;
    public id: string;
    public types = StandardType;

    public constructor(
        private base: BaseView,
        private standardService: StandardService
    ) {
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        if (this.id == 'create') {
            this.standard = {
                id: '<new>',
                name: '',
                type: 0,
                value: null
            };
        }
        else {
            this.standardService
                .getByID(this.id)
                .then((data) => this.standard = data);
        }
    }

    public onSave(): void {
        let promise = this.id == 'create' ?
            this.standardService.create(this.standard) :
            this.standardService.update(this.standard);

        promise.then(() => this.base.router.navigateByUrl('/data/standard'));
    }

    public onBack(): void {
        this.base.back();
    }
}