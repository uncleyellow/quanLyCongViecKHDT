import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil, take } from 'rxjs';
import { DateTime } from 'luxon';
import { Board } from 'app/modules/admin/scrumboard/scrumboard.models';
import { ScrumboardService } from 'app/modules/admin/scrumboard/scrumboard.service';
import { UserService } from 'app/core/user/user.service';
import { MatDialog } from '@angular/material/dialog';
import { AddBoardDialogComponent } from './add-board-dialog.compoment';
import { ShareBoardDialogComponent } from './share-board-dialog.compoment';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector       : 'scrumboard-boards',
    templateUrl    : './boards.component.html',
    styleUrls      : ['./boards.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrumboardBoardsComponent implements OnInit, OnDestroy
{
    boards: Board[];

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _scrumboardService: ScrumboardService,
        private _userService: UserService,
        private dialog: MatDialog
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        const userStr = localStorage.getItem('user');
        let email = '';
        if (userStr) {
            const user = JSON.parse(userStr);
            email = user.email;
        }
        this.fetch(email);
    }
    fetch(userEmail?: string) {
        // Gọi API lấy boards theo userEmail
        this._scrumboardService.getBoards(userEmail).subscribe(() => {
            // Sau khi lấy xong, subscribe vào boards$ để cập nhật UI
            this._scrumboardService.boards$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((boards: Board[]) => {
                    this.boards = boards;
                    this._changeDetectorRef.markForCheck();
                });
        });
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Format the given ISO_8601 date as a relative date
     *
     * @param date
     */
    formatDateAsRelative(date: string): string
    {
        return DateTime.fromISO(date).toRelative();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    createNewBoard() {
        this._userService.user$.pipe(take(1)).subscribe(user => {
            const dialogRef = this.dialog.open(AddBoardDialogComponent, {
                width: '400px'
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result && user) {
                    this._scrumboardService.createBoard({
                        id: null,
                        title: result.title,
                        description: result.description,
                        icon: result.icon,
                        lastActivity: null,
                        lists: [],
                        labels: [],
                        members: [],
                        viewConfig: {
                            showTitle: true,
                            showDescription: true,
                            showDueDate: true,
                            showMembers: true,
                            showLabels: true,
                            showChecklist: true,
                            showStatus: true,
                            showType: true
                        }
                    }, user.email).subscribe((newBoard) => {
                        if(newBoard){
                            this.fetch(user.email);
                        }
                        // Thêm trực tiếp vào danh sách để hiển thị ngay
                        // this.boards = [newBoard, ...(this.boards || [])];
                        // this._changeDetectorRef.markForCheck();
                        // Nếu muốn đồng bộ hoàn toàn với backend, gọi lại fetch:

                        this.fetch(user.email);
                    });
                }
            });
        });
    }

    openShareDialog(board: Board) {
        const dialogRef = this.dialog.open(ShareBoardDialogComponent, { width: '400px' });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.memberId) {
                    // Nếu chọn member từ danh sách
                    const member = this._scrumboardService.getMembers().subscribe(members => {
                        const selectedMember = members.find(m => m.id === result.memberId);
                        if (selectedMember) {
                            this.addMemberToBoard(board, selectedMember);
                        }
                    });
                } else if (result.email) {
                    // Nếu nhập email
                    this._scrumboardService.getMemberByEmail(result.email).subscribe(member => {
                        if (member && member.id) {
                            this.addMemberToBoard(board, member);
                        }
                    });
                }
            }
        });
    }

    private addMemberToBoard(board: Board, member: any) {
        // Thêm member vào board (FE tự xử lý)
        if (!board.members) {
            board.members = [];
        }
        const existingMember = board.members.find(m => m.id === member.id);
        if (!existingMember) {
            board.members.push(member);
            // Cập nhật UI
            this._changeDetectorRef.markForCheck();
        }
        // Gọi service mock để thông báo thành công
        this._scrumboardService.addMemberToBoard(board.id, member.id).subscribe(() => {
            // Thông báo thành công
            console.log('Member added to board successfully');
        });
    }

    /**
     * Board dropped
     *
     * @param event
     */
    boardDropped(event: CdkDragDrop<Board[]>): void {
        // Move the item
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

        // Update board order in backend
        const boardIds = event.container.data.map(board => board.id);
        this._scrumboardService.updateBoardOrder(boardIds).subscribe(() => {
            // Refresh the boards list
            const userStr = localStorage.getItem('user');
            let email = '';
            if (userStr) {
                const user = JSON.parse(userStr);
                email = user.email;
            }
            this.fetch(email);
        });
    }
}
