import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ScrumboardService } from 'app/modules/admin/scrumboard/scrumboard.service';
import { Board, Card, CreateCard, CreateList, List, Member, UpdateList } from 'app/modules/admin/scrumboard/scrumboard.models';
import { ViewConfig, RecurringConfig } from 'app/modules/admin/scrumboard/scrumboard.types';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    board: Board = new Board({
        id: '',
        title: '',
        description: '',
        icon: '',
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
        },
        recurringConfig: {
            isRecurring: false,
            completedListId: null
        },
        isAssigned: false
    });
    listTitleForm: UntypedFormGroup;
    members: Member[] = [];

    // Search and Filter properties
    searchTerm: string = '';
    showFilterPanel: boolean = false;
    filters: any[] = [];
    availableFields: any[] = [
        { key: 'title', label: 'Tiêu đề', type: 'string' },
        { key: 'description', label: 'Mô tả', type: 'string' },
        { key: 'dueDate', label: 'Ngày hết hạn', type: 'date' },
        { key: 'status', label: 'Trạng thái', type: 'select', options: [
            { value: 'todo', label: 'Chưa làm' },
            { value: 'in-progress', label: 'Đang làm' },
            { value: 'done', label: 'Hoàn thành' }
        ] },
        { key: 'type', label: 'Loại', type: 'select', options: [
            { value: 'task', label: 'Công việc' },
            { value: 'section', label: 'Phần' }
        ] }
    ];

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
        private _matDialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the board
        this._scrumboardService.board$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((board) => {
                this.board = board;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Lấy danh sách members từ mock data
        this._scrumboardService.getMembers().subscribe(members => {
            this.members = members;
            this._changeDetectorRef.markForCheck();
        });

        // Initialize the list title form
        this.listTitleForm = this._formBuilder.group({
            title: ['']
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
                },
                recurringConfig: this.board?.recurringConfig || {
                    isRecurring: false,
                    completedListId: null
                },
                isAssigned: this.board?.isAssigned || false,
                lists: this.board?.lists || []
            },
            width: '600px',
            maxHeight: '80vh'
        });

        dialogRef.afterClosed().subscribe((result: { viewConfig: ViewConfig; recurringConfig: RecurringConfig; isAssigned: boolean }) => {
            if (result && this.board) {
                // Update all configs in sequence to avoid conflicts
                this._scrumboardService.updateBoardViewConfig(this.board.id, result.viewConfig).subscribe((updatedBoard) => {
                    this.board = updatedBoard;
                    this._changeDetectorRef.markForCheck();
                    
                    // Update recurring config after view config
                    this._scrumboardService.updateBoardRecurringConfig(this.board.id, result.recurringConfig).subscribe((updatedBoard2) => {
                        this.board = updatedBoard2;
                        this._changeDetectorRef.markForCheck();
                        
                        // Update assigned config after recurring config
                        this._scrumboardService.updateBoardAssignedConfig(this.board.id, result.isAssigned).subscribe((updatedBoard3) => {
                            this.board = updatedBoard3;
                            this._changeDetectorRef.markForCheck();
                        });
                    });
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

            // Get the moved card
            const movedCard = event.container.data[event.currentIndex];
            const newListId = event.container.id;
            const previousListId = event.previousContainer.id;

            // Update the card's list id
            movedCard.listId = newListId;

            // Check if the new list is the completed list in recurring config
            if (this.board.recurringConfig?.isRecurring && 
                this.board.recurringConfig?.completedListId === newListId) {
                // Update status to "done" when moved to completed list
                movedCard.status = 'done';
            }

            // Update the card via API
            this._scrumboardService.updateCard(movedCard.id, movedCard).subscribe({
                next: () => {
                    // After updating the card, reorder cards in both lists
                    const newListCardIds = event.container.data.map(card => card.id);
                    const previousListCardIds = event.previousContainer.data.map(card => card.id);
                    
                    // Reorder cards in the new list
                    this._scrumboardService.reorderCards(newListId, newListCardIds).subscribe({
                        next: () => {
                            // Reorder cards in the previous list
                            this._scrumboardService.reorderCards(previousListId, previousListCardIds).subscribe({
                                next: () => {
                                    this.reloadBoard();
                                },
                                error: (error) => {
                                    console.error('Error reordering cards in previous list:', error);
                                    this.reloadBoard();
                                }
                            });
                        },
                        error: (error) => {
                            console.error('Error reordering cards in new list:', error);
                            this.reloadBoard();
                        }
                    });
                },
                error: (error) => {
                    console.error('Error updating card:', error);
                    this.reloadBoard();
                }
            });
        }

        // If it's just reordering within the same list
        if (event.previousContainer === event.container) {
            const cardIds = event.container.data.map(card => card.id);
            this._scrumboardService.reorderCards(event.container.id, cardIds).subscribe({
                next: () => {
                    this.reloadBoard();
                },
                error: (error) => {
                    console.error('Error reordering cards within same list:', error);
                    this.reloadBoard();
                }
            });
        }
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

    /**
     * Refresh recurring board - duplicate cards with today's deadline
     */
    refreshRecurringBoard(): void {
        if (!this.board.recurringConfig?.isRecurring) {
            return;
        }

        // Show loading message
        this.snackBar.open('Đang làm mới công việc...', 'Đóng', {
            duration: 2000
        });

        // Get today's date in proper format for backend
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        console.log('Today date string:', todayString);
        
        // Get all cards from all lists in the board
        const allCards = this.board.lists.flatMap(list => list.cards);
        
        if (allCards.length === 0) {
            this.snackBar.open('Không có công việc nào để làm mới', 'Đóng', {
                duration: 3000
            });
            return;
        }

        // Create new cards without dueDate first
        const newCardsObservables = allCards.map(card => {
            const newCard = {
                boardId: this.board.id,
                listId: card.listId,
                title: card.title,
                type: card.type,
                status: card.status
                // Remove dueDate to avoid format issues
            };
            
            console.log('Creating card with data:', newCard);
            return this._scrumboardService.createCard(card.listId, newCard);
        });

        // Execute all card creation observables
        const allObservables = newCardsObservables.map(obs => firstValueFrom(obs));
        
        Promise.all(allObservables)
            .then((createdCards) => {
                console.log('Created cards:', createdCards);
                
                // Filter out cards with null or undefined ids
                const validCards = createdCards.filter(card => card && card.id);
                
                if (validCards.length === 0) {
                    this.snackBar.open('Không thể tạo card mới', 'Đóng', {
                        duration: 3000
                    });
                    return;
                }

                // Update dueDate for all created cards
                const updateObservables = validCards.map(card => {
                    console.log('Updating card:', card.id, 'with dueDate:', todayString);
                    
                    const updatedCard = new Card({
                        ...card,
                        dueDate: todayString
                    });
                    return this._scrumboardService.updateCard(card.id, updatedCard);
                });

                const updatePromises = updateObservables.map(obs => firstValueFrom(obs));
                
                return Promise.all(updatePromises);
            })
            .then(() => {
                this.snackBar.open('Đã làm mới công việc thành công!', 'Đóng', {
                    duration: 3000
                });
                
                // Reload board to show updated data
                this.reloadBoard();
            })
            .catch(error => {
                console.error('Error refreshing recurring board:', error);
                this.snackBar.open('Có lỗi xảy ra khi làm mới công việc', 'Đóng', {
                    duration: 3000
                });
            });
    }

    /**
     * Refresh assigned board - reload to get latest assigned tasks
     */
    refreshAssignedBoard(): void {
        if (!this.board.isAssigned) {
            return;
        }

        // Show loading message
        this.snackBar.open('Đang làm mới công việc được giao...', 'Đóng', {
            duration: 2000
        });

        // Reload board to get latest assigned tasks
        this.reloadBoard();
        
        this.snackBar.open('Đã làm mới công việc được giao thành công!', 'Đóng', {
            duration: 3000
        });
    }

    /**
     * Export board data to Excel
     */
    exportToExcel(): void {
        if (!this.board || !this.board.lists) {
            this.snackBar.open('Không có dữ liệu để xuất', 'Đóng', {
                duration: 3000
            });
            return;
        }

        // Prepare data for CSV
        const csvData = [];
        
        // Add header row
        csvData.push([
            'Danh sách',
            'Tiêu đề',
            'Mô tả',
            'Trạng thái',
            'Loại',
            'Deadline',
            'Thành viên',
            'Nhãn',
            'Checklist'
        ].join(','));

        // Add data rows
        this.board.lists.forEach(list => {
            list.cards.forEach(card => {
                const checklistText = card.checklistItems && card.checklistItems.length > 0 
                    ? card.checklistItems.map(item => `${item.text} (${item.checked ? 'Hoàn thành' : 'Chưa hoàn thành'})`).join('; ')
                    : '';

                const labelsText = card.labels && Array.isArray(card.labels) && card.labels.length > 0 
                    ? card.labels.map(label => label.title).join(', ')
                    : '';

                const membersText = card.members && Array.isArray(card.members) && card.members.length > 0 
                    ? card.members.map(member => member.name).join(', ')
                    : '';

                const row = [
                    `"${list.title}"`,
                    `"${card.title}"`,
                    `"${card.description || ''}"`,
                    `"${card.status || ''}"`,
                    `"${card.type || ''}"`,
                    `"${card.dueDate ? new Date(card.dueDate).toLocaleDateString('vi-VN') : ''}"`,
                    `"${membersText}"`,
                    `"${labelsText}"`,
                    `"${checklistText}"`
                ].join(',');

                csvData.push(row);
            });
        });

        // Create CSV content
        const csvContent = csvData.join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Generate filename with current date
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `${this.board.title}_${dateStr}.csv`;

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        this.snackBar.open('Đã xuất dữ liệu thành công!', 'Đóng', {
            duration: 3000
        });
    }

    /**
     * Toggle filter panel
     */
    toggleFilterPanel(): void {
        this.showFilterPanel = !this.showFilterPanel;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Search methods
     */
    onSearchChange(term: string): void {
        this.searchTerm = term;
        this.loadCardsWithFilters();
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.loadCardsWithFilters();
    }

    /**
     * Filter methods
     */
    addFilter(): void {
        const newFilter = {
            id: Date.now().toString(),
            field: '',
            operator: '',
            value: ''
        };
        this.filters.push(newFilter);
        this._changeDetectorRef.markForCheck();
    }

    removeFilter(filterId: string): void {
        this.filters = this.filters.filter(f => f.id !== filterId);
        this.onFilterChange();
    }

    clearAllFilters(): void {
        this.filters = [];
        this.onFilterChange();
    }

    onFilterChange(): void {
        this.loadCardsWithFilters();
    }

    /**
     * Load cards with search and filters
     */
    private loadCardsWithFilters(): void {
        const options: any = {};
        
        // Add search term
        if (this.searchTerm && this.searchTerm.trim()) {
            options.search = this.searchTerm.trim();
        }
        
        // Add filters
        const validFilters = this.filters.filter(f => f.field && f.operator && f.value !== undefined && f.value !== '');
        if (validFilters.length > 0) {
            // Process date values for date fields
            const processedFilters = validFilters.map(filter => {
                if (filter.field === 'dueDate' && filter.value instanceof Date) {
                    const year = filter.value.getFullYear();
                    const month = String(filter.value.getMonth() + 1).padStart(2, '0');
                    const day = String(filter.value.getDate()).padStart(2, '0');
                    const localDateString = `${year}-${month}-${day}`;
                    
                    return {
                        ...filter,
                        value: localDateString
                    };
                }
                return filter;
            });
            options.filters = processedFilters;
        }

        // Call backend API to get filtered data
        this._scrumboardService.getFilteredBoard(this.board.id, options).subscribe({
            next: (filteredBoard) => {
                this.board = filteredBoard;
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error applying filters:', error);
                this.snackBar.open('Có lỗi xảy ra khi áp dụng bộ lọc', 'Đóng', {
                    duration: 3000
                });
            }
        });
    }

    /**
     * Get filtered cards count
     */
    getFilteredCardsCount(): number {
        if (!this.board || !this.board.lists) return 0;
        return this.board.lists.reduce((total, list) => total + (list.cards ? list.cards.length : 0), 0);
    }

    /**
     * Helper methods for filter configuration
     */
    getFieldConfig(fieldKey: string): any {
        return this.availableFields.find(field => field.key === fieldKey);
    }

    getOperatorsForFieldType(fieldType: string): any[] {
        const operators = {
            string: [
                { value: 'contains', label: 'Chứa' },
                { value: 'equals', label: 'Bằng' },
                { value: 'starts_with', label: 'Bắt đầu bằng' },
                { value: 'ends_with', label: 'Kết thúc bằng' }
            ],
            date: [
                { value: 'equals', label: 'Bằng' },
                { value: 'greater_than', label: 'Lớn hơn' },
                { value: 'less_than', label: 'Nhỏ hơn' },
                { value: 'greater_than_or_equal', label: 'Lớn hơn hoặc bằng' },
                { value: 'less_than_or_equal', label: 'Nhỏ hơn hoặc bằng' }
            ],
            select: [
                { value: 'equals', label: 'Bằng' },
                { value: 'not_equals', label: 'Không bằng' }
            ]
        };
        return operators[fieldType] || operators.string;
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