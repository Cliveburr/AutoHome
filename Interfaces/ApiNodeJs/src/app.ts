import { HttpApplication, IHttpApplication, IConfigureServices, IConfigure, StaticFiles, DefaultFiles, NotFound, FileModule } from 'webhost';
import { MvcModule, Mvc, configureMvc, Authentication, SecurityModule } from 'webhost-mvc';
import { ALL_SERVICES } from './services';
import { loadAppSettings } from './settings/app-settings';
//import { SessionServiceProvider } from './service/session-security.service';

const { provider, appSettings } = loadAppSettings(__dirname);

@HttpApplication({
    imports: [MvcModule, FileModule, SecurityModule],
    providers: [provider, ALL_SERVICES],
    exports: [provider, ALL_SERVICES],
    port: 5254,
    approot: __dirname,
    wwwroot: __dirname + appSettings.wwwroot
})
export class AllMvcTests implements IHttpApplication {
    
    public constructor(
    ) {
    }

    public configureServices(services: IConfigureServices): void {
        
        configureMvc(services, {
            routes: [{
                prefix: 'api'
            }]
        });
    }

    public configure(app: IConfigure): void {
     
        app.use(DefaultFiles);
        app.use(StaticFiles);

        //app.use(Authentication);
        app.use(Mvc);

        app.use(NotFound);
    }
}
