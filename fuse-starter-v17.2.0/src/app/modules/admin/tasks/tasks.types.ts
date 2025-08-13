export interface Tag
{
    id?: string;
    title?: string;
}

export interface Task
{
    id: string;
    type: 'task' | 'section';
    title: string;
    notes: string;
    completed: boolean;
    dueDate: string | null;
    priority: 'low' | 'normal' | 'high';
    tags: string[];
    order: number;
    checklistItems?: any[];
}

export interface CustomField {
    value: any;
    type: 'string' | 'number' | 'boolean' | 'date';
    createdAt: string;
    updatedAt?: string;
}

export interface UserCard
{
    id: string;
    boardId: string;
    listId: string;
    title: string;
    description: string | null;
    position: number;
    dueDate: string | null;
    type: string;
    checklistItems: any[];
    labels: any[];
    startDate: string | null;
    endDate: string | null;
    members: any[];
    createdAt: string;
    status: string;
    totalTimeSpent: number;
    isTracking: number;
    trackingStartTime: string | null;
    trackingPauseTime: number;
    boardTitle: string;
    listTitle: string;
    listColor: string;
    metadata?: { [key: string]: CustomField };
}