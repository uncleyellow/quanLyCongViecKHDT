import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'change-color-dialog',
    templateUrl: './change-color-dialog.component.html',
    styleUrls: ['./change-color-dialog.component.scss']
})
export class ChangeColorDialogComponent implements OnInit {
    colorForm: UntypedFormGroup;
    availableColors = [
        { name: 'Red', value: '#EF4444' },
        { name: 'Amber', value: '#F59E0B' },
        { name: 'Blue', value: '#3B82F6' },
        { name: 'Green', value: '#10B981' },
        { name: 'Purple', value: '#8B5CF6' },
        { name: 'Pink', value: '#EC4899' }
    ];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        public matDialogRef: MatDialogRef<ChangeColorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { currentColor: string, listTitle: string }
    ) {
    }

    ngOnInit(): void {
        // Initialize the form
        this.colorForm = this._formBuilder.group({
            color: [this.data.currentColor || '#3B82F6']
        });
    }

    onSave(): void {
        if (this.colorForm.valid) {
            this.matDialogRef.close(this.colorForm.get('color').value);
        }
    }

    onCancel(): void {
        this.matDialogRef.close();
    }

    selectColor(color: string): void {
        this.colorForm.get('color').setValue(color);
    }
} 