import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_DATE_FORMATS, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatLuxonDateModule, MAT_LUXON_DATE_FORMATS } from '@angular/material-luxon-adapter';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { SharedModule } from 'app/shared/shared.module';
import { ScrumboardBoardAddCardComponent } from './board/add-card/add-card.component';
import { ScrumboardBoardAddListComponent } from './board/add-list/add-list.component';
import { ScrumboardBoardComponent } from './board/board.component';
import { ScrumboardBoardsComponent } from './boards/boards.component';
import { ScrumboardCardComponent } from './card/card.component';
import { ScrumboardCardDetailsComponent } from './card/details/details.component';
import { ScrumboardComponent } from './scrumboard.component';
import { scrumboardRoutes } from './scrumboard.routing';
import { AddBoardDialogComponent } from './boards/add-board-dialog.compoment';
import { ShareBoardDialogComponent } from './boards/share-board-dialog.compoment';
import { ViewConfigDialogComponent } from './board/view-config-dialog.component';
import { ChangeColorDialogComponent } from './board/change-color-dialog.component';
import { RecurringConfigDialogComponent } from './board/recurring-config-dialog.component';


@NgModule({
    declarations: [
        ScrumboardComponent,
        ScrumboardBoardsComponent,
        ScrumboardBoardComponent,
        ScrumboardBoardAddCardComponent,
        ScrumboardBoardAddListComponent,
        ScrumboardCardComponent,
        ScrumboardCardDetailsComponent,
        AddBoardDialogComponent,
        ShareBoardDialogComponent,
        ViewConfigDialogComponent,
        ChangeColorDialogComponent,
        RecurringConfigDialogComponent
    ],
    imports     : [
        RouterModule.forChild(scrumboardRoutes),
        DragDropModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatLuxonDateModule,
        MatMenuModule,
        MatProgressBarModule,
        MatSelectModule,
        SharedModule,
        MatOptionModule
    ],
    providers   : [
        {
            provide : MAT_DATE_FORMATS,
            useValue: MAT_LUXON_DATE_FORMATS
        }
    ]
})
export class ScrumboardModule
{
}
