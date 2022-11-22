import { Authorization, Controller, HttpPost } from "webhost-mvc";
import * as fs from 'fs';
import * as path from 'path';
import { InitRequest, InitResponse } from "../model/init.model";
import { AppSettings } from "../settings/app-settings";
import { ControllerBase } from "./controller-base";
import { HomeImageDescription } from "../model/homeImageDescription";

@Controller()
@Authorization()
export default class HomeController extends ControllerBase {

    private static initResponseCache?: InitResponse;

    public constructor(
        private appSettings: AppSettings
    ) {
        super();
    }

    @HttpPost('/init')
    public init(request: InitRequest): InitResponse | undefined {
        
        if (!HomeController.initResponseCache)
        {
            HomeController.initResponseCache = this.buildInitResponse();
        }

        var requestCacheDate = request.cacheDate ?
            typeof request.cacheDate === 'string' ?
                Date.parse(request.cacheDate) :
                request.cacheDate :
            0;

        if (requestCacheDate < HomeController.initResponseCache.cacheDate)
        {
            return HomeController.initResponseCache;
        }
        else
        {
            return undefined;
        }
    }

    private buildInitResponse(): InitResponse {
        
        const wwwroot = path.resolve(path.join(this.appSettings.approot, this.appSettings.wwwroot));
        const imageDescriptionPath = path.resolve(path.join(wwwroot, 'images', 'home', 'home_description.json'));
        const imageFullPath = path.resolve(path.join(wwwroot, 'images', 'home', 'home_full.png'));

        const description = <HomeImageDescription>JSON.parse(fs.readFileSync(imageDescriptionPath, 'utf8'));
        const fullImage = fs.readFileSync(imageFullPath).toString('base64');

        return {
            cacheDate: Date.now(),
            fullImage,
            description
        };
    }
}