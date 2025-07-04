import { Component } from "@angular/core";
import { UntypedFormGroup, UntypedFormBuilder, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'share-board-dialog',
  template: `
    <h2 mat-dialog-title>Chia sẻ bảng</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field class="w-full">
        <mat-label>Email người nhận</mat-label>
        <input matInput formControlName="email" required>
      </mat-form-field>
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Hủy</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Chia sẻ</button>
      </div>
    </form>
  `
})
export class ShareBoardDialogComponent {
  form: UntypedFormGroup;
  constructor(
    private dialogRef: MatDialogRef<ShareBoardDialogComponent>,
    private fb: UntypedFormBuilder
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  close() { this.dialogRef.close(); }
  submit() { if (this.form.valid) this.dialogRef.close(this.form.value); }
}
