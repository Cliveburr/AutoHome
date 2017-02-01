import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { StandardModel } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';

@Component({
  moduleId: module.id,
  templateUrl: 'rgblight.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class RgbLightComponent implements OnInit {
    
    public type: string;
    public id: string;
    public header: string;

    public standard: StandardModel;

    public constructor(
        private base: BaseView,
        private standardService: StandardService
    ) {
        this.header = '';
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.type = params['type'];
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        if (this.type == 'standard') {
            this.standardService
                .getByID(this.id)
                .then((data) => { 
                    this.standard = data;
                    this.header = `Standard ${this.standard.name}`;
                    if (!this.standard.value) {
                        this.standard.value = {
                            red: 0,
                            green: 0,
                            blue: 0
                        }
                    }
                });
        }
    }

    public get isStandard(): boolean {
        return this.type == 'standard' && this.standard != undefined;
    }

    public onBack(): void {
        this.base.back();
    }

    public onApply(): void {
    }

}