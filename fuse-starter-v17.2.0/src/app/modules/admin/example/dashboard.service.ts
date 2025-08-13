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
    pausedPercentage?: number;
    overduePercentage?: number;
}

export interface DashboardResponse {
    code: number;
    status: string;
    message: string;
    data: WorkStatistics;
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
}
