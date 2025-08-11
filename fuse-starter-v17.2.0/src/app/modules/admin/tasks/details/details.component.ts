import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { debounceTime, filter, Subject, takeUntil, tap, take } from 'rxjs';
import { assign } from 'lodash-es';
import { DateTime } from 'luxon';
import { Tag, Task, UserCard } from 'app/modules/admin/tasks/tasks.types';
import { TasksListComponent } from 'app/modules/admin/tasks/list/list.component';
import { TasksService } from 'app/modules/admin/tasks/tasks.service';
import { CustomFieldDialogComponent, CustomFieldDialogData } from './custom-field-dialog/custom-field-dialog.component';

@Component({
    selector       : 'tasks-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksDetailsComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('titleField') private _titleField: ElementRef;

    tags: Tag[];
    tagsEditMode: boolean = false;
    filteredTags: Tag[];
    task: Task;
    taskForm: UntypedFormGroup;
    tasks: Task[];
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _tasksListComponent: TasksListComponent,
        private _tasksService: TasksService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        private _dialog: MatDialog
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
        // Open the drawer
        this._tasksListComponent.matDrawer.open();

        // Create the task form
        this.taskForm = this._formBuilder.group({
            id       : [''],
            type     : [''],
            title    : [''],
            notes    : [''],
            completed: [false],
            dueDate  : [null],
            priority : ['normal'],
            tags     : [[]],
            order    : [0],
            // Additional UserCard fields
            boardId  : [''],
            listId   : [''],
            description: [''],
            position: [0],
            startDate: [null],
            endDate: [null],
            status: [''],
            totalTimeSpent: [0],
            isTracking: [0],
            trackingStartTime: [null],
            trackingPauseTime: [0],
            boardTitle: [''],
            listTitle: [''],
            listColor: [''],
            checklistItems: [[]],
            labels: [[]],
            members: [[]],
            createdAt: [''],
            metadata: [{}]
        });

        // Get the tags
        this._tasksService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tags: Tag[]) => {
                this.tags = tags;
                this.filteredTags = tags;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the tasks
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

                // Open the drawer in case it is closed
                this._tasksListComponent.matDrawer.open();

                // Get the task
                this.task = task;

                // Map UserCard data to form if available
                this.mapUserCardToForm(task);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Update task when there is a value change on the task form
        this.taskForm.valueChanges
            .pipe(
                tap((value) => {

                    // Update the task object
                    this.task = assign(this.task, value);
                }),
                debounceTime(300),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((value) => {

                // Update the corresponding UserCard if it exists
                this.updateUserCard(value);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for NavigationEnd event to focus on the title field
        this._router.events
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(event => event instanceof NavigationEnd)
            )
            .subscribe(() => {

                // Focus on the title field
                this._titleField.nativeElement.focus();
            });
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Listen for matDrawer opened change
        this._tasksListComponent.matDrawer.openedChange
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(opened => opened)
            )
            .subscribe(() => {

                // Focus on the title element
                this._titleField.nativeElement.focus();
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

        // Dispose the overlay
        if ( this._tagsPanelOverlayRef )
        {
            this._tagsPanelOverlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._tasksListComponent.matDrawer.close();
    }

    /**
     * Toggle the completed status
     */
    toggleCompleted(): void
    {
        // Get the form control for 'completed'
        const completedFormControl = this.taskForm.get('completed');

        // Toggle the completed status
        completedFormControl.setValue(!completedFormControl.value);
    }

    /**
     * Open tags panel
     */
    openTagsPanel(): void
    {
        // Create the overlay
        this._tagsPanelOverlayRef = this._overlay.create({
            backdropClass   : '',
            hasBackdrop     : true,
            scrollStrategy  : this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay.position()
                                  .flexibleConnectedTo(this._tagsPanelOrigin.nativeElement)
                                  .withFlexibleDimensions(true)
                                  .withViewportMargin(64)
                                  .withLockedPosition(true)
                                  .withPositions([
                                      {
                                          originX : 'start',
                                          originY : 'bottom',
                                          overlayX: 'start',
                                          overlayY: 'top'
                                      }
                                  ])
        });

        // Subscribe to the attachments observable
        this._tagsPanelOverlayRef.attachments().subscribe(() => {

            // Focus to the search input once the overlay has been attached
            this._tagsPanelOverlayRef.overlayElement.querySelector('input').focus();
        });

        // Create a portal from the template
        const templatePortal = new TemplatePortal(this._tagsPanel, this._viewContainerRef);

        // Attach the portal to the overlay
        this._tagsPanelOverlayRef.attach(templatePortal);

        // Subscribe to the backdrop click
        this._tagsPanelOverlayRef.backdropClick().subscribe(() => {

            // If overlay exists and attached...
            if ( this._tagsPanelOverlayRef && this._tagsPanelOverlayRef.hasAttached() )
            {
                // Detach it
                this._tagsPanelOverlayRef.detach();

                // Reset the tag filter
                this.filteredTags = this.tags;

                // Toggle the edit mode off
                this.tagsEditMode = false;
            }

            // If template portal exists and attached...
            if ( templatePortal && templatePortal.isAttached )
            {
                // Detach it
                templatePortal.detach();
            }
        });
    }

    /**
     * Toggle the tags edit mode
     */
    toggleTagsEditMode(): void
    {
        this.tagsEditMode = !this.tagsEditMode;
    }

    /**
     * Filter tags
     *
     * @param event
     */
    filterTags(event): void
    {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the tags
        this.filteredTags = this.tags.filter(tag => tag.title.toLowerCase().includes(value));
    }

    /**
     * Filter tags input key down event
     *
     * @param event
     */
    filterTagsInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no tag available...
        if ( this.filteredTags.length === 0 )
        {
            // Create the tag
            this.createTag(event.target.value);

            // Clear the input
            event.target.value = '';

            // Return
            return;
        }

        // If there is a tag...
        const tag = this.filteredTags[0];
        const isTagApplied = this.task.tags.find(id => id === tag.id);

        // If the found tag is already applied to the task...
        if ( isTagApplied )
        {
            // Remove the tag from the task
            this.deleteTagFromTask(tag);
        }
        else
        {
            // Otherwise add the tag to the task
            this.addTagToTask(tag);
        }
    }

    /**
     * Create a new tag
     *
     * @param title
     */
    createTag(title: string): void
    {
        const tag = {
            title
        };

        // Create tag on the server
        this._tasksService.createTag(tag)
            .subscribe((response) => {

                // Add the tag to the task
                this.addTagToTask(response);
            });
    }

    /**
     * Update the tag title
     *
     * @param tag
     * @param event
     */
    updateTagTitle(tag: Tag, event): void
    {
        // Update the title on the tag
        tag.title = event.target.value;

        // Update the tag on the server
        this._tasksService.updateTag(tag.id, tag)
            .pipe(debounceTime(300))
            .subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete the tag
     *
     * @param tag
     */
    deleteTag(tag: Tag): void
    {
        // Delete the tag from the server
        this._tasksService.deleteTag(tag.id).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Add tag to the task
     *
     * @param tag
     */
    addTagToTask(tag: Tag): void
    {
        // Add the tag
        this.task.tags.unshift(tag.id);

        // Update the task form
        this.taskForm.get('tags').patchValue(this.task.tags);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete tag from the task
     *
     * @param tag
     */
    deleteTagFromTask(tag: Tag): void
    {
        // Remove the tag
        this.task.tags.splice(this.task.tags.findIndex(item => item === tag.id), 1);

        // Update the task form
        this.taskForm.get('tags').patchValue(this.task.tags);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle task tag
     *
     * @param tag
     */
    toggleTaskTag(tag: Tag): void
    {
        if ( this.task.tags.includes(tag.id) )
        {
            this.deleteTagFromTask(tag);
        }
        else
        {
            this.addTagToTask(tag);
        }
    }

    /**
     * Should the create tag button be visible
     *
     * @param inputValue
     */
    shouldShowCreateTagButton(inputValue: string): boolean
    {
        return !!!(inputValue === '' || this.tags.findIndex(tag => tag.title.toLowerCase() === inputValue.toLowerCase()) > -1);
    }

    /**
     * Set the task priority
     *
     * @param priority
     */
    setTaskPriority(priority: string): void
    {
        // Set the value
        this.taskForm.get('priority').setValue(priority);
    }

    /**
     * Check if the task is overdue or not
     */
    isOverdue(): boolean
    {
        return DateTime.fromISO(this.task.dueDate).startOf('day') < DateTime.now().startOf('day');
    }

    /**
     * Delete the task
     */
    deleteTask(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete task',
            message: 'Are you sure you want to delete this task? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {

                // Get the current task's id
                const id = this.task.id;

                // Get the next/previous task's id
                const currentTaskIndex = this.tasks.findIndex(item => item.id === id);
                const nextTaskIndex = currentTaskIndex + ((currentTaskIndex === (this.tasks.length - 1)) ? -1 : 1);
                const nextTaskId = (this.tasks.length === 1 && this.tasks[0].id === id) ? null : this.tasks[nextTaskIndex].id;

                // Delete the task
                this._tasksService.deleteTask(id)
                    .subscribe((isDeleted) => {

                        // Return if the task wasn't deleted...
                        if ( !isDeleted )
                        {
                            return;
                        }

                        // Navigate to the next task if available
                        if ( nextTaskId )
                        {
                            this._router.navigate(['../', nextTaskId], {relativeTo: this._activatedRoute});
                        }
                        // Otherwise, navigate to the parent
                        else
                        {
                            this._router.navigate(['../'], {relativeTo: this._activatedRoute});
                        }
                    });

                // Mark for check
                this._changeDetectorRef.markForCheck();
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
     * Update UserCard with form data
     *
     * @param formValue
     */
    updateUserCard(formValue: any): void
    {
        this._tasksService.userCards$.pipe(take(1)).subscribe(userCards => {
            const userCard = userCards?.find(card => card.id === formValue.id);
            
            if (userCard) {
                // Prepare update data for API
                const updateData: any = {};
                
                // Only update fields that have changed
                if (formValue.title !== userCard.title) {
                    updateData.title = formValue.title;
                }
                if (formValue.notes !== userCard.description) {
                    updateData.description = formValue.notes;
                }
                if (formValue.completed !== (userCard.status === 'completed')) {
                    updateData.status = formValue.completed ? 'completed' : 'todo';
                }
                if (formValue.dueDate !== userCard.dueDate) {
                    updateData.dueDate = formValue.dueDate;
                }
                if (formValue.order !== userCard.position) {
                    updateData.position = formValue.order;
                }
                // Handle priority - store in metadata since it's not a direct field
                const currentPriority = userCard.metadata?.priority?.value || 'normal';
                if (formValue.priority !== currentPriority) {
                    // Update metadata with new priority
                    const currentMetadata = userCard.metadata || {};
                    const updatedMetadata = {
                        ...currentMetadata,
                        priority: {
                            value: formValue.priority,
                            type: 'string',
                            createdAt: new Date().toISOString()
                        }
                    };
                    updateData.metadata = updatedMetadata;
                }
                if (formValue.startDate !== userCard.startDate) {
                    updateData.startDate = formValue.startDate;
                }
                if (formValue.endDate !== userCard.endDate) {
                    updateData.endDate = formValue.endDate;
                }
                if (formValue.totalTimeSpent !== userCard.totalTimeSpent) {
                    updateData.totalTimeSpent = formValue.totalTimeSpent;
                }
                if (formValue.isTracking !== userCard.isTracking) {
                    updateData.isTracking = formValue.isTracking;
                }
                if (formValue.trackingStartTime !== userCard.trackingStartTime) {
                    updateData.trackingStartTime = formValue.trackingStartTime;
                }
                if (formValue.trackingPauseTime !== userCard.trackingPauseTime) {
                    updateData.trackingPauseTime = formValue.trackingPauseTime;
                }
                
                // Only call API if there are changes
                if (Object.keys(updateData).length > 0) {
                    console.log('Sending update data:', updateData);
                    this._tasksService.updateCard(formValue.id, updateData).subscribe({
                        next: (response) => {
                            console.log('Card updated successfully:', response);
                            
                            // Option 1: Local state is already updated by the service
                            // Option 2: Refresh data from server to ensure consistency
                            // Uncomment the line below if you want to refresh from server
                            // this._tasksService.refreshUserCards().subscribe();
                        },
                        error: (error) => {
                            console.error('Error updating card:', error);
                        }
                    });
                }
            }
        });
    }

    /**
     * Map UserCard data to form
     *
     * @param task
     */
    mapUserCardToForm(task: Task): void
    {
        // Get the corresponding UserCard from the service
        this._tasksService.userCards$.pipe(take(1)).subscribe(userCards => {
            const userCard = userCards?.find(card => card.id === task.id);

            if (userCard) {
            // Map UserCard data to form
            const formData = {
                // Basic task fields
                id: userCard.id,
                type: userCard.type || 'task',
                title: userCard.title,
                notes: userCard.description || '',
                completed: userCard.status === 'completed',
                dueDate: userCard.dueDate,
                priority: userCard.metadata?.priority?.value || task.priority || 'normal', // Read from metadata first, then task, then default
                tags: [], // Default empty tags
                order: userCard.position || 0,
                
                // Additional UserCard fields
                boardId: userCard.boardId,
                listId: userCard.listId,
                description: userCard.description,
                position: userCard.position,
                startDate: userCard.startDate,
                endDate: userCard.endDate,
                status: userCard.status,
                totalTimeSpent: userCard.totalTimeSpent || 0,
                isTracking: userCard.isTracking || 0,
                trackingStartTime: userCard.trackingStartTime,
                trackingPauseTime: userCard.trackingPauseTime || 0,
                boardTitle: userCard.boardTitle,
                listTitle: userCard.listTitle,
                listColor: userCard.listColor,
                checklistItems: userCard.checklistItems || [],
                labels: userCard.labels || [],
                members: userCard.members || [],
                createdAt: userCard.createdAt,
                metadata: userCard.metadata || {}
            };

            // Patch values to the form
            this.taskForm.patchValue(formData, {emitEvent: false});
        } else {
            // Fallback to original task data
            this.taskForm.patchValue(task, {emitEvent: false});
        }
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    });
    }

    /**
     * Format time spent in seconds to human readable format
     *
     * @param seconds
     */
    formatTimeSpent(seconds: number): string
    {
        if (!seconds || seconds === 0) {
            return '0h 0m';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Get custom fields as array for template
     */
    getCustomFieldsArray(): any[] {
        const metadata = this.taskForm.get('metadata').value;
        if (!metadata) return [];
        
        return Object.keys(metadata).map(key => ({
            name: key,
            value: metadata[key].value,
            type: metadata[key].type
        }));
    }

    /**
     * Check if metadata has custom fields
     */
    hasCustomFields(): boolean {
        const metadata = this.taskForm.get('metadata').value;
        return metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0;
    }

    /**
     * Check if metadata has no custom fields
     */
    hasNoCustomFields(): boolean {
        const metadata = this.taskForm.get('metadata').value;
        return !metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0;
    }

    /**
     * Add custom field
     */
    addCustomField(): void {
        const dialogRef = this._dialog.open(CustomFieldDialogComponent, {
            width: '500px',
            data: {
                mode: 'add'
            } as CustomFieldDialogData
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this._tasksService.addCustomField(
                    this.task.id, 
                    result.fieldName, 
                    result.fieldValue, 
                    result.fieldType
                ).subscribe(() => {
                    // Refresh the form data
                    this.mapUserCardToForm(this.task);
                });
            }
        });
    }

    /**
     * Edit custom field
     */
    editCustomField(fieldName: string): void {
        const metadata = this.taskForm.get('metadata').value;
        const currentField = metadata[fieldName];
        
        if (!currentField) {
            return;
        }

        const dialogRef = this._dialog.open(CustomFieldDialogComponent, {
            width: '500px',
            data: {
                mode: 'edit',
                fieldName: fieldName,
                fieldValue: currentField.value,
                fieldType: currentField.type
            } as CustomFieldDialogData
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this._tasksService.updateCustomField(
                    this.task.id, 
                    result.fieldName, 
                    result.fieldValue
                ).subscribe(() => {
                    // Refresh the form data
                    this.mapUserCardToForm(this.task);
                });
            }
        });
    }

    /**
     * Remove custom field
     */
    removeCustomField(fieldName: string): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Remove Custom Field',
            message: `Are you sure you want to remove "${fieldName}"?`,
            actions: {
                confirm: {
                    label: 'Remove'
                },
                cancel: {
                    label: 'Cancel'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._tasksService.removeCustomField(this.task.id, fieldName).subscribe(() => {
                    // Refresh the form data
                    this.mapUserCardToForm(this.task);
                });
            }
        });
    }
}
