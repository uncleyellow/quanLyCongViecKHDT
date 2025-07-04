import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Board } from './scrumboard.models';
import { ScrumboardService } from './scrumboard.service';
import { UserService } from 'app/core/user/user.service';

@Component({
    selector       : 'scrumboard',
    templateUrl    : './scrumboard.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrumboardComponent implements OnInit
{
    boards: Board[] = [];

    constructor(
        private _scrumboardService: ScrumboardService,
        private _userService: UserService
    ) {}

    ngOnInit(): void
    {
        this._userService.user$.subscribe(user => {
            if (user) {
                const email = user.email;
                this._scrumboardService.getBoards(email).subscribe(boards => {
                    this.boards = boards;
                });
            }
        });
    }
}
