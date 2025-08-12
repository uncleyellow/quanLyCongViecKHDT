import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    companyId: string;
    companyName?: string;
    description?: string;
    createdAt?: string;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    code: number;
    status: string;
    message: string;
    pagination?: PaginationInfo;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class DepartmentsService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    // Company APIs
    getCompanies(page: number = 1, limit: number = 10, search?: string): Observable<ApiResponse<Company[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        if (search) {
            params = params.set('search', search);
        }
        
        return this.http.get<ApiResponse<Company[]>>(`${this.apiUrl}/companies`, { params });
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
    getDepartments(page: number = 1, limit: number = 10, search?: string): Observable<ApiResponse<Department[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        if (search) {
            params = params.set('search', search);
        }
        
        return this.http.get<ApiResponse<Department[]>>(`${this.apiUrl}/departments`, { params });
    }

    getDepartmentById(id: string): Observable<ApiResponse<Department>> {
        return this.http.get<ApiResponse<Department>>(`${this.apiUrl}/departments/${id}`);
    }

    getDepartmentsByCompany(companyId: string, page: number = 1, limit: number = 10): Observable<ApiResponse<Department[]>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        return this.http.get<ApiResponse<Department[]>>(`${this.apiUrl}/departments/company/${companyId}`, { params });
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
