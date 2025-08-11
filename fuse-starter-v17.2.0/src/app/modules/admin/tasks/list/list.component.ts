import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDrawer } from '@angular/material/sidenav';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Tag, Task, UserCard } from 'app/modules/admin/tasks/tasks.types';
import { TasksService } from 'app/modules/admin/tasks/tasks.service';

@Component({
    selector       : 'tasks-list',
    templateUrl    : './list.component.html',
    styleUrls      : ['./list.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksListComponent implements OnInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    drawerMode: 'side' | 'over';
    selectedTask: Task;
    tags: Tag[];
    tasks: Task[];
    userCards: UserCard[];
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

        // Extract card IDs in the new order
        const cardOrderIds = event.container.data.map(card => card.id);

        // Save the new order
        this._tasksService.updateCardsOrder(cardOrderIds).subscribe({
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
}
