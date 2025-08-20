import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment.local';

export interface Department {
    id: string;
    name: string;
    description?: string;
    companyId: string;
    companyName?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DepartmentResponse {
    code: number;
    status: string;
    message: string;
    data: Department[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DepartmentService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    /**
     * Get all departments for a company
     */
    getDepartmentsByCompany(companyId: string): Observable<DepartmentResponse> {
        const params = { companyId };
        return this.http.get<DepartmentResponse>(`${this.apiUrl}/departments`, { params });
    }

    /**
     * Get all departments (for admin purposes)
     */
    getAllDepartments(): Observable<DepartmentResponse> {
        return this.http.get<DepartmentResponse>(`${this.apiUrl}/departments`);
    }

    /**
     * Get department by ID
     */
    getDepartmentById(id: string): Observable<DepartmentResponse> {
        return this.http.get<DepartmentResponse>(`${this.apiUrl}/departments/${id}`);
    }
}
