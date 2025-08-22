import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewConfig, RecurringConfig } from '../scrumboard.types';
import { List } from '../scrumboard.models';

@Component({
    selector: 'view-config-dialog',
    templateUrl: './view-config-dialog.component.html',
    styleUrls: ['./view-config-dialog.component.scss']
})
export class ViewConfigDialogComponent implements OnInit {
    viewConfigForm: UntypedFormGroup;
    lists: List[] = [];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        public matDialogRef: MatDialogRef<ViewConfigDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { 
            viewConfig: ViewConfig;
            recurringConfig: RecurringConfig;
            isAssigned: boolean;
            lists: List[];
        }
    ) {
        this.lists = data.lists || [];
    }

    ngOnInit(): void {
        // Initialize the form
        this.viewConfigForm = this._formBuilder.group({
            showTitle: [this.data.viewConfig?.showTitle ?? true],
            showDescription: [this.data.viewConfig?.showDescription ?? true],
            showDueDate: [this.data.viewConfig?.showDueDate ?? true],
            showMembers: [this.data.viewConfig?.showMembers ?? true],
            showLabels: [this.data.viewConfig?.showLabels ?? true],
            showChecklist: [this.data.viewConfig?.showChecklist ?? true],
            showStatus: [this.data.viewConfig?.showStatus ?? true],
            showType: [this.data.viewConfig?.showType ?? true],
            isRecurring: [this.data.recurringConfig?.isRecurring ?? false],
            completedListId: [this.data.recurringConfig?.completedListId ?? null],
            isAssigned: [this.data.isAssigned ?? false]
        });

        // Disable completedListId when isRecurring is false
        this.viewConfigForm.get('isRecurring')?.valueChanges.subscribe(isRecurring => {
            const completedListIdControl = this.viewConfigForm.get('completedListId');
            const isAssignedControl = this.viewConfigForm.get('isAssigned');
            
            if (isRecurring) {
                completedListIdControl?.enable();
                // Disable isAssigned when isRecurring is true
                isAssignedControl?.setValue(false, { emitEvent: false });
                isAssignedControl?.disable();
            } else {
                completedListIdControl?.disable();
                completedListIdControl?.setValue(null, { emitEvent: false });
                // Enable isAssigned when isRecurring is false
                isAssignedControl?.enable();
            }
        });

        // Disable isRecurring when isAssigned is true
        this.viewConfigForm.get('isAssigned')?.valueChanges.subscribe(isAssigned => {
            const isRecurringControl = this.viewConfigForm.get('isRecurring');
            const completedListIdControl = this.viewConfigForm.get('completedListId');
            
            if (isAssigned) {
                // Disable isRecurring when isAssigned is true
                isRecurringControl?.setValue(false, { emitEvent: false });
                isRecurringControl?.disable();
                completedListIdControl?.disable();
                completedListIdControl?.setValue(null, { emitEvent: false });
            } else {
                // Enable isRecurring when isAssigned is false
                isRecurringControl?.enable();
            }
        });

        // Initial state
        const isRecurring = this.viewConfigForm.get('isRecurring')?.value;
        const isAssigned = this.viewConfigForm.get('isAssigned')?.value;
        
        if (!isRecurring) {
            this.viewConfigForm.get('completedListId')?.disable();
        }
        
        if (isAssigned) {
            this.viewConfigForm.get('isRecurring')?.disable();
            this.viewConfigForm.get('completedListId')?.disable();
        }
    }

    onSave(): void {
        if (this.viewConfigForm.valid) {
            const formValue = this.viewConfigForm.value;
            this.matDialogRef.close({
                viewConfig: {
                    showTitle: formValue.showTitle,
                    showDescription: formValue.showDescription,
                    showDueDate: formValue.showDueDate,
                    showMembers: formValue.showMembers,
                    showLabels: formValue.showLabels,
                    showChecklist: formValue.showChecklist,
                    showStatus: formValue.showStatus,
                    showType: formValue.showType
                },
                recurringConfig: {
                    isRecurring: formValue.isRecurring,
                    completedListId: formValue.isRecurring ? formValue.completedListId : null
                },
                isAssigned: formValue.isAssigned
            });
        }
    }

    onCancel(): void {
        this.matDialogRef.close();
    }
} 