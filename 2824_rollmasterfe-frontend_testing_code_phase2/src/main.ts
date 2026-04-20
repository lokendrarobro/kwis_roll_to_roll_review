// main.ts

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from 'app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {
    console.log('✅ Angular bootstrapped and initialization complete.');
  })
  .catch(err => console.error('Bootstrap error:', err));
