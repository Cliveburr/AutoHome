import { Component, OnInit, ViewChild } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { ColorPickerService } from 'angular2-color-picker';
import { EditorViewModel, ModuleType } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';
import { RgbLightModel } from '../../../model/rgbLightModel';
import { NgbTabChangeEvent, NgbTabsetConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  moduleId: module.id,
  templateUrl: 'rgblight-module.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class RgbLightModuleComponent implements OnInit {
    
    public id: string;
    public model: EditorViewModel;
    public color: string = "#FFFFFF";
    public moduleTab: string;
    public standardSel: string;

    public constructor(
        private base: BaseView,
        private moduleService: ModuleService,
        private cpService: ColorPickerService,
        config: NgbTabsetConfig
    ) {
        config.justify = 'start';
        config.type = 'pills';
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        this.moduleService
            .getEditor(this.id)
            .then((data) => this.setModel(data));
    }

    private setModel(model: EditorViewModel): void {
        switch (model.type) {
            case ModuleType.ledRibbonRgb:
                this.setLedRibbonRgb(model);
                break;
        }
    }

    private setLedRibbonRgb(model: EditorViewModel): void {
        if (model.ledRibbonRgbState) {
           this.moduleTab = model.ledRibbonRgbState.isStandard ? 'byStandard': 'byManual';
           if (model.ledRibbonRgbState.value) {
               this.setColor(model.ledRibbonRgbState.value);
           }
           if (model.ledRibbonRgbState.isStandard) {
               this.standardSel = model.ledRibbonRgbState.standardId;
           }
        }
        else {
            this.moduleTab = 'byManual';
        }
        this.model = model;
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

        switch (this.model.type) {
            case ModuleType.ledRibbonRgb:
                this.applyLedRibbonRgb(value);
                break;
            default:
                //TODO: trhwo error;
                return;
        }

        this.moduleService
            .postEditor(this.model);
    }

    private applyLedRibbonRgb(value: RgbLightModel): void {
        if (this.moduleTab == 'byManual') {
            this.model.ledRibbonRgbState = {
                isStandard: false,
                standardId: null,
                value: value
            };
        }
        else {
            this.model.ledRibbonRgbState = {
                isStandard: true,
                standardId: this.standardSel,
                value: value
            };
        }
    }

    public onModuleTabChange(event: NgbTabChangeEvent): void {
        this.moduleTab = event.nextId;
    }

    private setColor(value: RgbLightModel): void {
        this.color = `rgb(${value.red},${value.green},${value.blue})`;
    }    
}