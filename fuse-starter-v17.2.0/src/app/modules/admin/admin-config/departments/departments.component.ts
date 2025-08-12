import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { DepartmentsService, Company, Department } from './departments.service';

@Component({
    selector       : 'settings-departments',
    templateUrl    : './departments.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsDepartmentsComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    // Companies data
    companiesDataSource: MatTableDataSource<Company>;
    companiesDisplayedColumns: string[] = ['name', 'description', 'created_at', 'actions'];
    companies: Company[] = [];

    // Departments data
    departmentsDataSource: MatTableDataSource<Department>;
    departmentsDisplayedColumns: string[] = ['name', 'company_name', 'description', 'created_at', 'actions'];
    departments: Department[] = [];

    // Form controls
    searchInputControl: any;
    selectedCompanyForm: UntypedFormGroup;
    selectedDepartmentForm: UntypedFormGroup;

    // UI state
    isLoading: boolean = false;
    selectedCompany: Company | null = null;
    selectedDepartment: Department | null = null;
    flashMessage: string | null = null;
    activeTab: number = 0;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _departmentsService: DepartmentsService
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

        // Create forms
        this.selectedCompanyForm = this._formBuilder.group({
            name: ['', Validators.required],
            description: ['']
        });

        this.selectedDepartmentForm = this._formBuilder.group({
            name: ['', Validators.required],
            company_id: ['', Validators.required],
            description: ['']
        });

        // Load data
        this.loadCompanies();
        this.loadDepartments();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Set up sorting and pagination
        this.companiesDataSource.paginator = this.paginator;
        this.companiesDataSource.sort = this.sort;
        this.departmentsDataSource.paginator = this.paginator;
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

        this._departmentsService.getCompanies()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.companies = response.data;
                    this.companiesDataSource.data = this.companies;
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

        this._departmentsService.getDepartments()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.departments = response.data;
                    this.departmentsDataSource.data = this.departments;
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
     * Create new company
     */
    createCompany(): void
    {
        this.selectedCompany = {
            id: '',
            name: '',
            description: ''
        };
        this.selectedCompanyForm.patchValue(this.selectedCompany);
        this.activeTab = 0;
    }

    /**
     * Create new department
     */
    createDepartment(): void
    {
        this.selectedDepartment = {
            id: '',
            name: '',
            company_id: '',
            description: ''
        };
        this.selectedDepartmentForm.patchValue(this.selectedDepartment);
        this.activeTab = 1;
    }

    /**
     * Edit company
     */
    editCompany(company: Company): void
    {
        this.selectedCompany = { ...company };
        this.selectedCompanyForm.patchValue(this.selectedCompany);
    }

    /**
     * Edit department
     */
    editDepartment(department: Department): void
    {
        this.selectedDepartment = { ...department };
        this.selectedDepartmentForm.patchValue(this.selectedDepartment);
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
     * Update company
     */
    updateCompany(): void
    {
        if (this.selectedCompanyForm.valid && this.selectedCompany) {
            const formValue = this.selectedCompanyForm.value;
            
            if (this.selectedCompany.id) {
                // Update existing
                this._departmentsService.updateCompany(this.selectedCompany.id, formValue)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadCompanies();
                            this.selectedCompany = null;
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
            } else {
                // Create new
                this._departmentsService.createCompany(formValue)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadCompanies();
                            this.selectedCompany = null;
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
        }
    }

    /**
     * Update department
     */
    updateDepartment(): void
    {
        if (this.selectedDepartmentForm.valid && this.selectedDepartment) {
            const formValue = this.selectedDepartmentForm.value;
            
            if (this.selectedDepartment.id) {
                // Update existing
                this._departmentsService.updateDepartment(this.selectedDepartment.id, formValue)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadDepartments();
                            this.selectedDepartment = null;
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
            } else {
                // Create new
                this._departmentsService.createDepartment(formValue)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: () => {
                            this.loadDepartments();
                            this.selectedDepartment = null;
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
        }
    }

    /**
     * Apply filter to companies table
     */
    applyCompanyFilter(event: Event): void
    {
        const filterValue = (event.target as HTMLInputElement).value;
        this.companiesDataSource.filter = filterValue.trim().toLowerCase();

        if (this.companiesDataSource.paginator) {
            this.companiesDataSource.paginator.firstPage();
        }
    }

    /**
     * Apply filter to departments table
     */
    applyDepartmentFilter(event: Event): void
    {
        const filterValue = (event.target as HTMLInputElement).value;
        this.departmentsDataSource.filter = filterValue.trim().toLowerCase();

        if (this.departmentsDataSource.paginator) {
            this.departmentsDataSource.paginator.firstPage();
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
