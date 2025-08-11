import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDrawer } from '@angular/material/sidenav';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Tag, Task, UserCard } from 'app/modules/admin/tasks/tasks.types';
import { TasksService } from 'app/modules/admin/tasks/tasks.service';

// Interface for grouped tasks
interface BoardGroup {
    boardId: string;
    boardTitle: string;
    cards: UserCard[];
    collapsed?: boolean;
}

@Component({
    selector       : 'tasks-list',
    templateUrl    : './list.component.html',
    styleUrls      : ['./list.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('slideInOut', [
            state('expanded', style({
                height: '*',
                opacity: 1,
                overflow: 'visible'
            })),
            state('collapsed', style({
                height: '0px',
                opacity: 0,
                overflow: 'hidden'
            })),
            transition('collapsed <=> expanded', [
                animate('300ms ease-in-out')
            ])
        ])
    ]
})
export class TasksListComponent implements OnInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    drawerMode: 'side' | 'over';
    selectedTask: Task;
    tags: Tag[];
    tasks: Task[];
    userCards: UserCard[];
    boardGroups: BoardGroup[] = [];
    isReordering: boolean = false;
    tasksCount: any = {
        completed : 0,
        incomplete: 0,
        total     : 0
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _tasksService: TasksService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService
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
        // Get the tags
        this._tasksService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tags: Tag[]) => {
                this.tags = tags;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the user cards
        this._tasksService.getUserCards()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((userCards: UserCard[]) => {
                this.userCards = userCards;
                this.boardGroups = this.groupTasksByBoard(userCards);

                // Update the counts based on user cards
                this.updateTasksCount();

                // Mark for check
                this._changeDetectorRef.markForCheck();

                // Update the count on the navigation
                this.updateNavigationCount();
            });

        // Subscribe to user cards changes
        this._tasksService.userCards$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((userCards: UserCard[]) => {
                if (userCards) {
                    this.userCards = userCards;
                    this.boardGroups = this.groupTasksByBoard(userCards);
                    this.updateTasksCount();
                    this.updateNavigationCount();
                    this._changeDetectorRef.markForCheck();
                }
            });

        // Get the tasks (keep for compatibility)
        this._tasksService.tasks$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tasks: Task[]) => {
                this.tasks = tasks;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the task
        this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((task: Task) => {
                this.selectedTask = task;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to media query change
        this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((state) => {

                // Calculate the drawer mode
                this.drawerMode = state.matches ? 'side' : 'over';

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/' || event.key === '.') // '/' or '.' key
                )
            )
            .subscribe((event: KeyboardEvent) => {

                // If the '/' pressed
                if ( event.key === '/' )
                {
                    this.createTask('task');
                }

                // If the '.' pressed
                if ( event.key === '.' )
                {
                    this.createTask('section');
                }
            });

        // Add scroll event listener for sticky header shadow
        this.setupScrollListener();
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
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create task
     *
     * @param type
     */
    createTask(type: 'task' | 'section'): void
    {
        // Create the task
        this._tasksService.createTask(type).subscribe((newTask) => {

            // Go to the new task
            this._router.navigate(['./', newTask.id], {relativeTo: this._activatedRoute});

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Toggle the completed status
     * of the given task
     *
     * @param task
     */
    toggleCompleted(task: Task): void
    {
        // Toggle the completed status
        task.completed = !task.completed;

        // Update the task on the server
        this._tasksService.updateTask(task.id, task).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Task dropped
     *
     * @param event
     */
    dropped(event: CdkDragDrop<UserCard[]>): void
    {
        // Set reordering state
        this.isReordering = true;

        // Move the item in the array
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

        // Extract card IDs in the new order from all groups
        const allCardOrderIds = this.boardGroups.flatMap(group => group.cards.map(card => card.id));

        // Save the new order
        this._tasksService.updateCardsOrder(allCardOrderIds).subscribe({
            next: () => {
                // Update counts after successful reorder
                this.updateTasksCount();
                
                // Reset reordering state
                this.isReordering = false;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Failed to update cards order:', error);
                
                // Revert the order if update failed
                moveItemInArray(event.container.data, event.currentIndex, event.previousIndex);
                
                // Reset reordering state
                this.isReordering = false;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Refresh cards list
     */
    refreshCards(): void
    {
        this._tasksService.getUserCards().subscribe();
    }

    /**
     * Toggle the completed status of the given card
     *
     * @param card
     */
    toggleCardCompleted(card: UserCard): void
    {
        // Toggle the completed status
        const newStatus = (card.status === 'completed' || card.status === 'done') ? 'todo' : 'completed';
        
        // Update the card status locally for immediate UI feedback
        const originalStatus = card.status;
        card.status = newStatus;

        // Update the card on the server
        this._tasksService.updateCardStatus(card.id, newStatus).subscribe({
            next: () => {
                // Update counts after successful update
                this.updateTasksCount();
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                // Revert the status if update failed
                card.status = originalStatus;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
                
                console.error('Failed to update card status:', error);
            }
        });
    }

    /**
     * Update tasks count based on current cards
     */
    private updateTasksCount(): void
    {
        if (this.userCards) {
            this.tasksCount.total = this.userCards.length;
            this.tasksCount.completed = this.userCards.filter(card => card.status === 'completed' || card.status === 'done').length;
            this.tasksCount.incomplete = this.tasksCount.total - this.tasksCount.completed;
        }
    }

    /**
     * Update navigation count
     */
    private updateNavigationCount(): void
    {
        setTimeout(() => {
            // Get the component -> navigation data -> item
            const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

            // If the main navigation component exists...
            if ( mainNavigationComponent )
            {
                const mainNavigation = mainNavigationComponent.navigation;
                const menuItem = this._fuseNavigationService.getItem('apps.tasks', mainNavigation);

                if (menuItem) {
                    // Update the subtitle of the item
                    menuItem.subtitle = this.tasksCount.incomplete + ' remaining tasks';

                    // Refresh the navigation
                    mainNavigationComponent.refresh();
                }
            }
        });
    }

    /**
     * Group tasks by board
     *
     * @param cards
     */
    private groupTasksByBoard(cards: UserCard[]): BoardGroup[]
    {
        if (!cards || cards.length === 0) {
            return [];
        }

        // Group cards by boardId
        const groupsMap = new Map<string, BoardGroup>();
        
        cards.forEach(card => {
            // Handle cases where boardId or boardTitle might be missing
            const boardId = card.boardId || 'unknown';
            const boardTitle = card.boardTitle || 'Unknown Board';
            
            if (!groupsMap.has(boardId)) {
                groupsMap.set(boardId, {
                    boardId: boardId,
                    boardTitle: boardTitle,
                    cards: [],
                    collapsed: false // Default to expanded
                });
            }
            
            const group = groupsMap.get(boardId)!;
            group.cards.push(card);
        });

        // Convert map to array and sort by board title
        const groups = Array.from(groupsMap.values()).sort((a, b) => 
            a.boardTitle.localeCompare(b.boardTitle)
        );

        // Sort cards within each group (completed cards to the end)
        groups.forEach(group => {
            group.cards.sort((a, b) => {
                const aCompleted = a.status === 'completed' || a.status === 'done';
                const bCompleted = b.status === 'completed' || b.status === 'done';
                
                if (aCompleted && !bCompleted) return 1;
                if (!aCompleted && bCompleted) return -1;
                return 0;
            });
        });

        return groups;
    }

    /**
     * Toggle collapse state of a board group
     *
     * @param group
     */
    toggleBoardCollapse(group: BoardGroup): void
    {
        group.collapsed = !group.collapsed;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Expand all board groups
     */
    expandAllBoards(): void
    {
        this.boardGroups.forEach(group => {
            group.collapsed = false;
        });
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Collapse all board groups
     */
    collapseAllBoards(): void
    {
        this.boardGroups.forEach(group => {
            group.collapsed = true;
        });
        this._changeDetectorRef.markForCheck();
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

    /**
     * Format time spent in seconds to HH:mm:ss
     *
     * @param seconds
     */
    formatTimeSpent(seconds: number): string
    {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Check if a date is overdue
     *
     * @param dueDate
     */
    isOverdue(dueDate: string): boolean
    {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return due < now;
    }

    /**
     * Check if a date is due soon (within next 3 days)
     *
     * @param dueDate
     */
    isDueSoon(dueDate: string): boolean
    {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);
        
        now.setHours(0, 0, 0, 0);
        threeDaysFromNow.setHours(23, 59, 59, 999);
        
        return due >= now && due <= threeDaysFromNow;
    }

    /**
     * Get completed task count for a board group
     *
     * @param group
     */
    getCompletedCount(group: BoardGroup): number
    {
        return group.cards.filter(card => card.status === 'completed' || card.status === 'done').length;
    }

    /**
     * Get incomplete task count for a board group
     *
     * @param group
     */
    getIncompleteCount(group: BoardGroup): number
    {
        return group.cards.filter(card => card.status !== 'completed' && card.status !== 'done').length;
    }

    /**
     * Setup scroll listener for sticky header shadow effect
     */
    private setupScrollListener(): void
    {
        // Wait for the DOM to be ready
        setTimeout(() => {
            const scrollContainer = this._document.querySelector('.overflow-y-auto');
            if (scrollContainer) {
                fromEvent(scrollContainer, 'scroll')
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe(() => {
                        const stickyHeader = this._document.querySelector('.sticky');
                        if (stickyHeader) {
                            if (scrollContainer.scrollTop > 0) {
                                stickyHeader.classList.add('scrolled');
                            } else {
                                stickyHeader.classList.remove('scrolled');
                            }
                        }
                    });
            }
        }, 100);
    }
}
