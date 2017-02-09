import { Component, OnInit, ViewChild } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { StandardModel, StandardListModel } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';
import { ColorPickerService } from 'angular2-color-picker';
import { RgbLightModel } from '../../../model/rgbLightModel';

@Component({
  moduleId: module.id,
  templateUrl: 'rgblight-standard.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class RgbLightStandardComponent implements OnInit {
    
    public id: string;
    public standard: StandardModel;
    public color: string = "#FFFFFF";
    public moduleTab: string;
    public standardList: StandardListModel[];

    public constructor(
        private base: BaseView,
        private standardService: StandardService,
        private cpService: ColorPickerService
    ) {
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        this.standardService
            .getByID(this.id)
            .then((data) => this.setData(data));
    }

    private setData(data: StandardModel): void {
        this.standard = data;
        if (this.standard.value) {
            this.setColor(this.standard.value);
        }
    }

    private setColor(value: RgbLightModel): void {
        this.color = `rgb(${value.red},${value.green},${value.blue})`;
    }

    public onBack(): void {
        this.base.back();
    }

    public onApply(): void {
        let hsva = this.cpService.stringToHsva(this.color);
        let rgb = this.cpService.denormalizeRGBA(this.cpService.hsvaToRgba(hsva));

        let value = {
            red: rgb.r,
            green: rgb.g,
            blue: rgb.b
        };

        this.standard.value = value;
        this.standardService
            .updateValue(this.standard);
    }
}