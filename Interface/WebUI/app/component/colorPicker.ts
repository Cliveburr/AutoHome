import 'colorpicker';
import { Component, AfterViewInit, ViewChild, OnInit, ElementRef } from '@angular/core';

declare var ColorPicker: any;

@Component({
    selector: 'colorpicker',
    template: `<div class="row">
    <div id="picker-wrapper" class="col-4">
              <div #picker id="picker"></div>
              <div #pickeri id="picker-indicator"></div>
          </div>
          <div id="slider-wrapper" class="col-4">
              <div #slider id="slider"></div>
              <div #slideri id="slider-indicator"></div>
          </div>
          </div>`,
    styleUrls: ['app/component/colorPicker.css']
})
export class ColorPickerComponent implements AfterViewInit {

    @ViewChild('picker') public picker: ElementRef;
    @ViewChild('slider') public slider: ElementRef;
    @ViewChild('pickeri') public pickeri: ElementRef;
    @ViewChild('slideri') public slideri: ElementRef;

    public ngAfterViewInit(): void {
        let picker = this.picker.nativeElement as HTMLDivElement;
        let slider = this.slider.nativeElement as HTMLDivElement;
        let pickeri = this.pickeri.nativeElement as HTMLDivElement;
        let slideri = this.slideri.nativeElement as HTMLDivElement;
        
        // ColorPicker(
        //     slider,
        //     picker,
        //     (hex: any, hsv: any, rgb: any) => {
        //         console.log(hsv.h, hsv.s, hsv.v);
        //         console.log(rgb.r, rgb.g, rgb.b);
        // });
        ColorPicker.fixIndicators(
                slideri,
                pickeri);

        ColorPicker(
                slider, 
                picker, 

                (hex: any, hsv: any, rgb: any, pickerCoordinate: any, sliderCoordinate: any) => {

                    ColorPicker.positionIndicators(
                        slideri,
                        pickeri,
                        sliderCoordinate, pickerCoordinate
                    );

                    console.log(rgb.r, rgb.g, rgb.b);
            });
    }
}