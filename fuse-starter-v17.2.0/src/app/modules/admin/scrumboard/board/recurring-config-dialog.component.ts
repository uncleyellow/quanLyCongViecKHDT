import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RecurringConfig } from '../scrumboard.types';
import { List } from '../scrumboard.models';

@Component({
    selector: 'recurring-config-dialog',
    templateUrl: './recurring-config-dialog.component.html',
    styleUrls: ['./recurring-config-dialog.component.scss']
})
export class RecurringConfigDialogComponent implements OnInit {
    recurringConfigForm: UntypedFormGroup;
    lists: List[] = [];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        public matDialogRef: MatDialogRef<RecurringConfigDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { 
            recurringConfig: RecurringConfig;
            lists: List[];
        }
    ) {
        this.lists = data.lists || [];
    }

    ngOnInit(): void {
        // Initialize the form
        this.recurringConfigForm = this._formBuilder.group({
            isRecurring: [this.data.recurringConfig?.isRecurring ?? false],
            completedListId: [this.data.recurringConfig?.completedListId ?? null]
        });

        // Disable completedListId when isRecurring is false
        this.recurringConfigForm.get('isRecurring')?.valueChanges.subscribe(isRecurring => {
            const completedListIdControl = this.recurringConfigForm.get('completedListId');
            if (isRecurring) {
                completedListIdControl?.enable();
            } else {
                completedListIdControl?.disable();
                completedListIdControl?.setValue(null);
            }
        });

        // Initial state
        const isRecurring = this.recurringConfigForm.get('isRecurring')?.value;
        if (!isRecurring) {
            this.recurringConfigForm.get('completedListId')?.disable();
        }
    }

    onSave(): void {
        if (this.recurringConfigForm.valid) {
            const formValue = this.recurringConfigForm.value;
            this.matDialogRef.close({
                isRecurring: formValue.isRecurring,
                completedListId: formValue.isRecurring ? formValue.completedListId : null
            });
        }
    }

    onCancel(): void {
        this.matDialogRef.close();
    }
} 