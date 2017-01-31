import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StandardModel, StandardType } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';

@Component({
  moduleId: module.id,
  templateUrl: 'standard-edit.component.html',
  styleUrls: [  ]
})
export class StandardEditComponent implements OnInit {
    public standard: StandardModel;
    public id: string;
    //public types = Object.keys(StandardType).map(key => StandardType[+key]);
    //public types = [ 'some', 'thing' ];
    public types = StandardType;

    public constructor(
        private standardService: StandardService,
        private route: ActivatedRoute,
        private router: Router
    ) {
    }

    public ngOnInit(): void {
        this.route.params.subscribe(params => this.id = params['id']);
        this.onRefresh();
    }

    public onRefresh(): void {
        if (this.id == 'create') {
            this.standard = new StandardModel();
            this.standard.id = '<new>';
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

        promise.then(() => this.router.navigateByUrl('/data/standard'));
    }
}