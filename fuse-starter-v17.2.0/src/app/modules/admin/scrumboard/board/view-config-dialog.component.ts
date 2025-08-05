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
            completedListId: [this.data.recurringConfig?.completedListId ?? null]
        });

        // Disable completedListId when isRecurring is false
        this.viewConfigForm.get('isRecurring')?.valueChanges.subscribe(isRecurring => {
            const completedListIdControl = this.viewConfigForm.get('completedListId');
            if (isRecurring) {
                completedListIdControl?.enable();
            } else {
                completedListIdControl?.disable();
                completedListIdControl?.setValue(null);
            }
        });

        // Initial state
        const isRecurring = this.viewConfigForm.get('isRecurring')?.value;
        if (!isRecurring) {
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
                }
            });
        }
    }

    onCancel(): void {
        this.matDialogRef.close();
    }
} 