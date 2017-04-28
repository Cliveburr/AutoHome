import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EnumSelect } from '../component/enumSelect';
import { EnumTextComponent } from '../component/enumText.component';
import { Ng2DragDropModule } from 'ng2-drag-drop';

import { AreaService } from '../service/areaService';
import { StandardService } from '../service/standardService';
import { ModuleService } from '../service/moduleService';


@NgModule({
  imports: [ CommonModule, FormsModule, Ng2DragDropModule ],
  declarations: [ EnumSelect, EnumTextComponent ],
  exports: [ EnumSelect, EnumTextComponent ],
  providers: [ AreaService, StandardService, ModuleService ]
})
export class SharedModule {

}