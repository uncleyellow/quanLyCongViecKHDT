import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Company } from '../departments.service';

export interface CompanyDialogData {
    company?: Company;
    mode: 'create' | 'edit';
}

@Component({
    selector: 'company-dialog',
    templateUrl: './company-dialog.component.html',
    styleUrls: ['./company-dialog.component.scss']
})
export class CompanyDialogComponent implements OnInit {
    form: UntypedFormGroup;
    mode: 'create' | 'edit';
    company?: Company;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _dialogRef: MatDialogRef<CompanyDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CompanyDialogData
    ) {
        this.mode = data.mode;
        this.company = data.company;
    }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            description: ['']
        });

        if (this.mode === 'edit' && this.company) {
            this.form.patchValue({
                name: this.company.name,
                description: this.company.description || ''
            });
        }
    }

    onSubmit(): void {
        if (this.form.valid) {
            const formData = this.form.value;
            this._dialogRef.close({
                ...formData,
                id: this.company?.id
            });
        }
    }

    onCancel(): void {
        this._dialogRef.close();
    }

    getTitle(): string {
        return this.mode === 'create' ? 'Thêm công ty mới' : 'Chỉnh sửa công ty';
    }

    getSubmitButtonText(): string {
        return this.mode === 'create' ? 'Thêm mới' : 'Cập nhật';
    }
}
