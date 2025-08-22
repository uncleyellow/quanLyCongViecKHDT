import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-user-select-demo',
    templateUrl: './user-select-demo.component.html',
    styleUrls: ['./user-select-demo.component.scss']
})
export class UserSelectDemoComponent implements OnInit {
    demoForm: FormGroup;
    selectedSingleUser: string | null = null;
    selectedMultipleUsers: string[] = [];

    constructor(private fb: FormBuilder) {
        this.demoForm = this.fb.group({
            singleUser: ['', Validators.required],
            multipleUsers: [[], Validators.required],
            optionalUser: [''],
            disabledUser: ['']
        });
    }

    ngOnInit(): void {
        // Set disabled state for demo
        this.demoForm.get('disabledUser')?.disable();
    }

    onSingleUserChange(userId: string): void {
        this.selectedSingleUser = userId;
        console.log('Single user selected:', userId);
    }

    onMultipleUsersChange(userIds: string[]): void {
        this.selectedMultipleUsers = userIds;
        console.log('Multiple users selected:', userIds);
    }

    onFormSubmit(): void {
        if (this.demoForm.valid) {
            console.log('Form submitted:', this.demoForm.value);
            alert('Form submitted successfully! Check console for details.');
        } else {
            console.log('Form is invalid');
            this.markFormGroupTouched();
        }
    }

    private markFormGroupTouched(): void {
        Object.keys(this.demoForm.controls).forEach(key => {
            const control = this.demoForm.get(key);
            control?.markAsTouched();
        });
    }

    resetForm(): void {
        this.demoForm.reset();
        this.selectedSingleUser = null;
        this.selectedMultipleUsers = [];
    }
}
