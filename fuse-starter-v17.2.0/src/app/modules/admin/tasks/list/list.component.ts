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

// Interface for filter configuration
interface FilterField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'select';
    options?: { value: any; label: string }[];
}

// Interface for filter
interface Filter {
    id: string;
    field: string;
    operator: string;
    value: any;
    startDate?: Date; // For date range filters
    endDate?: Date;   // For date range filters
}

// Available operators for different field types
const STRING_OPERATORS = [
    { value: 'contains', label: 'Chứa' },
    { value: 'not_contains', label: 'Không chứa' },
    { value: 'equals', label: 'Bằng' },
    { value: 'not_equals', label: 'Không bằng' },
    { value: 'starts_with', label: 'Bắt đầu bằng' },
    { value: 'ends_with', label: 'Kết thúc bằng' }
];

const NUMBER_OPERATORS = [
    { value: 'equals', label: 'Bằng' },
    { value: 'not_equals', label: 'Không bằng' },
    { value: 'greater_than', label: 'Lớn hơn' },
    { value: 'greater_than_or_equal', label: 'Lớn hơn hoặc bằng' },
    { value: 'less_than', label: 'Nhỏ hơn' },
    { value: 'less_than_or_equal', label: 'Nhỏ hơn hoặc bằng' }
];

const DATE_OPERATORS = [
    { value: 'equals', label: 'Bằng' },
    { value: 'not_equals', label: 'Không bằng' },
    { value: 'greater_than', label: 'Sau ngày' },
    { value: 'greater_than_or_equal', label: 'Từ ngày' },
    { value: 'less_than', label: 'Trước ngày' },
    { value: 'less_than_or_equal', label: 'Đến ngày' },
    { value: 'between', label: 'Trong khoảng' }
];

