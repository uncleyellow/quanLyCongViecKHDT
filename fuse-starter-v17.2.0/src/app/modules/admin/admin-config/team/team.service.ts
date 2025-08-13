import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.local';

export interface User {
    id: string;
    name: string;
    email: string;
    type?: string;
    departmentId?: string;
    departmentName?: string;
    companyId?: string;
    companyName?: string;
    status?: string;
    createdAt?: string;
}

export interface ApiResponse<T> {
    code: number;
    status: string;
    message: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    // Get all users for dropdown
    getUsers(): Observable<ApiResponse<User[]>> {
        const params = new HttpParams()
            .set('limit', '100')  // Lấy 100 bản ghi
            .set('page', '1');    // Trang đầu tiên
        
        return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`, { params });
    }
}
