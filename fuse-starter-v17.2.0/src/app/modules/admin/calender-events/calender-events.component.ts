import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

export interface CalendarEvent {
    id: string;
    title: string;
    type: 'meeting' | 'task' | 'reminder' | 'deadline';
    description: string;
    start: string;
    end: string;
    participants: Participant[];
    relatedToMe: boolean;
    location: string;
    color?: string;
    allDay?: boolean;
}

export interface Participant {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
}

export interface CalendarFilter {
    startDate: Date | null;
    endDate: Date | null;
    eventType: string;
    relatedToMe: boolean;
    participants: string[];
    searchText: string;
}

@Component({
    selector: 'calender-events',
    templateUrl: './calender-events.component.html',
    styleUrls: ['./calender-events.component.scss']
})
export class CalenderEventsComponent implements OnInit, OnDestroy {
    @ViewChild('calendarContainer') calendarContainer!: ElementRef;

    // Calendar state
    currentDate: Date = new Date();
    today: Date = new Date();
    viewMode: 'month' | 'week' | 'day' = 'month';
    events: CalendarEvent[] = [];
    filteredEvents: CalendarEvent[] = [];
    
    // Filter state
    filter: CalendarFilter = {
        startDate: null,
        endDate: null,
        eventType: '',
        relatedToMe: false,
        participants: [],
        searchText: ''
    };

    // UI state
    showFilterPanel = false;
    showAddEventDialog = false;
    selectedEvent: CalendarEvent | null = null;
    loading = false;

    // Form model for new/edit event
    eventForm = {
        title: '',
        type: 'meeting' as 'meeting' | 'task' | 'reminder' | 'deadline',
        description: '',
        start: '',
        end: '',
        location: '',
        participants: [] as Participant[],
        relatedToMe: false,
        allDay: false
    };

    // Available participants
    availableParticipants: Participant[] = [
        { id: 'u1', name: 'Nguyễn Văn A', avatar: 'assets/images/avatars/male-01.jpg', email: 'user1@example.com' },
        { id: 'u2', name: 'Trần Thị B', avatar: 'assets/images/avatars/female-01.jpg', email: 'user2@example.com' },
        { id: 'u3', name: 'Giang IT', avatar: 'assets/images/avatars/male-03.jpg', email: 'giangit@gmail.com' },
        { id: 'u4', name: 'Huyen', avatar: 'assets/images/avatars/female-01.jpg', email: 'huyen@gmail.com' },
        { id: 'u5', name: 'Tuan Anh', avatar: 'assets/images/avatars/male-02.jpg', email: 'tuananh@gmail.com' }
    ];

    // Event types
    eventTypes = [
        { value: 'meeting', label: 'Cuộc họp', icon: 'meeting_room', color: '#2196f3' },
        { value: 'task', label: 'Công việc', icon: 'assignment', color: '#4caf50' },
        { value: 'reminder', label: 'Nhắc nhở', icon: 'notifications', color: '#ff9800' },
        { value: 'deadline', label: 'Deadline', icon: 'schedule', color: '#f44336' }
    ];

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadSampleData();
        this.applyFilters();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // Load sample data
    loadSampleData(): void {
        this.events = [
            {
                id: '1',
                title: 'Họp dự án Ratraco',
                type: 'meeting',
                description: 'Họp kick-off dự án Ratraco, thảo luận về timeline và phân công công việc',
                start: '2024-06-20T09:00:00',
                end: '2024-06-20T10:30:00',
                participants: [
                    { id: 'u1', name: 'Nguyễn Văn A' },
                    { id: 'u2', name: 'Trần Thị B' },
                    { id: 'u3', name: 'Giang IT' }
                ],
                relatedToMe: true,
                location: 'Phòng họp 1',
                color: '#2196f3'
            },
            {
                id: '2',
                title: 'Làm báo cáo tuần',
                type: 'task',
                description: 'Chuẩn bị báo cáo tuần cho phòng ban, tổng hợp kết quả công việc',
                start: '2024-06-21T14:00:00',
                end: '2024-06-21T16:00:00',
                participants: [
                    { id: 'u1', name: 'Nguyễn Văn A' }
                ],
                relatedToMe: true,
                location: 'Online',
                color: '#4caf50'
            },
            {
                id: '3',
                title: 'Họp phòng kỹ thuật',
                type: 'meeting',
                description: 'Họp định kỳ phòng kỹ thuật, cập nhật tiến độ dự án',
                start: '2024-06-22T10:00:00',
                end: '2024-06-22T11:00:00',
                participants: [
                    { id: 'u2', name: 'Trần Thị B' },
                    { id: 'u3', name: 'Giang IT' },
                    { id: 'u4', name: 'Huyen' }
                ],
                relatedToMe: false,
                location: 'Phòng họp 2',
                color: '#2196f3'
            },
            {
                id: '4',
                title: 'Deadline báo cáo tháng',
                type: 'deadline',
                description: 'Hạn chót nộp báo cáo tháng cho ban lãnh đạo',
                start: '2024-06-25T17:00:00',
                end: '2024-06-25T17:00:00',
                participants: [
                    { id: 'u1', name: 'Nguyễn Văn A' },
                    { id: 'u5', name: 'Tuan Anh' }
                ],
                relatedToMe: true,
                location: 'Online',
                color: '#f44336',
                allDay: true
            },
            {
                id: '5',
                title: 'Nhắc nhở kiểm tra hệ thống',
                type: 'reminder',
                description: 'Kiểm tra và bảo trì hệ thống định kỳ',
                start: '2024-06-23T08:00:00',
                end: '2024-06-23T09:00:00',
                participants: [
                    { id: 'u3', name: 'Giang IT' }
                ],
                relatedToMe: false,
                location: 'Server Room',
                color: '#ff9800'
            }
        ];
    }

