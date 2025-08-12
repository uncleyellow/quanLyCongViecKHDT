import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { DepartmentsService, Company, Department, PaginationInfo } from './departments.service';
import { CompanyDialogComponent, CompanyDialogData } from './company-dialog/company-dialog.component';
import { DepartmentDialogComponent, DepartmentDialogData } from './department-dialog/department-dialog.component';

@Component({
    selector       : 'settings-departments',
    templateUrl    : './departments.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsDepartmentsComponent implements OnInit, OnDestroy
{
    @ViewChild('companiesPaginator') companiesPaginator: MatPaginator;
    @ViewChild('departmentsPaginator') departmentsPaginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    // Companies data
    companiesDataSource: MatTableDataSource<Company>;
    companiesDisplayedColumns: string[] = ['name', 'description', 'created_at', 'actions'];
    companies: Company[] = [];
    companiesPagination: PaginationInfo = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    };

    // Departments data
    departmentsDataSource: MatTableDataSource<Department>;
    departmentsDisplayedColumns: string[] = ['name', 'company_name', 'description', 'created_at', 'actions'];
    departments: Department[] = [];
    departmentsPagination: PaginationInfo = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    };

    // UI state
    isLoading: boolean = false;
    flashMessage: string | null = null;
    activeTab: number = 0;

    // Search state
    companySearchTerm: string = '';
    departmentSearchTerm: string = '';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
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
        this.companiesDataSource = new MatTableDataSource(this.companies);
        this.departmentsDataSource = new MatTableDataSource(this.departments);

        // Load data
        this.loadCompanies();
        this.loadDepartments();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Set up sorting
        this.companiesDataSource.sort = this.sort;
        this.departmentsDataSource.sort = this.sort;
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
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();

        this._departmentsService.getCompanies(
            this.companiesPagination.page, 
            this.companiesPagination.limit, 
            this.companySearchTerm
        )
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.companies = response.data;
                    this.companiesDataSource.data = this.companies;
                    
                    // Update pagination info
                    if (response.pagination) {
                        this.companiesPagination = response.pagination;
                    } else {
                        // Fallback: calculate pagination from data
                        this.companiesPagination.total = this.companies.length;
                        this.companiesPagination.totalPages = Math.ceil(this.companiesPagination.total / this.companiesPagination.limit);
                    }
                    
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading companies:', error);
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Load departments from API
     */
    loadDepartments(): void
    {
        this.isLoading = true;
        this._changeDetectorRef.markForCheck();

        this._departmentsService.getDepartments(
            this.departmentsPagination.page, 
            this.departmentsPagination.limit, 
            this.departmentSearchTerm
        )
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.departments = response.data;
                    this.departmentsDataSource.data = this.departments;
                    
                    // Update pagination info
                    if (response.pagination) {
                        this.departmentsPagination = response.pagination;
                    } else {
                        // Fallback: calculate pagination from data
                        this.departmentsPagination.total = this.departments.length;
                        this.departmentsPagination.totalPages = Math.ceil(this.departmentsPagination.total / this.departmentsPagination.limit);
                    }
                    
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading departments:', error);
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    /**
     * Handle companies pagination
     */
    onCompaniesPageChange(event: PageEvent): void
    {
        this.companiesPagination.page = event.pageIndex + 1;
        this.companiesPagination.limit = event.pageSize;
        this.loadCompanies();
    }

    /**
     * Handle departments pagination
     */
    onDepartmentsPageChange(event: PageEvent): void
    {
        this.departmentsPagination.page = event.pageIndex + 1;
        this.departmentsPagination.limit = event.pageSize;
        this.loadDepartments();
    }

    /**
     * Create new company
     */
    createCompany(): void
    {
        const dialogRef = this._dialog.open(CompanyDialogComponent, {
            width: '500px',
            data: {
                mode: 'create'
            } as CompanyDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._departmentsService.createCompany(result)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadCompanies();
                            this.flashMessage = 'success';
                            this._changeDetectorRef.markForCheck();
                            setTimeout(() => {
                                this.flashMessage = null;
                                this._changeDetectorRef.markForCheck();
                            }, 3000);
                        },
                        error: (error) => {
                            console.error('Error creating company:', error);
                        }
                    });
            }
        });
    }

    /**
     * Create new department
     */
    createDepartment(): void
    {
        const dialogRef = this._dialog.open(DepartmentDialogComponent, {
            width: '500px',
            data: {
                mode: 'create',
                companies: this.companies
            } as DepartmentDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._departmentsService.createDepartment(result)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadDepartments();
                            this.flashMessage = 'success';
                            this._changeDetectorRef.markForCheck();
                            setTimeout(() => {
                                this.flashMessage = null;
                                this._changeDetectorRef.markForCheck();
                            }, 3000);
                        },
                        error: (error) => {
                            console.error('Error creating department:', error);
                        }
                    });
            }
        });
    }

    /**
     * Edit company
     */
    editCompany(company: Company): void
    {
        const dialogRef = this._dialog.open(CompanyDialogComponent, {
            width: '500px',
            data: {
                mode: 'edit',
                company: company
            } as CompanyDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._departmentsService.updateCompany(result.id, result)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadCompanies();
                            this.flashMessage = 'success';
                            this._changeDetectorRef.markForCheck();
                            setTimeout(() => {
                                this.flashMessage = null;
                                this._changeDetectorRef.markForCheck();
                            }, 3000);
                        },
                        error: (error) => {
                            console.error('Error updating company:', error);
                        }
                    });
            }
        });
    }

    /**
     * Edit department
     */
    editDepartment(department: Department): void
    {
        const dialogRef = this._dialog.open(DepartmentDialogComponent, {
            width: '500px',
            data: {
                mode: 'edit',
                department: department,
                companies: this.companies
            } as DepartmentDialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._departmentsService.updateDepartment(result.id, result)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadDepartments();
                            this.flashMessage = 'success';
                            this._changeDetectorRef.markForCheck();
                            setTimeout(() => {
                                this.flashMessage = null;
                                this._changeDetectorRef.markForCheck();
                            }, 3000);
                        },
                        error: (error) => {
                            console.error('Error updating department:', error);
                        }
                    });
            }
        });
    }

    /**
     * Delete company
     */
    deleteCompany(company: Company): void
    {
        if (confirm('Bạn có chắc chắn muốn xóa công ty này?')) {
            this._departmentsService.deleteCompany(company.id)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: () => {
                        this.loadCompanies();
                        this.flashMessage = 'success';
                        this._changeDetectorRef.markForCheck();
                        setTimeout(() => {
                            this.flashMessage = null;
                            this._changeDetectorRef.markForCheck();
                        }, 3000);
                    },
                    error: (error) => {
                        console.error('Error deleting company:', error);
                    }
                });
        }
    }

    /**
     * Delete department
     */
    deleteDepartment(department: Department): void
    {
        if (confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
            this._departmentsService.deleteDepartment(department.id)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: () => {
                        this.loadDepartments();
                        this.flashMessage = 'success';
                        this._changeDetectorRef.markForCheck();
                        setTimeout(() => {
                            this.flashMessage = null;
                            this._changeDetectorRef.markForCheck();
                        }, 3000);
                    },
                    error: (error) => {
                        console.error('Error deleting department:', error);
                    }
                });
        }
    }

    /**
     * Apply filter to companies table
     */
    applyCompanyFilter(event: Event): void
    {
        const filterValue = (event.target as HTMLInputElement).value;
        this.companySearchTerm = filterValue.trim();
        
        // Reset to first page when searching
        this.companiesPagination.page = 1;
        this.loadCompanies();
    }

    /**
     * Apply filter to departments table
     */
    applyDepartmentFilter(event: Event): void
    {
        const filterValue = (event.target as HTMLInputElement).value;
        this.departmentSearchTerm = filterValue.trim();
        
        // Reset to first page when searching
        this.departmentsPagination.page = 1;
        this.loadDepartments();
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
