import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EnumSelect } from '../component/enumSelect';
import { EnumTextComponent } from '../component/enumText.component';
import { NotifyComponent } from '../component/notify.component';
import { NotifyService } from '../component/notify.service';
import { Ng2DragDropModule } from 'ng2-drag-drop';
import { ModalModule, AlertModule } from 'ng2-bootstrap';

import { AreaService } from '../service/areaService';
import { StandardService } from '../service/standardService';
import { ModuleService } from '../service/moduleService';

import { MODAL_COMPONENTS } from '../component/modal/modal.component';
import { ModalService } from '../component/modal/modal.service';
import { WifiConfigurationComponent } from '../view/module/wifi-configuration.component';

@NgModule({
  imports: [ CommonModule, FormsModule, Ng2DragDropModule, ModalModule, AlertModule ],
  declarations: [ EnumSelect, EnumTextComponent, MODAL_COMPONENTS, NotifyComponent, WifiConfigurationComponent ],
  exports: [ EnumSelect, EnumTextComponent, MODAL_COMPONENTS, NotifyComponent ],
  providers: [ AreaService, StandardService, ModuleService, ModalService, NotifyService ],
  entryComponents: [ MODAL_COMPONENTS, WifiConfigurationComponent ]
})
export class SharedModule {

}