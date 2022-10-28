import { Authorization, Controller, HttpPost } from "webhost-mvc";
import { BolleanRequest, CellingFanState, FanSpeedEnum, ModuleModel, UintRequest } from "../model";
import { CellingFanService } from "../services";
import { ControllerBase } from "./controller-base";

@Controller()
@Authorization()
export default class CellingFanController extends ControllerBase {

    public constructor(
        private cellingFanService: CellingFanService
    ) {
        super();
    }

    @HttpPost('setlight')
    public setLight(request: BolleanRequest): Promise<void> {
        return this.cellingFanService.saveState({
            setLight: true,
            light: request.value
        }, request.model);
    }

    @HttpPost('setfan')
    public setFan(request: BolleanRequest): Promise<void> {
        return this.cellingFanService.saveState({
            setFan: true,
            fan: request.value
        }, request.model);
    }

    @HttpPost('setfanup')
    public setFanUp(request: BolleanRequest): Promise<void> {
        return this.cellingFanService.saveState({
            setFanUp: true,
            fanUp: request.value
        }, request.model);
    }

    @HttpPost('setfanspeed')
    public setFanSpeed(request: UintRequest): Promise<void> {
        return this.cellingFanService.saveState({
            fanSpeed: request.value == 0 ?
            FanSpeedEnum.Min :
            request.value == 1 ?
            FanSpeedEnum.Medium :
            FanSpeedEnum.Max
        }, request.model);
    }

    @HttpPost('getstate')
    public getState(moduleModel: ModuleModel): Promise<CellingFanState> {
        return this.cellingFanService.getState(moduleModel);
    }
}