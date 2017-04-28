import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EnumSelect } from '../component/enumSelect';
import { EnumTextComponent } from '../component/enumText.component';
import { Ng2DragDropModule } from 'ng2-drag-drop';
import { ModalModule } from 'ng2-bootstrap';

import { AreaService } from '../service/areaService';
import { StandardService } from '../service/standardService';
import { ModuleService } from '../service/moduleService';

import { MODAL_COMPONENTS } from '../component/modal/modal.component';
import { ModalService } from '../component/modal/modal.service';

@NgModule({
  imports: [ CommonModule, FormsModule, Ng2DragDropModule, ModalModule ],
  declarations: [ EnumSelect, EnumTextComponent, MODAL_COMPONENTS ],
  exports: [ EnumSelect, EnumTextComponent, MODAL_COMPONENTS ],
  providers: [ AreaService, StandardService, ModuleService, ModalService ],
  entryComponents: [ MODAL_COMPONENTS ]
})
export class SharedModule {

}