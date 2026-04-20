import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, PreloadAllModules, RouterModule } from '@angular/router';
import { FuseModule } from '@fuse';
import { FuseConfigModule } from '@fuse/services/config';
import { FuseMockApiModule } from '@fuse/lib/mock-api';
import { CoreModule } from 'app/core/core.module';
import { appConfig } from 'app/core/config/app.config';
import { mockApiServices } from 'app/mock-api';
import { LayoutModule } from 'app/layout/layout.module';
import { AppComponent } from 'app/app.component';
import { appRoutes } from 'app/app.routing';
import { MatIconModule } from '@angular/material/icon';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';
import { AppInitService } from 'app/core/app-init.service';
import { TranslocoRootModule } from './transloco-root.module/transloco-root.module';

const routerConfig: ExtraOptions = {
    preloadingStrategy       : PreloadAllModules,
    scrollPositionRestoration: 'enabled'
};

export function initApp(appInitService: AppInitService) {
    return () => appInitService.init();
  }


@NgModule({
    declarations: [
        AppComponent
    ],
    imports     : [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(appRoutes, routerConfig),
        TranslocoRootModule,

        // Fuse, FuseConfig & FuseMockAPI
        FuseModule,
        FuseConfigModule.forRoot(appConfig),
        FuseMockApiModule.forRoot(mockApiServices),

        // Core module of your application
        CoreModule,
        LayoutModule,
        MatIconModule,
        ToastrModule.forRoot({
            closeButton: true,
            timeOut: 1500, // 15 seconds
            progressBar: true,
          }), 
        // Layout module of your application
        
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (appInitService: AppInitService) => () => appInitService.init(),
            deps: [AppInitService],
            multi: true
        }
    ],
    bootstrap   : [
        AppComponent
    ]
})
export class AppModule
{
}
