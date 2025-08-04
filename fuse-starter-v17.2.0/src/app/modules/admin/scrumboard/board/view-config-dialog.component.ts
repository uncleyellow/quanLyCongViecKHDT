import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewConfig } from '../scrumboard.types';

@Component({
    selector: 'view-config-dialog',
    templateUrl: './view-config-dialog.component.html',
    styleUrls: ['./view-config-dialog.component.scss']
})
export class ViewConfigDialogComponent implements OnInit {
    viewConfigForm: UntypedFormGroup;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        public matDialogRef: MatDialogRef<ViewConfigDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { viewConfig: ViewConfig }
    ) {
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
            showType: [this.data.viewConfig?.showType ?? true]
        });
    }

    onSave(): void {
        if (this.viewConfigForm.valid) {
            this.matDialogRef.close(this.viewConfigForm.value);
        }
    }

    onCancel(): void {
        this.matDialogRef.close();
    }
} 