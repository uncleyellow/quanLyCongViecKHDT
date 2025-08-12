import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.local';

export interface Employee {
    id: string;
    name: string;
    email: string;
    type?: string; // Thay thế phone bằng type
    departmentId: string;
    departmentName?: string;
    companyId: string;
    companyName?: string;
    status?: string;
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
export class EmployeesService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    // Employee APIs
    getEmployees(page: number = 1, limit: number = 10, search?: string, sort?: string, order?: string): Observable<ApiResponse<Employee[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        if (search) {
            params = params.set('search', search);
        }
        
        if (sort) {
            params = params.set('sort', sort);
        }
        
        if (order) {
            params = params.set('order', order);
        }
        
        return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}/users`, { params });
    }

    getEmployeeById(id: string): Observable<ApiResponse<Employee>> {
        return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/users/${id}`);
    }

    getEmployeesByDepartment(departmentId: string, page: number = 1, limit: number = 10): Observable<ApiResponse<Employee[]>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}/users/department/${departmentId}`, { params });
    }

    getEmployeesByCompany(companyId: string, page: number = 1, limit: number = 10): Observable<ApiResponse<Employee[]>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}/users/company/${companyId}`, { params });
    }

    createEmployee(employee: Partial<Employee>): Observable<ApiResponse<Employee>> {
        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/users`, employee);
    }

    updateEmployee(id: string, employee: Partial<Employee>): Observable<ApiResponse<Employee>> {
        return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}/users/${id}`, employee);
    }

    deleteEmployee(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/users/${id}`);
    }
}
