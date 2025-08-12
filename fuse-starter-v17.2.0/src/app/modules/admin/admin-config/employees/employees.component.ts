import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { EmployeesService, Employee, PaginationInfo } from './employees.service';
import { DepartmentsService, Company, Department } from '../departments/departments.service';
import { EmployeeDialogComponent, EmployeeDialogData } from './employee-dialog/employee-dialog.component';

@Component({
    selector       : 'settings-employees',
    templateUrl    : './employees.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsEmployeesComponent implements OnInit, OnDestroy
{
    @ViewChild('employeesPaginator') employeesPaginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    // Employees data
    employeesDataSource: MatTableDataSource<Employee>;
    employeesDisplayedColumns: string[] = ['name', 'email', 'type', 'company_name', 'department_name', 'status', 'actions'];
    employees: Employee[] = [];
    employeesPagination: PaginationInfo = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    };

    // Companies and Departments for dropdowns
    companies: Company[] = [];
    departments: Department[] = [];

    // UI state
    isLoading: boolean = false;
    flashMessage: string | null = null;

    // Search state
    employeeSearchTerm: string = '';

    // Sort state
    employeeSort: string = '';
    employeeOrder: string = '';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _employeesService: EmployeesService,
        private _departmentsService: DepartmentsService,
        private _dialog: MatDialog
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Initialize data sources
        this.employeesDataSource = new MatTableDataSource(this.employees);

        // Load data
        this.loadCompanies();
        this.loadDepartments();
        this.loadEmployees();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Set up sorting
        this.employeesDataSource.sort = this.sort;
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Load companies from API
     */
    loadCompanies(): void
    {
        this._departmentsService.getCompanies(1, 1000)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.companies = response.data;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading companies:', error);
                }
            });
    }

    /**
     * Load departments from API
     */
    loadDepartments(): void
    {
        this._departmentsService.getDepartments(1, 1000)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.departments = response.data;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading departments:', error);
                }
            });
    }

    /**
     * Load employees from API
     */
    loadEmployees(): void
    {
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();

        this._employeesService.getEmployees(
            this.employeesPagination.page, 
            this.employeesPagination.limit, 
            this.employeeSearchTerm,
            this.employeeSort,
            this.employeeOrder
        )
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.employees = response.data;
                    this.employeesDataSource.data = this.employees;
                    
                    // Update pagination info
                    if (response.pagination) {
                        this.employeesPagination = response.pagination;
                    } else {
                        // Fallback: calculate pagination from data
                        this.employeesPagination.total = this.employees.length;
                        this.employeesPagination.totalPages = Math.ceil(this.employeesPagination.total / this.employeesPagination.limit);
                    }
                    
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading employees:', error);
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Handle employees pagination
     */
    onEmployeesPageChange(event: PageEvent): void
    {
        this.employeesPagination.page = event.pageIndex + 1;
        this.employeesPagination.limit = event.pageSize;
        this.loadEmployees();
    }

    /**
     * Handle employees sorting
     */
    onEmployeesSortChange(event: any): void
    {
        this.employeeSort = event.active;
        this.employeeOrder = event.direction;
        
        // Reset to first page when sorting
        this.employeesPagination.page = 1;
        this.loadEmployees();
    }

    /**
     * Create new employee
     */
    createEmployee(): void
    {
        const dialogRef = this._dialog.open(EmployeeDialogComponent, {
            width: '600px',
            data: {
                mode: 'create',
                companies: this.companies,
                departments: this.departments
            } as EmployeeDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._employeesService.createEmployee(result)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadEmployees();
                            this.flashMessage = 'success';
                            this._changeDetectorRef.markForCheck();
                            setTimeout(() => {
                                this.flashMessage = null;
                                this._changeDetectorRef.markForCheck();
                            }, 3000);
                        },
                        error: (error) => {
                            console.error('Error creating employee:', error);
                        }
                    });
            }
        });
    }

    /**
     * Edit employee
     */
    editEmployee(employee: Employee): void
    {
        const dialogRef = this._dialog.open(EmployeeDialogComponent, {
            width: '600px',
            data: {
                mode: 'edit',
                employee: employee,
                companies: this.companies,
                departments: this.departments
            } as EmployeeDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Remove id from the data being sent to API
                const { id, ...updateData } = result;
                this._employeesService.updateEmployee(id, updateData)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadEmployees();
                            this.flashMessage = 'success';
                            this._changeDetectorRef.markForCheck();
                            setTimeout(() => {
                                this.flashMessage = null;
                                this._changeDetectorRef.markForCheck();
                            }, 3000);
                        },
                        error: (error) => {
                            console.error('Error updating employee:', error);
                        }
                    });
            }
        });
    }

    /**
     * Delete employee
     */
    deleteEmployee(employee: Employee): void
    {
        if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
            this._employeesService.deleteEmployee(employee.id)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: () => {
                        this.loadEmployees();
                        this.flashMessage = 'success';
                        this._changeDetectorRef.markForCheck();
                        setTimeout(() => {
                            this.flashMessage = null;
                            this._changeDetectorRef.markForCheck();
                        }, 3000);
                    },
                    error: (error) => {
                        console.error('Error deleting employee:', error);
                    }
                });
        }
    }

    /**
     * Apply filter to employees table
     */
    applyEmployeeFilter(event: Event): void
    {
        const filterValue = (event.target as HTMLInputElement).value;
        this.employeeSearchTerm = filterValue.trim();
        
        // Reset to first page when searching
        this.employeesPagination.page = 1;
        this.loadEmployees();
    }

    /**
     * Get status display text
     */
    getStatusDisplay(status: string): string
    {
        switch (status) {
            case 'active':
                return 'Đang làm việc';
            case 'inactive':
                return 'Nghỉ việc';
            case 'probation':
                return 'Thử việc';
            default:
                return status;
        }
    }

    /**
     * Get status color class
     */
    getStatusColor(status: string): string
    {
        switch (status) {
            case 'active':
                return 'text-green-600 bg-green-100';
            case 'inactive':
                return 'text-red-600 bg-red-100';
            case 'probation':
                return 'text-yellow-600 bg-yellow-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    }

    /**
     * Get type display text
     */
    getTypeDisplay(type: string): string
    {
        switch (type) {
            case 'admin':
                return 'Admin';
            case 'manager':
                return 'Manager';
            case 'employee':
                return 'Nhân viên';
            case 'intern':
                return 'Thực tập sinh';
            default:
                return type;
        }
    }

    /**
     * Get type color class
     */
    getTypeColor(type: string): string
    {
        switch (type) {
            case 'admin':
                return 'text-purple-600 bg-purple-100';
            case 'manager':
                return 'text-blue-600 bg-blue-100';
            case 'employee':
                return 'text-green-600 bg-green-100';
            case 'intern':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
