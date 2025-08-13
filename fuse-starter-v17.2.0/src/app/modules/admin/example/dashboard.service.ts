import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment.local';

export interface WorkStatistics {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number; // Added overdue as required field
    // Optional fields for backward compatibility
    completed?: number;
    pending?: number;
    paused?: number;
    completedPercentage?: number;
    inProgressPercentage?: number;
    pendingPercentage?: number;
    overduePercentage?: number;
}

export interface ActiveMember {
    id: string;
    name: string;
    email: string;
    avatar: string;
    userType: string;
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    overdueTasks: number;
}

export interface BasicUser {
    id: string;
    name: string;
    email: string;
    avatar: string;
    userType: string;
}

export interface DashboardResponse {
    code: number;
    status: string;
    message: string;
    data: WorkStatistics;
}

export interface ActiveMembersResponse {
    code: number;
    status: string;
    message: string;
    data: ActiveMember[];
}

export interface BasicUserListResponse {
    code: number;
    status: string;
    message: string;
    data: BasicUser[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    /**
     * Get work statistics from dashboard API
     */
    getWorkStatistics(): Observable<DashboardResponse> {
        return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard/work-statistics`);
    }

    /**
     * Get active members from dashboard API
     */
    getActiveMembers(): Observable<ActiveMembersResponse> {
        return this.http.get<ActiveMembersResponse>(`${this.apiUrl}/dashboard/active-members`);
    }

    /**
     * Get basic user list for selection
     */
    getBasicUserList(): Observable<BasicUserListResponse> {
        return this.http.get<BasicUserListResponse>(`${this.apiUrl}/users/basic-list`);
    }
}
