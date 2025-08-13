import { Component, Input, Output, EventEmitter, OnInit, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { Observable, Subject, takeUntil, startWith, map } from 'rxjs';
import { DashboardService, BasicUser } from '../../../modules/admin/example/dashboard.service';

@Component({
    selector: 'app-user-select',
    templateUrl: './user-select.component.html',
    styleUrls: ['./user-select.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UserSelectComponent),
            multi: true
        }
    ]
})
export class UserSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() placeholder: string = 'Chọn người dùng';
    @Input() label: string = 'Người dùng';
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() multiple: boolean = false;
    @Input() showAvatar: boolean = true;
    @Input() showEmail: boolean = true;
    @Input() showUserType: boolean = true;
    @Output() userSelected = new EventEmitter<string>();

    users: BasicUser[] = [];
    filteredUsers: Observable<BasicUser[]>;
    searchControl = new FormControl('');
    selectedUsers: BasicUser[] = [];
    loading: boolean = false;
    error: string = '';
    isDropdownOpen: boolean = false;

    private _unsubscribeAll = new Subject<void>();

    // ControlValueAccessor implementation
    private onChange = (value: any) => {};
    private onTouched = () => {};

    constructor(private dashboardService: DashboardService) {}

    ngOnInit(): void {
        this.loadUsers();
        this.setupFilter();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    loadUsers(): void {
        this.loading = true;
        this.error = '';

        this.dashboardService.getBasicUserList()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.users = response.data;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading users:', error);
                    this.error = 'Không thể tải danh sách người dùng';
                    this.loading = false;
                }
            });
    }

    setupFilter(): void {
        this.filteredUsers = this.searchControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterUsers(value || ''))
        );
    }

    getDisplayUsers(): BasicUser[] {
        const searchValue = this.searchControl.value || '';
        if (searchValue.trim() === '') {
            return this.users;
        }
        return this._filterUsers(searchValue);
    }

    onInputFocus(): void {
        this.isDropdownOpen = true;
    }

    onInputBlur(): void {
        // Delay để cho phép click vào dropdown options
        setTimeout(() => {
            this.isDropdownOpen = false;
        }, 200);
    }

    onDropdownClick(event: Event): void {
        // Ngăn chặn blur event khi click vào dropdown
        event.stopPropagation();
    }

    private _filterUsers(value: string): BasicUser[] {
        const filterValue = value.toLowerCase();
        return this.users.filter(user => 
            user.name.toLowerCase().includes(filterValue) ||
            user.email.toLowerCase().includes(filterValue) ||
            user.userType.toLowerCase().includes(filterValue)
        );
    }

    onUserSelect(user: BasicUser): void {
        if (this.multiple) {
            const index = this.selectedUsers.findIndex(u => u.id === user.id);
            if (index > -1) {
                this.selectedUsers.splice(index, 1);
            } else {
                this.selectedUsers.push(user);
            }
            this.onChange(this.selectedUsers.map(u => u.id));
        } else {
            this.selectedUsers = [user];
            this.onChange(user.id);
            // Đóng dropdown sau khi chọn user (single selection)
            this.isDropdownOpen = false;
        }
        this.onTouched();
        
        // Emit event để parent component có thể handle
        this.userSelected.emit(user.id);
    }

    isUserSelected(user: BasicUser): boolean {
        return this.selectedUsers.some(u => u.id === user.id);
    }

    removeUser(user: BasicUser): void {
        const index = this.selectedUsers.findIndex(u => u.id === user.id);
        if (index > -1) {
            this.selectedUsers.splice(index, 1);
            if (this.multiple) {
                this.onChange(this.selectedUsers.map(u => u.id));
            } else {
                this.onChange(null);
            }
            this.onTouched();
        }
    }

    clearSelection(): void {
        this.selectedUsers = [];
        this.onChange(this.multiple ? [] : null);
        this.onTouched();
    }

    getUserTypeDisplay(userType: string): string {
        const typeMap: { [key: string]: string } = {
            'staff': 'Nhân viên',
            'manager': 'Quản lý',
            'boss': 'Giám đốc',
            'admin': 'Quản trị viên'
        };
        return typeMap[userType] || userType;
    }

    getUserTypeColor(userType: string): string {
        const colorMap: { [key: string]: string } = {
            'staff': 'bg-blue-100 text-blue-800',
            'manager': 'bg-green-100 text-green-800',
            'boss': 'bg-purple-100 text-purple-800',
            'admin': 'bg-red-100 text-red-800'
        };
        return colorMap[userType] || 'bg-gray-100 text-gray-800';
    }

    // ControlValueAccessor implementation
    writeValue(value: any): void {
        if (value) {
            if (this.multiple && Array.isArray(value)) {
                this.selectedUsers = this.users.filter(user => value.includes(user.id));
            } else if (!this.multiple && typeof value === 'string') {
                const user = this.users.find(u => u.id === value);
                this.selectedUsers = user ? [user] : [];
            }
        } else {
            this.selectedUsers = [];
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        if (isDisabled) {
            this.searchControl.disable();
        } else {
            this.searchControl.enable();
        }
    }
}
