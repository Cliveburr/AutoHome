import { Component, OnInit } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { EditorViewModel, StandardListModel } from '../../../model/standardModel';
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
    public model: EditorViewModel;
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
            .getEditor(this.id)
            .then((data) => this.setModel(data));
    }

    private setModel(data: EditorViewModel): void {
        this.model = data;
        if (this.model.rgbLightValue) {
            this.setColor(this.model.rgbLightValue);
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

        this.model.rgbLightValue = value;
        this.standardService
            .postEditor(this.model);
    }
}