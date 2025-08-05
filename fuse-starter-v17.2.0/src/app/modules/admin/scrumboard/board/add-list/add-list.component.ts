import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
    selector       : 'scrumboard-board-add-list',
    templateUrl    : './add-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrumboardBoardAddListComponent implements OnInit
{
    @ViewChild('titleInput') titleInput: ElementRef;
    @Input() buttonTitle: string = 'Add a list';
    @Output() readonly saved: EventEmitter<{title: string, color: string}> = new EventEmitter<{title: string, color: string}>();

    form: UntypedFormGroup;
    formVisible: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder
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
        // Initialize the new list form
        this.form = this._formBuilder.group({
            title: [''],
            color: ['#3B82F6']
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Save
     */
    save(): void
    {
        // Get the new list title and color
        const title = this.form.get('title').value;
        const color = this.form.get('color').value;

        // Return, if the title is empty
        if ( !title || title.trim() === '' )
        {
            return;
        }

        // Execute the observable
        this.saved.next({
            title: title.trim(),
            color: color
        });

        // Clear the form and hide it
        this.form.get('title').setValue('');
        this.form.get('color').setValue('#3B82F6');
        this.formVisible = false;

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle the visibility of the form
     */
    toggleFormVisibility(): void
    {
        // Toggle the visibility
        this.formVisible = !this.formVisible;

        // If the form becomes visible, focus on the title field
        if ( this.formVisible )
        {
            this.titleInput.nativeElement.focus();
        }
    }
}
