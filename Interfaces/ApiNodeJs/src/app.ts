import { HttpApplication, IHttpApplication, IConfigureServices, IConfigure, StaticFiles, DefaultFiles, NotFound, FileModule } from 'webhost';
import { MvcModule, Mvc, configureMvc, Authentication, SecurityModule } from 'webhost-mvc';
import { ALL_SERVICES } from './services';
import { loadAppSettings } from './settings/app-settings';
import { JwtServiceProvider } from './security/jwt-security';
import { SpaPipe } from './http/spa.pipe';

const { provider, appSettings } = loadAppSettings(__dirname);

@HttpApplication({
    imports: [MvcModule, FileModule, SecurityModule],
    providers: [provider, ALL_SERVICES, JwtServiceProvider, SpaPipe],
    exports: [provider, ALL_SERVICES, JwtServiceProvider],
    port: appSettings.apiPort,
    approot: __dirname,
    wwwroot: __dirname + appSettings.wwwroot,
    timeout: appSettings.timeout
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
     
        app.use(SpaPipe);
        app.use(StaticFiles);

        app.use(Authentication);
        app.use(Mvc);

        app.use(NotFound);
    }
}
