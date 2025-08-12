import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_FORMATS, MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatLuxonDateModule, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { tasksRoutes } from 'app/modules/admin/tasks/tasks.routing';
import { TasksComponent } from 'app/modules/admin/tasks/tasks.component';
import { TasksDetailsComponent } from './details/details.component';
import { TasksListComponent } from './list/list.component';
import { CustomFieldDialogComponent } from './details/custom-field-dialog/custom-field-dialog.component';



@NgModule({
    declarations: [
        TasksComponent,
        TasksDetailsComponent,
        TasksListComponent
    ],
    imports     : [
        RouterModule.forChild(tasksRoutes),
        FormsModule,
        DragDropModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatDialogModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatLuxonDateModule,
        MatMenuModule,
        MatNativeDateModule,
        MatProgressBarModule,
        MatRadioModule,
        MatRippleModule,
        MatSelectModule,
        MatSidenavModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        SharedModule,
        CustomFieldDialogComponent
    ],
    providers   : [
        {
            provide : MAT_DATE_FORMATS,
            useValue: MAT_LUXON_DATE_FORMATS
        }
    ]
})
export class TasksModule
{
}
