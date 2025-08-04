import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { DateTime } from 'luxon';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ScrumboardService } from 'app/modules/admin/scrumboard/scrumboard.service';
import { Board, Card, CreateCard, CreateList, List, Member, UpdateList } from 'app/modules/admin/scrumboard/scrumboard.models';
import { ViewConfig } from 'app/modules/admin/scrumboard/scrumboard.types';
import { MatDialog } from '@angular/material/dialog';
import { ViewConfigDialogComponent } from './view-config-dialog.component';
import { ChangeColorDialogComponent } from './change-color-dialog.component';

@Component({
    selector: 'scrumboard-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrumboardBoardComponent implements OnInit, OnDestroy {
    board: Board;
    listTitleForm: UntypedFormGroup;
    members: Member[] = [];

    // Private
    private readonly _positionStep: number = 65536;
    private readonly _maxListCount: number = 200;
    private readonly _maxPosition: number = this._positionStep * 500;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _scrumboardService: ScrumboardService,
        private _matDialog: MatDialog
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Lấy danh sách members từ mock data
        this._scrumboardService.getMembers().subscribe(members => {
            this.members = members;
            this._changeDetectorRef.markForCheck();
        });

        // Initialize the list title form
        this.listTitleForm = this._formBuilder.group({
            title: ['']
        });

        // Get the board
        this._scrumboardService.board$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((board: Board) => {
                this.board = { ...board };

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Open view config dialog
     */
    openViewConfigDialog(): void {
        const dialogRef = this._matDialog.open(ViewConfigDialogComponent, {
            data: {
                viewConfig: this.board?.viewConfig || {
                    showTitle: true,
                    showDescription: true,
                    showDueDate: true,
                    showMembers: true,
                    showLabels: true,
                    showChecklist: true,
                    showStatus: true,
                    showType: true
                }
            },
            width: '500px',
            maxHeight: '80vh'
        });

        dialogRef.afterClosed().subscribe((result: ViewConfig) => {
            if (result && this.board) {
                this._scrumboardService.updateBoardViewConfig(this.board.id, result).subscribe((updatedBoard) => {
                    // Update the board with the complete data returned from backend
                    this.board = updatedBoard;
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
    }

    /**
     * Focus on the given element to start editing the list title
     *
     * @param listTitleInput
     */
    renameList(listTitleInput: HTMLElement): void {
        // Use timeout so it can wait for menu to close
        setTimeout(() => {
            listTitleInput.focus();
        });
    }

    /**
     * Add new list
     *
     * @param data
     */
    addList(data: {title: string, color: string}): void {
        // Limit the max list count
        if (this.board.lists.length >= this._maxListCount) {
            return;
        }

        // Create a new list model
        const newList = new CreateList({
            boardId: this.board.id,
            title: data.title,
            color: data.color
        });


        // Save the list
        this._scrumboardService.createList(this.board.id, newList).subscribe(() => {
            this.reloadBoard();
        });
    }

    /**
     * Update the list title
     *
     * @param event
     * @param list
     */
    updateListTitle(event: any, list: List): void {
        // Get the target element
        const element: HTMLInputElement = event.target;

        // Get the new title
        const newTitle = element.value;

        // If the title is empty...
        if (!newTitle || newTitle.trim() === '') {
            // Reset to original title and return
            element.value = list.title;
            return;
        }

        // Update the list title and element value
        list.title = element.value = newTitle.trim();

        const updateList = new UpdateList({
            boardId: list.boardId,
            title: newTitle.trim(),
            archived: list.archived,
            cardOrderIds: list.cardOrderIds
        })

        // Update the list
        this._scrumboardService.updateList(list.id, updateList).subscribe(() => {
            this.reloadBoard();
        });
    }

    /**
     * Change list color
     *
     * @param list
     */
    changeListColor(list: List): void {
        const dialogRef = this._matDialog.open(ChangeColorDialogComponent, {
            data: {
                currentColor: list.color,
                listTitle: list.title
            },
            width: '500px',
            maxHeight: '80vh'
        });

        dialogRef.afterClosed().subscribe((newColor: string) => {
            if (newColor && newColor !== list.color) {
                const updateList = new UpdateList({
                    boardId: list.boardId,
                    title: list.title,
                    color: newColor,
                    archived: list.archived,
                    cardOrderIds: list.cardOrderIds
                });

                // Update the list
                this._scrumboardService.updateList(list.id, updateList).subscribe(() => {
                    this.reloadBoard();
                });
            }
        });
    }

    /**
     * Delete the list
     *
     * @param id
     */
    deleteList(id): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete list',
            message: 'Are you sure you want to delete this list and its cards? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if (result === 'confirmed') {

                // Delete the list
                this._scrumboardService.deleteList(id).subscribe(() => {
                    this.reloadBoard();
                });
            }
        });
    }

    /**
     * Add new card
     */
    addCard(list: List, title: string): void {
        // Create a new card model
        const card = new CreateCard({
            boardId: this.board.id,
            listId: list.id,
            title: title
        });

        // Save the card
        this._scrumboardService.createCard(list.id, card).subscribe(() => {
            this.reloadBoard();
        });
    }

    /**
     * List dropped
     *
     * @param event
     */
    listDropped(event: CdkDragDrop<List[]>): void {
        // Move the item
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

        // Sử dụng API reorder mới thay vì update từng list
        const listIds = event.container.data.map(list => list.id);
        this._scrumboardService.reorderLists(this.board.id, listIds).subscribe(() => {
            this.reloadBoard();
        });
    }

    /**
     * Card dropped
     *
     * @param event
     */
    cardDropped(event: CdkDragDrop<Card[]>): void {
        // Move or transfer the item
        if (event.previousContainer === event.container) {
            // Move the item
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        }
        else {
            // Transfer the item
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

            // Update the card's list id
            event.container.data[event.currentIndex].listId = event.container.id;
        }

        // Sử dụng API reorder mới thay vì update từng card
        const cardIds = event.container.data.map(card => card.id);
        this._scrumboardService.reorderCards(event.container.id, cardIds).subscribe(() => {
            this.reloadBoard();
        });
    }

    /**
     * Check if the given ISO_8601 date string is overdue
     *
     * @param date
     */
    isOverdue(date: string): boolean {
        return DateTime.fromISO(date).startOf('day') < DateTime.now().startOf('day');
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Get member avatar by member id
     *
     * @param memberId
     */
    getMemberAvatar(memberId: string): string {
        const member = this.members.find(m => m.id === memberId);
        return member ? member.avatar : 'assets/images/avatars/default.jpg';
    }

    /**
     * Get member name by member id
     *
     * @param memberId
     */
    getMemberName(memberId: string): string {
        const member = this.members.find(m => m.id === memberId);
        return member ? member.name : 'Unknown';
    }

    /**
     * Get checklist progress string
     *
     * @param card
     */
    getChecklistProgress(card: Card): string {
        if (!card.checklistItems || card.checklistItems.length === 0) {
            return '';
        }
        const completed = card.checklistItems.filter(item => item.checked).length;
        return `${completed}/${card.checklistItems.length}`;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Calculate and set item positions
     * from given CdkDragDrop event
     *
     * @param event
     * @private
     */
    private _calculatePositions(event: CdkDragDrop<any[]>): any[] {
        // Get the items
        let items = event.container.data;
        const currentItem = items[event.currentIndex];
        const prevItem = items[event.currentIndex - 1] || null;
        const nextItem = items[event.currentIndex + 1] || null;

        // If the item moved to the top...
        if (!prevItem) {
            // If the item moved to an empty container
            if (!nextItem) {
                currentItem.position = this._positionStep;
            }
            else {
                currentItem.position = nextItem.position / 2;
            }
        }
        // If the item moved to the bottom...
        else if (!nextItem) {
            currentItem.position = prevItem.position + this._positionStep;
        }
        // If the item moved in between other items...
        else {
            currentItem.position = (prevItem.position + nextItem.position) / 2;
        }

        // Check if all item positions need to be updated
        if (!Number.isInteger(currentItem.position) || currentItem.position >= this._maxPosition) {
            // Re-calculate all orders
            items = items.map((value, index) => {
                value.position = (index + 1) * this._positionStep;
                return value;
            });

            // Return items
            return items;
        }

        // Return currentItem
        return [currentItem];
    }

    private reloadBoard(): void {
        this._scrumboardService.getBoard(this.board.id).subscribe(board => {
            this.board = board;
            this._changeDetectorRef.markForCheck();
        });
    }
}
