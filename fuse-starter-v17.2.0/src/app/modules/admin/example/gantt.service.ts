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

    getGanttData(boardId: string): Observable<GanttTask[]> {
        return this.http.get<GanttTask[]>(`${this.apiUrl}/boards/${boardId}/gantt`);
    }

    updateTask(taskId: string, taskData: Partial<GanttTask>): Observable<any> {
        return this.http.put(`${this.apiUrl}/cards/${taskId}`, taskData);
    }
}
