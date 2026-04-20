import { Translation, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, translocoConfig, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { TranslocoHttpLoader } from 'app/core/transloco/transloco.http-loader';

@NgModule({
    exports  : [
        TranslocoModule
    ],
    providers: [
        {
            // Provide the default Transloco configuration
            provide : TRANSLOCO_CONFIG,
            useValue: translocoConfig({
                availableLangs      : [
                    {
                        id   : 'en',
                        label: 'English'
                    },
                    {
                        id   : 'ru',
                        label: 'Russian'
                    },
                    {
                        id   : 'hi',
                        label: 'Hindi'
                    },
                    {
                        id   : 'es',
                        label: 'Spanish'
                    },
                    {
                        id   : 'tr',
                        label: 'Turkish'
                    },
                    {
                        id   : 'id',
                        label: 'Indonesian'
                    }
                ],
                defaultLang         : localStorage.getItem('activeLang') || 'en',
                fallbackLang        : 'en',
                reRenderOnLangChange: true,
                prodMode            : false
            })
        },
        {
            // Provide the default Transloco loader
            provide : TRANSLOCO_LOADER,
            useClass: TranslocoHttpLoader
        },
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide   : APP_INITIALIZER,
            deps      : [TranslocoService],
            useFactory: (translocoService: TranslocoService): any => (): Promise<Translation> => {
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);
                return translocoService.load(defaultLang).toPromise();
            },
            multi     : true
        }
    ]
})
export class TranslocoCoreModule
{
}
