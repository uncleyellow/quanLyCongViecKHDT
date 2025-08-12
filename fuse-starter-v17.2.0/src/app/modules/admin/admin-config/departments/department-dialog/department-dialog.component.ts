import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Department, Company } from '../departments.service';

export interface DepartmentDialogData {
    department?: Department;
    companies: Company[];
    mode: 'create' | 'edit';
}

@Component({
    selector: 'department-dialog',
    templateUrl: './department-dialog.component.html',
    styleUrls: ['./department-dialog.component.scss']
})
export class DepartmentDialogComponent implements OnInit {
    form: UntypedFormGroup;
    mode: 'create' | 'edit';
    department?: Department;
    companies: Company[] = [];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _dialogRef: MatDialogRef<DepartmentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DepartmentDialogData
    ) {
        this.mode = data.mode;
        this.department = data.department;
        this.companies = data.companies;
    }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            companyId: ['', Validators.required],
            description: ['']
        });

        if (this.mode === 'edit' && this.department) {
            this.form.patchValue({
                name: this.department.name,
                companyId: this.department.companyId,
                description: this.department.description || ''
            });
        }
    }

    onSubmit(): void {
        if (this.form.valid) {
            const formData = this.form.value;
            this._dialogRef.close({
                ...formData,
                id: this.department?.id
            });
        }
    }

    onCancel(): void {
        this._dialogRef.close();
    }

    getTitle(): string {
        return this.mode === 'create' ? 'Thêm phòng ban mới' : 'Chỉnh sửa phòng ban';
    }

    getSubmitButtonText(): string {
        return this.mode === 'create' ? 'Thêm mới' : 'Cập nhật';
    }
}