const SELECT_OPERATORS = [
    { value: 'equals', label: 'Bằng' },
    { value: 'not_equals', label: 'Không bằng' },
    { value: 'in', label: 'Trong danh sách' },
    { value: 'not_in', label: 'Không trong danh sách' }
];

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
    hasRecurringBoards: boolean = false;
    searchTerm: string = '';
    filteredBoardGroups: BoardGroup[] = [];
    // Filter properties
    filters: Filter[] = [];
    availableFields: FilterField[] = [];
    showFilterPanel: boolean = false;
    // Quick date range filter
    quickDateRange: { startDate: Date | null; endDate: Date | null } = { startDate: null, endDate: null };
    // Store collapse state for each board group
    private boardCollapseStates: Map<string, boolean> = new Map();
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
        // Initialize filtered board groups
        this.filteredBoardGroups = [];

        // Initialize filter fields
        this.initializeFilterFields();

        // Auto-set date range to today (this will also load cards with today's filter)
        this.autoSetDateRangeToToday();

        // Get the tags
        this._tasksService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tags: Tag[]) => {
                this.tags = tags;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Note: getUserCards is now called by autoSetDateRangeToToday() with today's filter
        // No need to call it again here as it would override the filtered results

        // Subscribe to user cards changes
        this._tasksService.userCards$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((userCards: UserCard[]) => {
                if (userCards) {
                    console.log('TasksListComponent received updated userCards:', userCards.length);
                    this.userCards = userCards;
                    this.updateBoardGroupsWithSearch();
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
            this.hasRecurringBoards = false;
            return [];
        }

        // Check if there are any recurring boards
        this.hasRecurringBoards = cards.some(card => card.board?.recurringConfig?.isRecurring);

        // Filter cards for recurring boards
        const filteredCards = this.filterCardsForRecurringBoards(cards);

        // Group cards by boardId
        const groupsMap = new Map<string, BoardGroup>();
        
        filteredCards.forEach(card => {
            // Handle cases where boardId or boardTitle might be missing
            const boardId = card.boardId || 'unknown';
            const boardTitle = card.boardTitle || 'Unknown Board';
            
            if (!groupsMap.has(boardId)) {
                // Get saved collapse state or default to false (expanded)
                const savedCollapsedState = this.boardCollapseStates.get(boardId);
                const isCollapsed = savedCollapsedState !== undefined ? savedCollapsedState : false;
                
                groupsMap.set(boardId, {
                    boardId: boardId,
                    boardTitle: boardTitle,
                    cards: [],
                    collapsed: isCollapsed
                });
            }
            
            const group = groupsMap.get(boardId)!;
            group.cards.push(card);
        });

        // Convert map to array and sort by board title
        const groups = Array.from(groupsMap.values()).sort((a, b) => {
            // First, check if either board is recurring
            const aIsRecurring = a.cards.some(card => card.board?.recurringConfig?.isRecurring);
            const bIsRecurring = b.cards.some(card => card.board?.recurringConfig?.isRecurring);
            
            // If one is recurring and the other is not, recurring comes first
            if (aIsRecurring && !bIsRecurring) return -1;
            if (!aIsRecurring && bIsRecurring) return 1;
            
            // If both are recurring or both are not recurring, sort by title
            return a.boardTitle.localeCompare(b.boardTitle);
        });

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
     * Filter cards for recurring boards - only show cards with due date today
     *
     * @param cards
     */
    private filterCardsForRecurringBoards(cards: UserCard[]): UserCard[]
    {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        return cards.filter(card => {
            // If board has recurringConfig and isRecurring is true
            if (card.board?.recurringConfig?.isRecurring) {
                // Only show cards with due date today
                if (card.dueDate) {
                    const dueDate = new Date(card.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                }
                return false; // No due date, don't show
            }
            
            // For non-recurring boards, show all cards
            return true;
        });
    }

    /**
     * Toggle collapse state of a board group
     *
     * @param group
     */
    toggleBoardCollapse(group: BoardGroup): void
    {
        group.collapsed = !group.collapsed;
        
        // Save the collapse state
        this.boardCollapseStates.set(group.boardId, group.collapsed);
        
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Expand all board groups
     */
    expandAllBoards(): void
    {
        this.boardGroups.forEach(group => {
            group.collapsed = false;
            // Save the collapse state
            this.boardCollapseStates.set(group.boardId, false);
        });
        // Update filtered groups to reflect the changes
        this.filteredBoardGroups = [...this.boardGroups];
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Collapse all board groups
     */
    collapseAllBoards(): void
    {
        this.boardGroups.forEach(group => {
            group.collapsed = true;
            // Save the collapse state
            this.boardCollapseStates.set(group.boardId, true);
        });
        // Update filtered groups to reflect the changes
        this.filteredBoardGroups = [...this.boardGroups];
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
     * Get priority icon
     */
    getPriorityIcon(priority: string): string {
        switch (priority) {
            case 'high':
                return 'heroicons_solid:arrow-up';
            case 'medium':
                return 'heroicons_solid:minus';
            case 'low':
                return 'heroicons_solid:arrow-down';
            default:
                return 'heroicons_solid:minus';
        }
    }

    /**
     * Get priority color class
     */
    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'high':
                return 'text-red-500';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
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

    /**
     * Handle search term change
     *
     * @param searchTerm
     */
    onSearchChange(searchTerm: string): void
    {
        this.searchTerm = searchTerm;
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Clear search
     */
    clearSearch(): void
    {
        this.searchTerm = '';
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }



    /**
     * Update board groups (no need to apply search since it's handled by backend)
     */
    private updateBoardGroupsWithSearch(): void
    {
        this.boardGroups = this.groupTasksByBoard(this.userCards);
        this.filteredBoardGroups = [...this.boardGroups];
    }

    /**
     * Get filtered tasks count
     */
    getFilteredTasksCount(): number
    {
        return this.filteredBoardGroups.reduce((total, group) => total + group.cards.length, 0);
    }

    /**
     * Get operators for a field type
     */
    getOperatorsForFieldType(fieldType: string): any[]
    {
        switch (fieldType) {
            case 'string':
                return STRING_OPERATORS;
            case 'number':
                return NUMBER_OPERATORS;
            case 'date':
                return DATE_OPERATORS;
            case 'select':
                return SELECT_OPERATORS;
            default:
                return STRING_OPERATORS;
        }
    }

    /**
     * Get field configuration by key
     */
    getFieldConfig(fieldKey: string): FilterField | undefined
    {
        return this.availableFields.find(field => field.key === fieldKey);
    }

    /**
     * Add a new filter
     */
    addFilter(): void
    {
        const newFilter: Filter = {
            id: Date.now().toString(),
            field: '',
            operator: '',
            value: null
        };
        this.filters.push(newFilter);
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove a filter
     */
    removeFilter(filterId: string): void
    {
        const filterToRemove = this.filters.find(f => f.id === filterId);
        this.filters = this.filters.filter(f => f.id !== filterId);
        
        // If removing a due date filter, also clear the quick date range
        if (filterToRemove && filterToRemove.field === 'dueDate') {
            this.quickDateRange = { startDate: null, endDate: null };
        }
        
        // Sync advanced filters with quick date range
        this.syncAdvancedFiltersWithQuickDateRange();
        
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Clear all filters
     */
    clearAllFilters(): void
    {
        this.filters = [];
        this.quickDateRange = { startDate: null, endDate: null };
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle filter panel
     */
    toggleFilterPanel(): void
    {
        this.showFilterPanel = !this.showFilterPanel;
        this._changeDetectorRef.markForCheck();
    }





    /**
     * Load cards with current filters and search
     */
    private loadCardsWithFilters(): void
    {
        const options: any = {};
        
        if (this.searchTerm && this.searchTerm.trim()) {
            options.searchTerm = this.searchTerm.trim();
        }
        
        if (this.filters && this.filters.length > 0) {
            // Only include filters that have all required fields
            const validFilters = this.filters.filter(filter => {
                const hasBasicFields = filter.field && filter.operator && filter.value !== null && filter.value !== undefined;
                
                // Additional validation for date range filters
                if (filter.field === 'dueDate' && filter.operator === 'between') {
                    return hasBasicFields && filter.value.startDate && filter.value.endDate;
                }
                
                return hasBasicFields;
            });
            
            console.log('Valid filters before processing:', validFilters);
            
            // Process date values for date fields
            const processedFilters = validFilters.map(filter => {
                if (filter.field === 'dueDate') {
                    if (filter.operator === 'between' && filter.value && filter.value.startDate && filter.value.endDate) {
                        // Handle date range filter
                        const startYear = filter.value.startDate.getFullYear();
                        const startMonth = String(filter.value.startDate.getMonth() + 1).padStart(2, '0');
                        const startDay = String(filter.value.startDate.getDate()).padStart(2, '0');
                        const startDateString = `${startYear}-${startMonth}-${startDay}`;
                        
                        const endYear = filter.value.endDate.getFullYear();
                        const endMonth = String(filter.value.endDate.getMonth() + 1).padStart(2, '0');
                        const endDay = String(filter.value.endDate.getDate()).padStart(2, '0');
                        const endDateString = `${endYear}-${endMonth}-${endDay}`;
                        
                        const dateRangeFilter = {
                            ...filter,
                            value: {
                                startDate: startDateString,
                                endDate: endDateString
                            }
                        };
                        console.log('Processing date range filter:', {
                            startDate: dateRangeFilter.value.startDate,
                            endDate: dateRangeFilter.value.endDate,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        });
                        return dateRangeFilter;
                    } else if (filter.value instanceof Date) {
                        // Handle single date filter
                        const year = filter.value.getFullYear();
                        const month = String(filter.value.getMonth() + 1).padStart(2, '0');
                        const day = String(filter.value.getDate()).padStart(2, '0');
                        const localDateString = `${year}-${month}-${day}`;
                        
                        const dateFilter = {
                            ...filter,
                            value: localDateString // YYYY-MM-DD format using local date
                        };
                        console.log('Processing date filter:', {
                            original: filter.value,
                            originalLocal: `${filter.value.getFullYear()}-${String(filter.value.getMonth() + 1).padStart(2, '0')}-${String(filter.value.getDate()).padStart(2, '0')}`,
                            processed: dateFilter.value,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        });
                        return dateFilter;
                    }
                }
                return filter;
            });
            
            if (processedFilters.length > 0) {
                options.filters = processedFilters;
                console.log('Sending filters to API:', JSON.stringify(processedFilters, null, 2));
            }
        }
        
        this._tasksService.getUserCards(options).subscribe((userCards: UserCard[]) => {
            this.userCards = userCards;
            this.updateBoardGroupsWithSearch();
            this.updateTasksCount();
            this.updateNavigationCount();
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update filter and apply
     */
    onFilterChange(): void
    {
        // Handle operator changes for date fields
        this.filters.forEach(filter => {
            if (filter.field === 'dueDate') {
                if (filter.operator === 'between') {
                    // Initialize date range fields if switching to 'between'
                    if (!filter.startDate && !filter.endDate) {
                        filter.startDate = null;
                        filter.endDate = null;
                        filter.value = null;
                    }
                } else {
                    // Clear date range fields if switching away from 'between'
                    if (filter.startDate || filter.endDate) {
                        filter.startDate = null;
                        filter.endDate = null;
                        filter.value = null;
                    }
                }
            }
        });
        
        // Sync quick date range with advanced filters
        this.syncQuickDateRangeWithFilters();
        
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Handle date range change for 'between' operator
     */
    onDateRangeChange(filter: Filter): void
    {
        // Validate date range
        if (filter.startDate && filter.endDate) {
            const startDate = new Date(filter.startDate);
            const endDate = new Date(filter.endDate);
            
            // Set both dates to start of day for comparison
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            if (startDate > endDate) {
                // If start date is after end date, swap them
                const temp = filter.startDate;
                filter.startDate = filter.endDate;
                filter.endDate = temp;
            }
            
            filter.value = {
                startDate: filter.startDate,
                endDate: filter.endDate
            };
        } else {
            filter.value = null;
        }
        
        // Sync quick date range with advanced filters
        this.syncQuickDateRangeWithFilters();
        
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Check if date range is invalid
     */
    isInvalidDateRange(filter: Filter): boolean
    {
        if (!filter.startDate || !filter.endDate) {
            return false;
        }
        
        const startDate = new Date(filter.startDate);
        const endDate = new Date(filter.endDate);
        
        // Set both dates to start of day for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        return startDate > endDate;
    }

    /**
     * Handle quick date range change
     */
    onQuickDateRangeChange(): void
    {
        // Sync advanced filters with quick date range
        this.syncAdvancedFiltersWithQuickDateRange();
        
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Clear quick date range filter
     */
    clearQuickDateRange(): void
    {
        this.quickDateRange = { startDate: null, endDate: null };
        
        // Remove any existing due date filters
        this.filters = this.filters.filter(filter => filter.field !== 'dueDate');
        
        this.loadCardsWithFilters();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Check if quick date range is invalid
     */
    isInvalidQuickDateRange(): boolean
    {
        if (!this.quickDateRange.startDate || !this.quickDateRange.endDate) {
            return false;
        }
        
        const startDate = new Date(this.quickDateRange.startDate);
        const endDate = new Date(this.quickDateRange.endDate);
        
        // Set both dates to start of day for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        return startDate > endDate;
    }

    /**
     * Sync quick date range with advanced filters
     */
    private syncQuickDateRangeWithFilters(): void
    {
        const dueDateFilter = this.filters.find(filter => filter.field === 'dueDate');
        
        if (dueDateFilter) {
            if (dueDateFilter.operator === 'between' && dueDateFilter.startDate && dueDateFilter.endDate) {
                // Both dates in range filter
                this.quickDateRange = {
                    startDate: dueDateFilter.startDate,
                    endDate: dueDateFilter.endDate
                };
            } else if (dueDateFilter.operator === 'greater_than_or_equal' && dueDateFilter.value) {
                // Only start date (from date)
                this.quickDateRange = {
                    startDate: dueDateFilter.value,
                    endDate: null
                };
            } else if (dueDateFilter.operator === 'less_than_or_equal' && dueDateFilter.value) {
                // Only end date (to date)
                this.quickDateRange = {
                    startDate: null,
                    endDate: dueDateFilter.value
                };
            } else {
                this.quickDateRange = { startDate: null, endDate: null };
            }
        } else {
            this.quickDateRange = { startDate: null, endDate: null };
        }
    }

    /**
     * Sync advanced filters with quick date range
     */
    private syncAdvancedFiltersWithQuickDateRange(): void
    {
        // Remove any existing due date filters
        this.filters = this.filters.filter(filter => filter.field !== 'dueDate');
        
        // Add new filter if at least one date is selected
        if (this.quickDateRange.startDate || this.quickDateRange.endDate) {
            let newFilter: Filter;
            
            if (this.quickDateRange.startDate && this.quickDateRange.endDate) {
                // Both dates selected - use 'between' operator
                newFilter = {
                    id: Date.now().toString(),
                    field: 'dueDate',
                    operator: 'between',
                    value: {
                        startDate: this.quickDateRange.startDate,
                        endDate: this.quickDateRange.endDate
                    },
                    startDate: this.quickDateRange.startDate,
                    endDate: this.quickDateRange.endDate
                };
                
                console.log('Created between filter:', newFilter);
            } else if (this.quickDateRange.startDate) {
                // Only start date selected - use 'greater_than_or_equal' operator
                newFilter = {
                    id: Date.now().toString(),
                    field: 'dueDate',
                    operator: 'greater_than_or_equal',
                    value: this.quickDateRange.startDate,
                    startDate: null,
                    endDate: null
                };
            } else {
                // Only end date selected - use 'less_than_or_equal' operator
                newFilter = {
                    id: Date.now().toString(),
                    field: 'dueDate',
                    operator: 'less_than_or_equal',
                    value: this.quickDateRange.endDate,
                    startDate: null,
                    endDate: null
                };
            }
            
            this.filters.push(newFilter);
        }
    }

    /**
     * Auto-set date range to today
     */
    private autoSetDateRangeToToday(): void
    {
        const today = new Date();
        console.log('Setting date range to today:', today);
        
        this.quickDateRange = {
            startDate: today,
            endDate: today
        };
        
        // Sync with advanced filters
        this.syncAdvancedFiltersWithQuickDateRange();
        
        console.log('Filters after sync:', this.filters);
        
        // Load cards with the today filter
        this.loadCardsWithFilters();
        
        // Mark for check to update the UI
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Initialize filter fields
     */
    private initializeFilterFields(): void
    {
        this.availableFields = [
            { key: 'title', label: 'Tiêu đề', type: 'string' },
            { key: 'description', label: 'Mô tả', type: 'string' },
            { key: 'dueDate', label: 'Ngày hết hạn', type: 'date' },
            { key: 'status', label: 'Trạng thái', type: 'select', options: [
                { value: 'todo', label: 'Chưa làm' },
                { value: 'in-progress', label: 'Đang thực hiện' },
                { value: 'doing', label: 'Đang làm' },
                { value: 'completed', label: 'Đã hoàn thành' },
                { value: 'done', label: 'Đã làm' }
            ] },
            { key: 'recurring', label: 'Lặp lại', type: 'select', options: [
                { value: true, label: 'Có' },
                { value: false, label: 'Không' }
            ] }
        ];
    }
}
