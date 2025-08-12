import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee } from '../employees.service';
import { Company, Department } from '../../departments/departments.service';

export interface EmployeeDialogData {
    employee?: Employee;
    companies: Company[];
    departments: Department[];
    mode: 'create' | 'edit';
}

@Component({
    selector: 'employee-dialog',
    templateUrl: './employee-dialog.component.html',
    styleUrls: ['./employee-dialog.component.scss']
})
export class EmployeeDialogComponent implements OnInit {
    form: UntypedFormGroup;
    mode: 'create' | 'edit';
    employee?: Employee;
    companies: Company[] = [];
    departments: Department[] = [];
    filteredDepartments: Department[] = [];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _dialogRef: MatDialogRef<EmployeeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EmployeeDialogData
    ) {
        this.mode = data.mode;
        this.employee = data.employee;
        this.companies = data.companies;
        this.departments = data.departments;
    }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', this.mode === 'create' ? [Validators.required, Validators.minLength(6)] : []], // Password chỉ bắt buộc khi tạo mới
            type: ['staff', Validators.required],
            companyId: ['', Validators.required],
            departmentId: ['', Validators.required],
            status: ['online']
        });

        if (this.mode === 'edit' && this.employee) {
            this.form.patchValue({
                name: this.employee.name,
                email: this.employee.email,
                password: '', // Không hiển thị password cũ trong form edit
                type: this.employee.type || 'staff',
                companyId: this.employee.companyId,
                departmentId: this.employee.departmentId,
                status: this.employee.status || 'online'
            });
        }

        // Listen to company changes to filter departments
        this.form.get('companyId')?.valueChanges.subscribe(companyId => {
            this.filterDepartmentsByCompany(companyId);
        });

        // Initial filter if editing
        if (this.mode === 'edit' && this.employee) {
            this.filterDepartmentsByCompany(this.employee.companyId);
        }
    }

    filterDepartmentsByCompany(companyId: string): void {
        if (companyId) {
            this.filteredDepartments = this.departments.filter(dept => dept.companyId === companyId);
        } else {
            this.filteredDepartments = [];
        }
        
        // Reset department selection if current department is not in filtered list
        const currentDepartmentId = this.form.get('departmentId')?.value;
        if (currentDepartmentId && !this.filteredDepartments.find(dept => dept.id === currentDepartmentId)) {
            this.form.get('departmentId')?.setValue('');
        }
    }

    onSubmit(): void {
        if (this.form.valid) {
            const formData = this.form.value;
            
            // Nếu là edit mode và password trống, thì không gửi password
            if (this.mode === 'edit' && !formData.password) {
                delete formData.password;
            }
            
            this._dialogRef.close({
                ...formData,
                id: this.employee?.id
            });
        }
    }

    onCancel(): void {
        this._dialogRef.close();
    }

    getTitle(): string {
        return this.mode === 'create' ? 'Thêm nhân viên mới' : 'Chỉnh sửa nhân viên';
    }

    getSubmitButtonText(): string {
        return this.mode === 'create' ? 'Thêm mới' : 'Cập nhật';
    }
}
