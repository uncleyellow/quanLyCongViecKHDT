import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'change-password-modal',
    templateUrl: './change-password-modal.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class ChangePasswordModalComponent implements OnInit {
    changePasswordForm: UntypedFormGroup;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    showAlert: boolean = false;
    isLoading: boolean = false;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _dialogRef: MatDialogRef<ChangePasswordModalComponent>
    ) {}

    ngOnInit(): void {
        this.changePasswordForm = this._formBuilder.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(form: UntypedFormGroup) {
        const newPassword = form.get('newPassword');
        const confirmPassword = form.get('confirmPassword');
        
        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        
        if (confirmPassword && confirmPassword.errors) {
            delete confirmPassword.errors['passwordMismatch'];
            if (Object.keys(confirmPassword.errors).length === 0) {
                confirmPassword.setErrors(null);
            }
        }
        
        return null;
    }

    changePassword(): void {
        if (this.changePasswordForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.showAlert = false;

        this._authService.changePassword(this.changePasswordForm.value).subscribe({
            next: () => {
                this.alert = {
                    type: 'success',
                    message: 'Mật khẩu đã được thay đổi thành công!'
                };
                this.showAlert = true;
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    this._dialogRef.close(true);
                }, 2000);
            },
            error: (error) => {
                this.alert = {
                    type: 'error',
                    message: error.error?.message || 'Có lỗi xảy ra khi thay đổi mật khẩu'
                };
                this.showAlert = true;
                this.isLoading = false;
            }
        });
    }

    onCancel(): void {
        this._dialogRef.close(false);
    }
} 