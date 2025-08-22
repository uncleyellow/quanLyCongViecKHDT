import { IBoard, ICard, ILabel, IList, IMember, ViewConfig, RecurringConfig } from 'app/modules/admin/scrumboard/scrumboard.types';

// -----------------------------------------------------------------------------------------------------
// @ Board
// -----------------------------------------------------------------------------------------------------
export class Board implements Required<IBoard>
{
    id: string | null;
    title: string;
    description: string | null;
    icon: string | null;
    lastActivity: string | null;
    lists: List[];
    labels: Label[];
    members: Member[];
    viewConfig: ViewConfig;
    recurringConfig: RecurringConfig;
    // Owner information
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    ownerRole: string;
    // Timestamps
    createdAt: string | null;
    updatedAt: string | null;

    /**
     * Constructor
     */
    constructor(board: IBoard)
    {
        this.id = board.id || null;
        this.title = board.title;
        this.description = board.description || null;
        this.icon = board.icon || null;
        this.lastActivity = board.lastActivity || null;
        this.lists = [];
        this.labels = [];
        this.members = [];
        this.viewConfig = board.viewConfig || {
            showTitle: true,
            showDescription: true,
            showDueDate: true,
            showMembers: true,
            showLabels: true,
            showChecklist: true,
            showStatus: true,
            showType: true
        };

        this.recurringConfig = board.recurringConfig || {
            isRecurring: false,
            completedListId: null
        };

        // Owner information
        this.ownerId = board.ownerId || '';
        this.ownerName = board.ownerName || '';
        this.ownerEmail = board.ownerEmail || '';
        this.ownerRole = board.ownerRole || 'staff';

        // Timestamps
        this.createdAt = board.createdAt || null;
        this.updatedAt = board.updatedAt || null;

        // Lists
        if ( board.lists )
        {
            this.lists = board.lists.map((list) => {
                if ( !(list instanceof List) )
                {
                    return new List(list);
                }

                return list;
            });
        }

        // Labels
        if ( board.labels )
        {
            this.labels = board.labels.map((label) => {
                if ( !(label instanceof Label) )
                {
                    return new Label(label);
                }

                return label;
            });
        }

        // Members
        if ( board.members )
        {
            this.members = board.members.map((member) => {
                if ( !(member instanceof Member) )
                {
                    return new Member(member);
                }

                return member;
            });
        }
    }
}

// -----------------------------------------------------------------------------------------------------
// @ List
// -----------------------------------------------------------------------------------------------------
export class List implements Required<IList>
{
    id: string | null;
    boardId: string;
    title: string;
    color: string;
    cards: Card[];
    createdAt: string | null;
    archived: boolean;
    cardOrderIds: string[] | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    updatedAt: string | null;
    deletedAt: string | null;

    /**
     * Constructor
     */
    constructor(list: IList)
    {
        this.id = list.id || null;
        this.boardId = list.boardId;
        this.title = list.title;
        this.color = list.color || '#3B82F6';
        this.cards = [];
        this.createdAt = list.createdAt || null;
        this.archived = list.archived || false;
        this.cardOrderIds = list.cardOrderIds || null;
        this.createdBy = list.createdBy || null;
        this.updatedBy = list.updatedBy || null;
        this.deletedBy = list.deletedBy || null;
        this.updatedAt = list.updatedAt || null;
        this.deletedAt = list.deletedAt || null;

        // Cards
        if ( list.cards )
        {
            this.cards = list.cards.map((card) => {
                if ( !(card instanceof Card) )
                {
                    return new Card(card);
                }

                return card;
            });
        }
    }
}

export class CreateList implements Partial<IList>
{
    boardId: string;
    title: string;
    color: string;

    /**
     * Constructor
     */
    constructor(data: { boardId: string; title: string; color?: string })
    {
        this.boardId = data.boardId;
        this.title = data.title;
        this.color = data.color || '#3B82F6';
    }
}

export class UpdateList implements Partial<IList>
{
    boardId: string;
    title: string;
    color?: string;
    archived?: boolean;
    cardOrderIds?: string[];

    /**
     * Constructor
     */
    constructor(data: { boardId: string; title: string; color?: string; archived?: boolean; cardOrderIds?: string[] })
    {
        this.boardId = data.boardId;
        this.title = data.title;
        this.color = data.color;
        this.archived = data.archived ?? false;
        this.cardOrderIds = data.cardOrderIds ?? [];
    }
}


// -----------------------------------------------------------------------------------------------------
// @ Card
// -----------------------------------------------------------------------------------------------------
export class Card implements Required<ICard>
{
    id: string | null;
    boardId: string;
    listId: string;
    title: string;
    description: string | null;
    position: number;
    dueDate: string | null;
    type: string;
    checklistItems: {id?: string, text: string, checked: boolean}[];
    startDate: string | null;
    endDate: string | null;
    members: string | null;
    createdAt: string;
    archived: 0 | 1;
    dependencies: string | null;
    status: string;
    labels: Label[];
    // Tracking time fields
    totalTimeSpent: number;
    isTracking: number;
    trackingStartTime: string | null;
    trackingPauseTime: number;
    
    /**
     * Constructor
     */
    constructor(card: ICard)
    {
        this.id = card.id ?? null;
        this.boardId = card.boardId;
        this.listId = card.listId;
        this.title = card.title;
        this.description = card.description ?? null;
        this.position = card.position ?? 0;
        this.dueDate = card.dueDate ?? null;
        this.type = card.type ?? 'normal';
        this.checklistItems = card.checklistItems ?? [];
        this.startDate = card.startDate ?? null;
        this.endDate = card.endDate ?? null;
        this.members = card.members ?? null;
        this.createdAt = card.createdAt ?? '';
        this.archived = card.archived ?? 0;
        this.dependencies = card.dependencies ?? null;
        this.status = card.status ?? 'todo';
        this.labels = [];
        // Tracking time fields
        this.totalTimeSpent = card.totalTimeSpent ?? 0;
        this.isTracking = card.isTracking ?? 0;
        this.trackingStartTime = card.trackingStartTime ?? null;
        this.trackingPauseTime = card.trackingPauseTime ?? 0;
    }
}

export class CreateCard implements Partial<ICard>
{
    boardId: string;
    listId: string;
    title: string;
    type: string;
    status: string;
    dueDate?: string | null;

    /**
     * Constructor
     */
    constructor(card: ICard)
    {
        this.boardId = card.boardId;
        this.listId = card.listId;
        this.title = card.title;
        this.type = card.type ?? 'normal';
        this.status = card.status ?? 'todo';
        this.dueDate = card.dueDate ?? null;
    }
}


// -----------------------------------------------------------------------------------------------------
// @ Member
// -----------------------------------------------------------------------------------------------------
export class Member implements Required<IMember>
{
    id: string | null;
    name: string;
    avatar: string | null;

    /**
     * Constructor
     */
    constructor(member: IMember)
    {
        this.id = member.id || null;
        this.name = member.name;
        this.avatar = member.avatar || null;
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Label
// -----------------------------------------------------------------------------------------------------
export class Label implements Required<ILabel>
{
    id: string | null;
    boardId: string;
    title: string;

    /**
     * Constructor
     */
    constructor(label: ILabel)
    {
        this.id = label.id || null;
        this.boardId = label.boardId;
        this.title = label.title;
    }
}
