import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface CustomFieldDialogData {
    mode: 'add' | 'edit';
    fieldName?: string;
    fieldValue?: any;
    fieldType?: string;
}

@Component({
    selector: 'custom-field-dialog',
    templateUrl: './custom-field-dialog.component.html',
    styleUrls: ['./custom-field-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule
    ]
})
export class CustomFieldDialogComponent implements OnInit {
    customFieldForm: UntypedFormGroup;
    fieldTypes = [
        { value: 'string', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'date', label: 'Date' }
    ];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _dialogRef: MatDialogRef<CustomFieldDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CustomFieldDialogData
    ) {
        this.customFieldForm = this._formBuilder.group({
            fieldName: ['', [Validators.required, Validators.minLength(1)]],
            fieldValue: [''],
            fieldType: ['string', Validators.required]
        });
    }

    ngOnInit(): void {
        if (this.data.mode === 'edit' && this.data.fieldName) {
            this.customFieldForm.patchValue({
                fieldName: this.data.fieldName,
                fieldValue: this.data.fieldValue,
                fieldType: this.data.fieldType || 'string'
            });
            
            // Disable field name and type in edit mode
            this.customFieldForm.get('fieldName').disable();
            this.customFieldForm.get('fieldType').disable();
        }

        // Set default value for boolean type
        this.customFieldForm.get('fieldType').valueChanges.subscribe(type => {
            if (type === 'boolean' && this.customFieldForm.get('fieldValue').value === '') {
                this.customFieldForm.get('fieldValue').setValue(false);
            } else if (type === 'number' && this.customFieldForm.get('fieldValue').value === '') {
                this.customFieldForm.get('fieldValue').setValue(0);
            } else if (type === 'string' && this.customFieldForm.get('fieldValue').value === '') {
                this.customFieldForm.get('fieldValue').setValue('');
            }
        });
    }

    onSubmit(): void {
        if (this.customFieldForm.valid) {
            // Enable field name and type to get their values
            if (this.isEditMode) {
                this.customFieldForm.get('fieldName').enable();
                this.customFieldForm.get('fieldType').enable();
            }
            
            const formValue = this.customFieldForm.value;
            
            // Convert value based on type
            let convertedValue = formValue.fieldValue;
            if (formValue.fieldType === 'number') {
                convertedValue = Number(formValue.fieldValue);
            } else if (formValue.fieldType === 'boolean') {
                convertedValue = Boolean(formValue.fieldValue);
            } else if (formValue.fieldType === 'date') {
                convertedValue = formValue.fieldValue ? new Date(formValue.fieldValue) : null;
            } else if (formValue.fieldType === 'string') {
                convertedValue = String(formValue.fieldValue || '');
            }

            this._dialogRef.close({
                fieldName: formValue.fieldName,
                fieldValue: convertedValue,
                fieldType: formValue.fieldType
            });
        }
    }

    onCancel(): void {
        this._dialogRef.close();
    }

    get isEditMode(): boolean {
        return this.data.mode === 'edit';
    }

    get dialogTitle(): string {
        return this.isEditMode ? 'Edit Custom Field' : 'Add Custom Field';
    }

    get submitButtonText(): string {
        return this.isEditMode ? 'Update' : 'Add';
    }
}
