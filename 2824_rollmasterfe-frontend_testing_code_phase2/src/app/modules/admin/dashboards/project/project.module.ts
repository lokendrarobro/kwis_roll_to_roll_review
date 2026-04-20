import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule,MatNativeDateModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@ngneat/transloco';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'app/shared/shared.module';
import { ProjectComponent } from 'app/modules/admin/dashboards/project/project.component';
import { projectRoutes } from 'app/modules/admin/dashboards/project/project.routing';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { DatePipe } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxDaterangepickerBootstrapModule, NgxDaterangepickerLocaleService } from 'ngx-daterangepicker-bootstrap';
@NgModule({
    declarations: [
        ProjectComponent
    ],
    imports     : [
        RouterModule.forChild(projectRoutes),
        MatButtonModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatButtonToggleModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatRippleModule,
        MatSidenavModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        DataTablesModule,
        NgApexchartsModule,
        TranslocoModule,
        SharedModule,
        MatToolbarModule,
        NgxDaterangepickerBootstrapModule.forRoot(),
        NgxDaterangepickerMd.forRoot(),
        NgMultiSelectDropDownModule.forRoot()
    ],providers: [DatePipe, NgxDaterangepickerLocaleService],
})
export class ProjectModule
{
}
