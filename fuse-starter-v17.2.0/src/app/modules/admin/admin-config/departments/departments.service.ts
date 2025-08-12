import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.local';

export interface Company {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
}

export interface Department {
    id: string;
    name: string;
    company_id: string;
    company_name?: string;
    description?: string;
    created_at?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class DepartmentsService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    // Company APIs
    getCompanies(): Observable<ApiResponse<Company[]>> {
        return this.http.get<ApiResponse<Company[]>>(`${this.apiUrl}/companies`);
    }

    getCompanyById(id: string): Observable<ApiResponse<Company>> {
        return this.http.get<ApiResponse<Company>>(`${this.apiUrl}/companies/${id}`);
    }

    createCompany(company: Partial<Company>): Observable<ApiResponse<Company>> {
        return this.http.post<ApiResponse<Company>>(`${this.apiUrl}/companies`, company);
    }

    updateCompany(id: string, company: Partial<Company>): Observable<ApiResponse<Company>> {
        return this.http.put<ApiResponse<Company>>(`${this.apiUrl}/companies/${id}`, company);
    }

    deleteCompany(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/companies/${id}`);
    }

    // Department APIs
    getDepartments(): Observable<ApiResponse<Department[]>> {
        return this.http.get<ApiResponse<Department[]>>(`${this.apiUrl}/departments`);
    }

    getDepartmentById(id: string): Observable<ApiResponse<Department>> {
        return this.http.get<ApiResponse<Department>>(`${this.apiUrl}/departments/${id}`);
    }

    getDepartmentsByCompany(companyId: string): Observable<ApiResponse<Department[]>> {
        return this.http.get<ApiResponse<Department[]>>(`${this.apiUrl}/departments/company/${companyId}`);
    }

    createDepartment(department: Partial<Department>): Observable<ApiResponse<Department>> {
        return this.http.post<ApiResponse<Department>>(`${this.apiUrl}/departments`, department);
    }

    updateDepartment(id: string, department: Partial<Department>): Observable<ApiResponse<Department>> {
        return this.http.put<ApiResponse<Department>>(`${this.apiUrl}/departments/${id}`, department);
    }

    deleteDepartment(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/departments/${id}`);
    }
}
