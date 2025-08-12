import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { AdminConfigComponent } from './admin-config.component';
import { SettingsAccountComponent } from './account/account.component';

const calenderEventsRoutes: Route[] = [
    {
        path     : '',
        component: AdminConfigComponent
    }
];

@NgModule({
    declarations: [
        AdminConfigComponent,
        SettingsAccountComponent,
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
        ReactiveFormsModule
    ]
})
export class AdminConfigModule
{
} 