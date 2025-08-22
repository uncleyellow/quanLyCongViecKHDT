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

// Thêm các interface mới cho biểu đồ
export interface ChartData {
    series: number[] | Array<{ name: string; data: number[] }>;
    labels?: string[];
    categories?: string[];
}

export interface ChartDataResponse {
    code: number;
    status: string;
    message: string;
    data: ChartData;
}

export interface DashboardOverview {
    totalBoards: number;
    totalCards: number;
    totalMembers: number;
    completionRate: number;
    recentActivity: Array<{
        title: string;
        status: string;
        updatedAt: string;
        updatedBy: string;
    }>;
}

export interface DashboardOverviewResponse {
    code: number;
    status: string;
    message: string;
    data: DashboardOverview;
}

export interface GanttChartData {
    series: Array<{ name: string; data: number[] }>;
    categories: string[];
    timeRange: string;
}

export interface GanttChartResponse {
    code: number;
    status: string;
    message: string;
    data: GanttChartData;
}

export type ChartType = 'status' | 'timeline' | 'member' | 'priority' | 'department';
export type TimeRange = 'week' | 'month' | 'quarter' | 'day';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    /**
     * Get work statistics from dashboard API
     */
    getWorkStatistics(departmentId?: string, dueDateRange?: { startDate: Date | null; endDate: Date | null }): Observable<DashboardResponse> {
        const params: any = {};
        if (departmentId) {
            params.departmentId = departmentId;
        }
        if (dueDateRange?.startDate) {
            params.startDate = dueDateRange.startDate.toISOString();
        }
        if (dueDateRange?.endDate) {
            params.endDate = dueDateRange.endDate.toISOString();
        }
        
        console.log('DashboardService - getWorkStatistics called with params:', params);
        console.log('Full URL will be:', `${this.apiUrl}/dashboard/work-statistics`);
        
        return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard/work-statistics`, { params });
    }

    /**
     * Get active members from dashboard API
     */
    getActiveMembers(departmentId?: string, dueDateRange?: { startDate: Date | null; endDate: Date | null }): Observable<ActiveMembersResponse> {
        const params: any = {};
        if (departmentId) {
            params.departmentId = departmentId;
        }
        if (dueDateRange?.startDate) {
            params.startDate = dueDateRange.startDate.toISOString();
        }
        if (dueDateRange?.endDate) {
            params.endDate = dueDateRange.endDate.toISOString();
        }
        
        console.log('DashboardService - getActiveMembers called with params:', params);
        
        return this.http.get<ActiveMembersResponse>(`${this.apiUrl}/dashboard/active-members`, { params });
    }

    /**
     * Get basic user list for selection
     */
    getBasicUserList(): Observable<BasicUserListResponse> {
        return this.http.get<BasicUserListResponse>(`${this.apiUrl}/users/basic-list`);
    }

    /**
     * Get chart data for different chart types
     */
    getChartData(chartType: ChartType, timeRange: TimeRange = 'month', departmentId?: string, dueDateRange?: { startDate: Date | null; endDate: Date | null }): Observable<ChartDataResponse> {
        const params: any = { chartType, timeRange };
        if (departmentId) {
            params.departmentId = departmentId;
        }
        if (dueDateRange?.startDate) {
            params.startDate = dueDateRange.startDate.toISOString();
        }
        if (dueDateRange?.endDate) {
            params.endDate = dueDateRange.endDate.toISOString();
        }
        
        console.log('DashboardService - getChartData called with params:', params);
        
        return this.http.get<ChartDataResponse>(`${this.apiUrl}/dashboard/chart-data`, { params });
    }

    /**
     * Get dashboard overview statistics
     */
    getDashboardOverview(): Observable<DashboardOverviewResponse> {
        return this.http.get<DashboardOverviewResponse>(`${this.apiUrl}/dashboard/overview`);
    }

    /**
     * Get Gantt chart data for completed tasks
     */
    getGanttChartData(timeRange: TimeRange = 'month', departmentId?: string, dueDateRange?: { startDate: Date | null; endDate: Date | null }): Observable<GanttChartResponse> {
        const params: any = { timeRange };
        if (departmentId) {
            params.departmentId = departmentId;
        }
        if (dueDateRange?.startDate) {
            params.startDate = dueDateRange.startDate.toISOString();
        }
        if (dueDateRange?.endDate) {
            params.endDate = dueDateRange.endDate.toISOString();
        }
        
        console.log('DashboardService - getGanttChartData called with params:', params);
        
        return this.http.get<GanttChartResponse>(`${this.apiUrl}/dashboard/gantt-chart`, { params });
    }
}
