export interface IBoard
{
    id?: string | null;
    title: string;
    description?: string | null;
    icon?: string | null;
    lastActivity?: string | null;
    lists?: IList[];
    labels?: ILabel[];
    members?: IMember[];
    viewConfig?: ViewConfig;
    recurringConfig?: RecurringConfig;
    // Owner information for grouping
    ownerId?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerRole?: string;
    // Timestamps
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ViewConfig
{
    showTitle?: boolean;
    showDescription?: boolean;
    showDueDate?: boolean;
    showMembers?: boolean;
    showLabels?: boolean;
    showChecklist?: boolean;
    showStatus?: boolean;
    showType?: boolean;
}

export interface RecurringConfig
{
    isRecurring?: boolean;
    completedListId?: string | null;
}

export interface IList
{
    id?: string | null;
    boardId: string;
    title: string;
    color?: string;
    createdAt?: string | null;
    archived?: boolean;
    cards: ICard[];
    cardOrderIds?: string[] | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    deletedBy?: string | null;
    updatedAt?: string | null;
    deletedAt?: string | null;
}

export interface ICard
{
    id?: string | null;
    boardId: string;
    listId: string;
    title: string;
    description?: string | null;
    position?: number;
    dueDate?: string | null;
    type?: string;
    checklistItems?: {id?: string, text: string, checked: boolean}[];
    startDate?: string | null;
    endDate?: string | null;
    members?: string | null;
    createdAt?: string;
    archived?: 0 | 1;
    dependencies?: string | null;
    status?: string;
    labels?: ILabel[];
    // Tracking time fields
    totalTimeSpent?: number;
    isTracking?: number;
    trackingStartTime?: string | null;
    trackingPauseTime?: number;
}

export interface IMember
{
    id?: string | null;
    name: string;
    avatar?: string | null;
}

export interface ILabel
{
    id: string | null;
    boardId: string;
    title: string;
}
