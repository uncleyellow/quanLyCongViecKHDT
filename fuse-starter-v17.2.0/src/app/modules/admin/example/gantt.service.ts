import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GanttTask {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    dependencies?: string;
    position: number;
    list_id: string;
    description?: string;
    due_date?: string;
    type?: string;
    member?: string;
    status?: string;
}

export interface GanttData {
    tasks: GanttTask[];
}

@Injectable({
    providedIn: 'root'
})
export class GanttService {
    private apiUrl = 'http://localhost:5000/api';

    constructor(private http: HttpClient) {}

    getGanttData(boardId: string, dueDateRange?: { startDate: Date | null; endDate: Date | null }): Observable<GanttTask[]> {
        const params: any = {};
        if (dueDateRange?.startDate) {
            params.startDate = dueDateRange.startDate.toISOString();
        }
        if (dueDateRange?.endDate) {
            params.endDate = dueDateRange.endDate.toISOString();
        }
        return this.http.get<GanttTask[]>(`${this.apiUrl}/boards/${boardId}/gantt`, { params });
    }

    updateTask(taskId: string, taskData: Partial<GanttTask>): Observable<any> {
        return this.http.put(`${this.apiUrl}/cards/${taskId}`, taskData);
    }
}
