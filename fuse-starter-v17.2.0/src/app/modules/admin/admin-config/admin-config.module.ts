import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminConfigComponent } from './admin-config.component';
import { SettingsDepartmentsComponent } from './departments/departments.component';
import { CompanyDialogComponent } from './departments/company-dialog/company-dialog.component';
import { DepartmentDialogComponent } from './departments/department-dialog/department-dialog.component';

const calenderEventsRoutes: Route[] = [
    {
        path     : '',
        component: AdminConfigComponent
    }
];

@NgModule({
    declarations: [
        AdminConfigComponent,
        SettingsDepartmentsComponent,
        CompanyDialogComponent,
        DepartmentDialogComponent,
    ],
    imports     : [
        RouterModule.forChild(calenderEventsRoutes),
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        MatCheckboxModule,
        MatChipsModule,
        MatMenuModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatSidenavModule,
        MatTabsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatProgressBarModule,
        MatSlideToggleModule,
        HttpClientModule,
        ReactiveFormsModule
    ]
})
export class AdminConfigModule
{
} 