    // Filter methods
    applyFilters(): void {
        this.filteredEvents = this.events.filter(event => {
            // Date filter
            if (this.filter.startDate && new Date(event.start) < this.filter.startDate) {
                return false;
            }
            if (this.filter.endDate && new Date(event.end) > this.filter.endDate) {
                return false;
            }

            // Event type filter
            if (this.filter.eventType && event.type !== this.filter.eventType) {
                return false;
            }

            // Related to me filter
            if (this.filter.relatedToMe && !event.relatedToMe) {
                return false;
            }

            // Participants filter
            if (this.filter.participants.length > 0) {
                const eventParticipantIds = event.participants.map(p => p.id);
                const hasMatchingParticipant = this.filter.participants.some(participantId => 
                    eventParticipantIds.includes(participantId)
                );
                if (!hasMatchingParticipant) {
                    return false;
                }
            }

            // Search text filter
            if (this.filter.searchText) {
                const searchLower = this.filter.searchText.toLowerCase();
                const matchesTitle = event.title.toLowerCase().includes(searchLower);
                const matchesDescription = event.description.toLowerCase().includes(searchLower);
                const matchesLocation = event.location.toLowerCase().includes(searchLower);
                if (!matchesTitle && !matchesDescription && !matchesLocation) {
                    return false;
                }
            }

            return true;
        });
    }

    resetFilters(): void {
        this.filter = {
            startDate: null,
            endDate: null,
            eventType: '',
            relatedToMe: false,
            participants: [],
            searchText: ''
        };
        this.applyFilters();
    }

    // Calendar navigation
    previousPeriod(): void {
        switch (this.viewMode) {
            case 'month':
                this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
                break;
            case 'week':
                this.currentDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'day':
                this.currentDate = new Date(this.currentDate.getTime() - 24 * 60 * 60 * 1000);
                break;
        }
    }

    nextPeriod(): void {
        switch (this.viewMode) {
            case 'month':
                this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
                break;
            case 'week':
                this.currentDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'day':
                this.currentDate = new Date(this.currentDate.getTime() + 24 * 60 * 60 * 1000);
                break;
        }
    }

    goToToday(): void {
        this.currentDate = new Date();
    }

    // Event management
    addEvent(): void {
        this.resetEventForm();
        this.showAddEventDialog = true;
        this.selectedEvent = null;
    }

    editEvent(event: CalendarEvent): void {
        this.selectedEvent = { ...event };
        this.populateEventForm(event);
        this.showAddEventDialog = true;
    }

    deleteEvent(event: CalendarEvent): void {
        if (confirm(`Bạn có chắc muốn xóa sự kiện "${event.title}"?`)) {
            this.events = this.events.filter(e => e.id !== event.id);
            this.applyFilters();
            this.snackBar.open('Đã xóa sự kiện thành công', 'Đóng', { duration: 3000 });
        }
    }

    saveEvent(): void {
        if (this.selectedEvent) {
            // Update existing event
            const index = this.events.findIndex(e => e.id === this.selectedEvent!.id);
            if (index !== -1) {
                this.events[index] = { 
                    ...this.selectedEvent, 
                    ...this.eventForm,
                    color: this.getEventTypeColor(this.eventForm.type)
                };
            }
        } else {
            // Add new event
            const newEvent: CalendarEvent = {
                id: Date.now().toString(),
                ...this.eventForm,
                color: this.getEventTypeColor(this.eventForm.type)
            };
            this.events.push(newEvent);
        }

        this.applyFilters();
        this.showAddEventDialog = false;
        this.selectedEvent = null;
        this.resetEventForm();
        this.snackBar.open('Đã lưu sự kiện thành công', 'Đóng', { duration: 3000 });
    }

    resetEventForm(): void {
        this.eventForm = {
            title: '',
            type: 'meeting',
            description: '',
            start: '',
            end: '',
            location: '',
            participants: [],
            relatedToMe: false,
            allDay: false
        };
    }

    populateEventForm(event: CalendarEvent): void {
        this.eventForm = {
            title: event.title,
            type: event.type,
            description: event.description,
            start: event.start,
            end: event.end,
            location: event.location,
            participants: [...event.participants],
            relatedToMe: event.relatedToMe,
            allDay: event.allDay || false
        };
    }

    // Utility methods
    getEventTypeColor(type: string): string {
        const eventType = this.eventTypes.find(et => et.value === type);
        return eventType?.color || '#9e9e9e';
    }

    getEventTypeLabel(type: string): string {
        const eventType = this.eventTypes.find(et => et.value === type);
        return eventType?.label || type;
    }

    getEventTypeIcon(type: string): string {
        const eventType = this.eventTypes.find(et => et.value === type);
        return eventType?.icon || 'event';
    }

    formatEventTime(start: string, end: string): string {
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (startDate.toDateString() === endDate.toDateString()) {
            return `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
        }
    }

    getEventsForDate(date: Date): CalendarEvent[] {
        const dateStr = date.toISOString().split('T')[0];
        return this.filteredEvents.filter(event => {
            const eventStart = new Date(event.start).toISOString().split('T')[0];
            return eventStart === dateStr;
        });
    }

    // Calendar view helpers
    getMonthDays(): Date[] {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const days: Date[] = [];
        const current = new Date(startDate);
        
        while (current <= lastDay || current.getDay() !== 0) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isCurrentMonth(date: Date): boolean {
        return date.getMonth() === this.currentDate.getMonth() && 
               date.getFullYear() === this.currentDate.getFullYear();
    }
} 