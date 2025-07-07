import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup, UntypedFormBuilder, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { ScrumboardService } from "app/modules/admin/scrumboard/scrumboard.service";
import { Member } from "app/modules/admin/scrumboard/scrumboard.models";

@Component({
  selector: 'share-board-dialog',
  template: `
    <h2 mat-dialog-title>Chia sẻ bảng</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field class="w-full">
        <mat-label>Chọn thành viên</mat-label>
        <mat-select formControlName="memberId" required>
          <mat-option *ngFor="let member of members" [value]="member.id">
            <div class="flex items-center">
              <img [src]="member.avatar" [alt]="member.name" class="w-6 h-6 rounded-full mr-2">
              {{ member.name }}
            </div>
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div class="text-sm text-gray-600 mb-4">
        Hoặc nhập email:
      </div>
      
      <mat-form-field class="w-full">
        <mat-label>Email người nhận</mat-label>
        <input matInput formControlName="email">
      </mat-form-field>
      
      <div mat-dialog-actions>
        <button mat-button type="button" (click)="close()">Hủy</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!form.valid">Chia sẻ</button>
      </div>
    </form>
  `
})
export class ShareBoardDialogComponent implements OnInit {
  form: UntypedFormGroup;
  members: Member[] = [];

  constructor(
    private dialogRef: MatDialogRef<ShareBoardDialogComponent>,
    private fb: UntypedFormBuilder,
    private scrumboardService: ScrumboardService
  ) {
    this.form = this.fb.group({
      memberId: [''],
      email: ['', [Validators.email]]
    });
  }

  ngOnInit() {
    // Lấy danh sách members từ mock data
    this.scrumboardService.getMembers().subscribe(members => {
      this.members = members;
    });
  }

  close() { 
    this.dialogRef.close(); 
  }

  submit() { 
    if (this.form.valid) {
      const formValue = this.form.value;
      if (formValue.memberId) {
        // Nếu chọn member từ danh sách
        this.dialogRef.close({ memberId: formValue.memberId });
      } else if (formValue.email) {
        // Nếu nhập email
        this.dialogRef.close({ email: formValue.email });
      }
    }
  }
}
