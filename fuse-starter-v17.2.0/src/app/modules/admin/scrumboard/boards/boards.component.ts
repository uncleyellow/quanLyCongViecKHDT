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
import { FormBuilder, FormGroup } from '@angular/forms';

// Interface for grouped boards by staff
interface BoardGroup {
    staffId: string;
    staffName: string;
    staffEmail: string;
    staffRole: string;
    isCurrentUser: boolean;
    boards: Board[];
    collapsed?: boolean;
}

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
    boardGroups: BoardGroup[] = [];
    currentUser: any = null;
    isManagerOrBoss: boolean = false;

    // Filter properties
    filterForm: FormGroup;
    allBoards: Board[] = []; // Store all boards before filtering
    filteredBoards: Board[] = []; // Store filtered boards
    filteredBoardGroups: BoardGroup[] = []; // Store filtered board groups

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _scrumboardService: ScrumboardService,
        private _userService: UserService,
        private dialog: MatDialog,
        private _formBuilder: FormBuilder
    )
    {
        // Initialize filter form
        this.filterForm = this._formBuilder.group({
            fromDate: [null],
            toDate: [null],
            taskType: ['all'] // 'all', 'daily', 'adhoc'
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to filter changes
        this.filterForm.valueChanges.pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe(() => {
            this.applyFilters();
        });

        // Get current user info
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe(user => {
            console.log('UserService user:', user);
            this.currentUser = user;
            this.isManagerOrBoss = user?.type === 'manager' || user?.type === 'boss';
            console.log('isManagerOrBoss:', this.isManagerOrBoss, 'user type:', user?.type);
            
            const userStr = localStorage.getItem('user');
            let email = '';
            if (userStr) {
                const user = JSON.parse(userStr);
                email = user.email;
                console.log('LocalStorage user:', user);
                // Fallback: if UserService doesn't have user, use localStorage
                if (!this.currentUser) {
                    this.currentUser = user;
                    this.isManagerOrBoss = user?.type === 'manager' || user?.type === 'boss';
                    console.log('Using localStorage user, isManagerOrBoss:', this.isManagerOrBoss);
                }
            }
            this.fetch(email);
        });
    }

    /**
     * Apply filters to boards
     */
    private applyFilters(): void {
        if (!this.allBoards) {
            this.filteredBoards = [];
            this.filteredBoardGroups = [];
            return;
        }

        const { fromDate, toDate, taskType } = this.filterForm.value;

        this.filteredBoards = this.allBoards.filter(board => {
            // Date filter
            if (fromDate || toDate) {
                // Use createdAt if available, otherwise fallback to lastActivity
                const boardDate = board.createdAt || board.lastActivity || '';
                if (!boardDate) return true; // If no date available, include the board
                
                try {
                    const boardCreatedAt = new Date(boardDate);
                    const from = fromDate ? new Date(fromDate) : null;
                    const to = toDate ? new Date(toDate) : null;

                    // Reset time to start of day for comparison
                    if (from) {
                        from.setHours(0, 0, 0, 0);
                    }
                    if (to) {
                        to.setHours(23, 59, 59, 999);
                    }
                    boardCreatedAt.setHours(0, 0, 0, 0);

                    if (from && boardCreatedAt < from) return false;
                    if (to && boardCreatedAt > to) return false;
                } catch (error) {
                    console.warn('Error parsing date for board:', board.title, error);
                    return true; // Include board if date parsing fails
                }
            }

            // Task type filter
            if (taskType !== 'all') {
                const isDailyTask = board.recurringConfig?.isRecurring === true;
                if (taskType === 'daily' && !isDailyTask) return false;
                if (taskType === 'adhoc' && isDailyTask) return false;
            }

            return true;
        });

        // Update board groups if manager/boss view
        if (this.isManagerOrBoss) {
            this.filteredBoardGroups = this.groupBoardsByStaff(this.filteredBoards);
        }

        // Update the displayed boards
        this.boards = this.filteredBoards;
        this.boardGroups = this.filteredBoardGroups;

        this._changeDetectorRef.markForCheck();
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this.filterForm.patchValue({
            fromDate: null,
            toDate: null,
            taskType: 'all'
        });
    }

    /**
     * Group boards by staff for manager/boss view
     */
    private groupBoardsByStaff(boards: Board[]): BoardGroup[]
    {
        console.log('groupBoardsByStaff called with boards:', boards?.length);
        console.log('currentUser:', this.currentUser);
        
        if (!boards || boards.length === 0) {
            return [];
        }

        // Group boards by owner
        const groupsMap = new Map<string, BoardGroup>();
        
        boards.forEach(board => {
            const ownerId = board.ownerId || 'unknown';
            const ownerName = board.ownerName || 'Unknown User';
            const ownerEmail = board.ownerEmail || '';
            const ownerRole = board.ownerRole || 'staff';
            const isCurrentUser = ownerId === this.currentUser?.id;
            
            console.log('Board:', board.title, 'ownerId:', ownerId, 'isCurrentUser:', isCurrentUser);
            
            if (!groupsMap.has(ownerId)) {
                groupsMap.set(ownerId, {
                    staffId: ownerId,
                    staffName: ownerName,
                    staffEmail: ownerEmail,
                    staffRole: ownerRole,
                    isCurrentUser: isCurrentUser,
                    boards: [],
                    collapsed: false
                });
            }
            
            const group = groupsMap.get(ownerId)!;
            group.boards.push(board);
        });

        // Convert map to array and sort (current user's boards first, then by name)
        const groups = Array.from(groupsMap.values()).sort((a, b) => {
            // Current user's boards come first
            if (a.isCurrentUser && !b.isCurrentUser) return -1;
            if (!a.isCurrentUser && b.isCurrentUser) return 1;
            
            // Then sort by staff name
            return a.staffName.localeCompare(b.staffName);
        });

        console.log('Created groups:', groups.length, groups.map(g => ({ name: g.staffName, boards: g.boards.length, isCurrent: g.isCurrentUser })));

        // Sort boards within each group by title
        groups.forEach(group => {
            group.boards.sort((a, b) => a.title.localeCompare(b.title));
        });

        return groups;
    }

    /**
     * Toggle collapse state of a board group
     */
    toggleBoardGroupCollapse(group: BoardGroup): void
    {
        group.collapsed = !group.collapsed;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for board groups
     */
    trackByGroupFn(index: number, item: BoardGroup): any
    {
        return item.staffId || index;
    }
    fetch(userEmail?: string) {
        // Gọi API lấy boards theo userEmail
        this._scrumboardService.getBoards(userEmail).subscribe(() => {
            // Sau khi lấy xong, subscribe vào boards$ để cập nhật UI
            this._scrumboardService.boards$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((boards: Board[]) => {
                    console.log('Fetched boards:', boards?.length);
                    console.log('isManagerOrBoss:', this.isManagerOrBoss);
                    
                    // Store all boards for filtering
                    this.allBoards = boards;
                    
                    // Apply filters to get filtered boards
                    this.applyFilters();
                    
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
                        },
                        recurringConfig: {
                            isRecurring: false,
                            completedListId: null
                        },
                        ownerId: user.id,
                        ownerName: user.name,
                        ownerEmail: user.email,
                        ownerRole: user.type || 'staff',
                        createdAt: null,
                        updatedAt: null
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
     * Get count of boards owned by current user
     */
    getMyBoardsCount(): number {
        if (!this.filteredBoards || !this.currentUser) {
            return 0;
        }
        return this.filteredBoards.filter(board => board.ownerId === this.currentUser.id).length;
    }

    /**
     * Get count of boards owned by employees (not current user)
     */
    getEmployeeBoardsCount(): number {
        if (!this.filteredBoards || !this.currentUser) {
            return 0;
        }
        return this.filteredBoards.filter(board => board.ownerId !== this.currentUser.id).length;
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
