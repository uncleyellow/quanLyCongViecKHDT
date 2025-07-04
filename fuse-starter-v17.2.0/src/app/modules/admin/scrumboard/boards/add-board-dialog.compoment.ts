import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'add-board-dialog',
  template: `
    <h2 mat-dialog-title>Thêm bảng mới</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field class="w-full">
        <mat-label>Tiêu đề</mat-label>
        <input matInput formControlName="title" required>
      </mat-form-field>
      <mat-form-field class="w-full">
        <mat-label>Mô tả</mat-label>
        <input matInput formControlName="description">
      </mat-form-field>
      <mat-form-field class="w-full">
        <mat-label>Icon</mat-label>
        <input matInput formControlName="icon">
      </mat-form-field>
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Hủy</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Tạo</button>
      </div>
    </form>
  `
})
export class AddBoardDialogComponent {
  form: UntypedFormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddBoardDialogComponent>,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      icon: ['heroicons_outline:template']
    });
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
