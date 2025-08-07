import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
    selector: 'filter-dialog',
    templateUrl: './filter-dialog.component.html',
    styleUrls: ['./filter-dialog.component.scss']
})
export class FilterDialogComponent implements OnInit {
    filterForm: FormGroup;
    members: any[] = [];

    constructor(
        public dialogRef: MatDialogRef<FilterDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder
    ) {
        this.members = data.members || [];
    }

    ngOnInit(): void {
        this.filterForm = this.fb.group({
            member: [''],
            title: [''],
            description: [''],
            status: [''],
            startDate: [null],
            endDate: [null]
        });

        // Set initial values if provided
        if (this.data.currentFilters) {
            this.filterForm.patchValue(this.data.currentFilters);
        }
    }

    onApply(): void {
        const filterData = this.filterForm.value;
        this.dialogRef.close(filterData);
    }

    onClear(): void {
        this.filterForm.reset();
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
