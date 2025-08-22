import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ExampleComponent } from 'app/modules/admin/example/example.component';
import { UserSelectDemoComponent } from './user-select-demo/user-select-demo.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from '../../../shared/shared.module';

const exampleRoutes: Route[] = [
    {
        path     : '',
        component: ExampleComponent
    },
    {
        path     : 'user-select-demo',
        component: UserSelectDemoComponent
    }
];

@NgModule({
    declarations: [
        ExampleComponent,
        UserSelectDemoComponent
    ],
    imports     : [
        RouterModule.forChild(exampleRoutes),
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DragDropModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        NgApexchartsModule,
        SharedModule
    ]
})
export class ExampleModule
{
}
