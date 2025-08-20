import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { GanttService, GanttTask } from './gantt.service';
import { DashboardService, WorkStatistics, ActiveMember } from './dashboard.service';
import { DepartmentService, Department } from './department.service';
import { UserService } from 'app/core/user/user.service';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexDataLabels,
    ApexTitleSubtitle,
    ApexPlotOptions,
    ApexTooltip,
    ApexYAxis,
    ApexNonAxisChartSeries,
    ApexResponsive
} from 'ng-apexcharts';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    tooltip: ApexTooltip;
    title: ApexTitleSubtitle;
    colors?: string[];
};

export type DynamicChartOptions = {
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    chart: ApexChart;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis;
    dataLabels?: ApexDataLabels;
    plotOptions?: ApexPlotOptions;
    tooltip?: ApexTooltip;
    title?: ApexTitleSubtitle;
    colors?: string[];
    labels?: string[];
};

export type PieChartOptions = {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    responsive: ApexResponsive[];
    legend?: any;
    tooltip?: any;
    dataLabels?: any;
};

export interface Widget {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    defaultSize: string;
    config?: any;
}

export interface RecentActivity {
    id: string;
    title: string;
    time: string;
    type: string;
}

export interface ProgressData {
    total: number;
    completed: number;
    completedCount: number;
    inProgress: number;
    pending: number;
    overdue: number;
}

export interface TeamMember {
    id: string;
    name: string;
    avatar: string;
    role: string;
    status: 'online' | 'offline' | 'away';
    tasksCount: number;
}

export interface ProjectMember {
    id: string;
    name: string;
    avatar: string;
    role: string;
    status: 'online' | 'offline' | 'away';
    tasksCount: number;
    doneTasks?: number;
    inProgressTasks?: number;
    overdueTasks?: number;
    todoTasks?: number;
}

export interface WidgetSize {
    cols: string;
    rows: string;
}

export interface ChartType {
    value: string;
    label: string;
}

export interface WidgetSizeOption {
    value: string;
    label: string;
}

@Component({
    selector     : 'example',
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ExampleComponent implements OnInit, OnDestroy
{
    @Input() boardId: string = '';
    @ViewChild('ganttContainer', { static: true }) ganttContainer!: ElementRef;
    
    // Chart options
    chartOptions: Partial<ChartOptions> = {};
    statusChartOptions: Partial<PieChartOptions> = {};
    dynamicChartOptions: Partial<DynamicChartOptions> = {};
    
    // Data
    tasks: GanttTask[] = [];
    recentActivities: RecentActivity[] = [];
    progressData: ProgressData = {
        total: 0,
        completed: 0,
        completedCount: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0
    };
    workStatistics: WorkStatistics | null = null;
    activeMembers: ActiveMember[] = [];
    teamMembers: TeamMember[] = [];
    projectMembers: ProjectMember[] = [];
    
    // Filter properties
    selectedTaskType: string = '';
    selectedAuthor: string = '';
    selectedStatus: string = '';
    dateRange: string = '';
    selectedPriority: string = '';
    completionRate: string = '';
    selectedDepartment: string = '';
    selectedTags: string[] = [];
    workload: string = '';
    
    // Widget management
    showWidgetSelector = false;
    showAdvancedFilters = false;
    showWidgetConfig = false;
    configuringWidget: Widget | null = null;
    selectedChartType: string = 'status';
    selectedTimeRange: string = 'month';
    selectedGanttTimeRange: string = 'month';
    selectedWidgetSize: string = '1x1';
    selectedDataSource: string = 'all';
    refreshInterval: string = '0';
    
    // Widget sizes
    widgetSizes: { [key: string]: WidgetSize } = {
        gantt: { cols: 'span 2', rows: 'span 2' },
        status: { cols: 'span 1', rows: 'span 1' },
        activities: { cols: 'span 1', rows: 'span 2' },
        progress: { cols: 'span 1', rows: 'span 1' },
        members: { cols: 'span 1', rows: 'span 2' },
        chart: { cols: 'span 2', rows: 'span 1' },
        'role-summary': { cols: 'span 2', rows: 'span 1' }
    };
    
    availableWidgets: Widget[] = [
        {
            id: 'gantt',
            type: 'gantt',
            title: 'Biểu đồ Gantt',
            description: 'Hiển thị số công việc hoàn thành theo thời gian',
            icon: 'timeline',
            defaultSize: '2x2'
        },
        {
            id: 'status',
            type: 'status',
            title: 'Trạng thái công việc',
            description: 'Biểu đồ tròn hiển thị phân bố trạng thái',
            icon: 'pie_chart',
            defaultSize: '1x1'
        },
        {
            id: 'activities',
            type: 'activities',
            title: 'Hoạt động gần đây',
            description: 'Danh sách các hoạt động mới nhất',
            icon: 'activity',
            defaultSize: '1x2'
        },
        {
            id: 'progress',
            type: 'progress',
            title: 'Tiến độ công việc',
            description: 'Thanh tiến độ và thống kê tổng quan',
            icon: 'trending_up',
            defaultSize: '1x1'
        },
        {
            id: 'members',
            type: 'members',
            title: 'Thành viên hoạt động',
            description: 'Hiển thị danh sách thành viên đang hoạt động và thống kê công việc',
            icon: 'people',
            defaultSize: '1x2'
        },
        {
            id: 'chart',
            type: 'chart',
            title: 'Biểu đồ động',
            description: 'Biểu đồ có thể thay đổi loại (cột, đường, radar...)',
            icon: 'bar_chart',
            defaultSize: '2x1'
        },
        {
            id: 'role-summary',
            type: 'role-summary',
            title: 'Tổng quan theo vai trò',
            description: 'Thống kê tổng quan dựa trên vai trò người dùng',
            icon: 'admin_panel_settings',
            defaultSize: '2x1'
        }
    ];
    
    chartTypes: ChartType[] = [
        { value: 'status', label: 'Trạng thái công việc' },
        { value: 'timeline', label: 'Timeline công việc' },
        { value: 'member', label: 'Thành viên' },
        { value: 'priority', label: 'Độ ưu tiên' },
        { value: 'department', label: 'Phòng ban' }
    ];
    
    widgetSizeOptions: WidgetSizeOption[] = [
        { value: '1x1', label: 'Nhỏ' },
        { value: '1x2', label: 'Cao' },
        { value: '2x1', label: 'Rộng' },
        { value: '2x2', label: 'Lớn' },
        { value: '2x3', label: 'Rất cao' },
        { value: '3x2', label: 'Rất rộng' }
    ];

    timeRangeOptions: WidgetSizeOption[] = [
        { value: 'day', label: 'Ngày' },
        { value: 'week', label: 'Tuần' },
        { value: 'month', label: 'Tháng' },
        { value: 'quarter', label: 'Quý' }
    ];
    
    // UI state
    loading = false;
    ganttLoading = false;
    error = '';
    userRole: string = '';
    userDepartment: string = '';
    userCompanyId: string = '';
    
    // Department sidebar properties
    departments: Department[] = [];
    selectedDepartmentId: string = '';
    showDepartmentSidebar = false;
    departmentSidebarLoading = false;
    
    private _unsubscribeAll = new Subject<void>();

    // Gantt chart properties
    timelineStart: Date = new Date();
    timelineEnd: Date = new Date();
    rowHeight = 40;
    columnWidth = 60;
    today = new Date();

    /**
     * Constructor
     */
    constructor(
        private ganttService: GanttService,
        private dashboardService: DashboardService,
        private departmentService: DepartmentService,
        private userService: UserService
    )
    {

    }

    ngOnInit(): void {
        if (this.boardId) {
            this.loadGanttData();
        }
        this.initializeWidgets();
        
        // Initialize chart options first
        this.prepareStatusChartData();
        
        // Load user information first, then load dashboard data
        this.loadUserInfo();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // Filter Methods
    applyFilters(): void {
        console.log('Applying filters:', {
            taskType: this.selectedTaskType,
            author: this.selectedAuthor,
            status: this.selectedStatus
        });
        this.refreshAllWidgets();
    }

    openAdvancedFilters(): void {
        this.showAdvancedFilters = true;
    }

    closeAdvancedFilters(): void {
        this.showAdvancedFilters = false;
    }

    applyAdvancedFilters(): void {
        console.log('Applying advanced filters:', {
            dateRange: this.dateRange,
            priority: this.selectedPriority,
            completionRate: this.completionRate,
            department: this.selectedDepartment,
            tags: this.selectedTags,
            workload: this.workload
        });
        this.refreshAllWidgets();
        this.closeAdvancedFilters();
    }

    resetAdvancedFilters(): void {
        this.dateRange = '';
        this.selectedPriority = '';
        this.completionRate = '';
        this.selectedDepartment = '';
        this.selectedTags = [];
        this.workload = '';
    }

    // Widget Management Methods
    openWidgetSelector(): void {
        this.showWidgetSelector = true;
    }

    closeWidgetSelector(): void {
        this.showWidgetSelector = false;
    }

    addWidget(widget: Widget): void {
        console.log('Adding widget:', widget);
        this.closeWidgetSelector();
        // Here you would typically save to backend
        // For now, just log the action
    }

    removeWidget(widgetId: string): void {
        console.log('Removing widget:', widgetId);
        // Here you would typically remove from backend
    }

    refreshWidget(widgetId: string): void {
        console.log('Refreshing widget:', widgetId);
        switch (widgetId) {
            case 'gantt':
                this.loadGanttData();
                break;
            case 'status':
                // Reload dashboard data to get fresh statistics
                this.dashboardService.getWorkStatistics(this.selectedDepartmentId)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: (response) => {
                            this.workStatistics = response.data;
                            this.prepareStatusChartData();
                        },
                        error: (error) => {
                            console.error('Error refreshing status widget:', error);
                        }
                    });
                break;
            case 'activities':
                this.loadRecentActivities();
                break;
            case 'progress':
                this.loadProgressData();
                break;
            case 'members':
                this.loadProjectMembers();
                break;
            case 'chart':
                this.prepareDynamicChartData();
                break;
            case 'role-summary':
                // Reload dashboard data to get fresh statistics for role summary
                this.dashboardService.getWorkStatistics(this.selectedDepartmentId)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: (response) => {
                            this.workStatistics = response.data;
                            this.updateProgressData();
                        },
                        error: (error) => {
                            console.error('Error refreshing role summary widget:', error);
                        }
                    });
                break;
        }
    }

    refreshAllWidgets(): void {
        // Reload dashboard data from API
        this.loadDashboardData();
        
        // Refresh other widgets
        this.refreshWidget('gantt');
        this.refreshWidget('chart');
    }

    configureWidget(widgetId: string): void {
        console.log('Configuring widget:', widgetId);
        this.configuringWidget = this.availableWidgets.find(w => w.id === widgetId) || null;
        this.showWidgetConfig = true;
    }

    closeWidgetConfig(): void {
        this.showWidgetConfig = false;
        this.configuringWidget = null;
    }

    selectChartType(chartType: string): void {
        this.selectedChartType = chartType;
        this.prepareDynamicChartData();
    }

    selectTimeRange(timeRange: string): void {
        this.selectedTimeRange = timeRange;
        this.prepareDynamicChartData();
    }

    selectGanttTimeRange(timeRange: string): void {
        this.selectedGanttTimeRange = timeRange;
        this.loadGanttData();
    }

    getTimeRangeLabel(timeRange: string): string {
        switch (timeRange) {
            case 'day':
                return 'ngày';
            case 'week':
                return 'tuần';
            case 'month':
                return 'tháng';
            case 'quarter':
                return 'quý';
            default:
                return 'tháng';
        }
    }

    selectWidgetSize(size: string): void {
        this.selectedWidgetSize = size;
        // Update widget size based on selection
        const [cols, rows] = size.split('x');
        if (this.configuringWidget) {
            this.widgetSizes[this.configuringWidget.id] = {
                cols: `span ${cols}`,
                rows: `span ${rows}`
            };
        }
    }

    saveWidgetConfig(): void {
        console.log('Saving widget config:', {
            widget: this.configuringWidget,
            chartType: this.selectedChartType,
            size: this.selectedWidgetSize,
            dataSource: this.selectedDataSource,
            refreshInterval: this.refreshInterval
        });
        this.closeWidgetConfig();
    }

    resizeWidget(widgetId: string): void {
        console.log('Resizing widget:', widgetId);
        // Cycle through size options
        const currentSize = this.widgetSizes[widgetId];
        const sizeOptions = ['1x1', '1x2', '2x1', '2x2'];
        const currentIndex = sizeOptions.findIndex(size => {
            const [cols, rows] = size.split('x');
            return currentSize.cols === `span ${cols}` && currentSize.rows === `span ${rows}`;
        });
        const nextIndex = (currentIndex + 1) % sizeOptions.length;
        const nextSize = sizeOptions[nextIndex];
        const [cols, rows] = nextSize.split('x');
        this.widgetSizes[widgetId] = {
            cols: `span ${cols}`,
            rows: `span ${rows}`
        };
    }

    onDrop(event: CdkDragDrop<string[]>): void {
        console.log('Widget dropped:', event);
        // Handle widget reordering
        // moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
    }

    // Data Loading Methods
    loadGanttData(): void {
        this.ganttLoading = true;
        this.error = '';

        this.dashboardService.getGanttChartData(this.selectedGanttTimeRange as any, this.selectedDepartmentId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    console.log('Gantt chart data response:', response);
                    const ganttData = response.data;
                    
                    // Cập nhật chart options cho Gantt chart
                    this.chartOptions = {
                        series: ganttData.series,
                        chart: {
                            type: 'bar',
                            height: 400,
                            toolbar: {
                                show: true,
                                tools: {
                                    download: true,
                                    selection: false,
                                    zoom: false,
                                    zoomin: false,
                                    zoomout: false,
                                    pan: false,
                                    reset: false
                                }
                            }
                        },
                        plotOptions: {
                            bar: {
                                horizontal: false,
                                columnWidth: '70%',
                                borderRadius: 4
                            }
                        },
                        xaxis: {
                            categories: ganttData.categories,
                            labels: {
                                style: {
                                    fontSize: '12px'
                                }
                            }
                        },
                        yaxis: {
                            title: {
                                text: 'Số công việc hoàn thành'
                            },
                            labels: {
                                style: {
                                    fontSize: '12px'
                                }
                            }
                        },
                        dataLabels: {
                            enabled: true,
                            formatter: function (val: any) {
                                return val || 0;
                            },
                            style: {
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }
                        },
                        colors: ['#4caf50'],
                        tooltip: {
                            y: {
                                formatter: function (val: any) {
                                    return val + ' công việc';
                                }
                            }
                        },
                        title: {
                            text: `Số công việc hoàn thành theo ${this.getTimeRangeLabel(this.selectedGanttTimeRange)}`,
                            align: 'center',
                            style: {
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }
                        }
                    };
                    
                    this.ganttLoading = false;
                },
                error: (err) => {
                    this.error = 'Không thể tải dữ liệu Gantt chart';
                    this.ganttLoading = false;
                    console.error('Gantt chart data error:', err);
                    
                    // Fallback to empty chart
                    this.chartOptions = {
                        series: [{
                            name: 'Công việc hoàn thành',
                            data: []
                        }],
                        chart: {
                            type: 'bar',
                            height: 400
                        },
                        xaxis: {
                            categories: []
                        },
                        yaxis: {
                            title: {
                                text: 'Số công việc hoàn thành'
                            }
                        },
                        title: {
                            text: 'Không có dữ liệu'
                        }
                    };
                }
            });
    }

    loadMockData(): void {
        this.loadRecentActivities();
        this.loadProgressData();
        this.loadTeamMembers();
        this.loadProjectMembers();
        this.prepareStatusChartData();
    }

    loadDashboardData(): void {
        console.log('loadDashboardData called');
        this.loading = true;
        this.error = '';

        this.dashboardService.getWorkStatistics(this.selectedDepartmentId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    console.log('Dashboard API response:', response);
                    console.log('Response data:', response.data);
                    this.workStatistics = response.data;
                    console.log('workStatistics set to:', this.workStatistics);
                    
                    // Update progress data
                    this.updateProgressData();
                    console.log('progressData updated:', this.progressData);

                    // Update status chart with real data
                    this.prepareStatusChartData();
                    
                    // Load other mock data
                    this.loadRecentActivities();
                    this.loadTeamMembers();
                    this.loadProjectMembers();
                    
                    this.loading = false;
                    console.log('loadDashboardData completed');
                },
                error: (error) => {
                    console.error('Error loading dashboard data:', error);
                    this.error = 'Không thể tải dữ liệu dashboard';
                    this.loading = false;
                    
                    // Fallback to mock data
                    this.loadMockData();
                }
            });
    }

    loadTeamMembers(): void {
        this.teamMembers = [
            { id: '1', name: 'Nguyễn Văn A', avatar: 'assets/images/avatars/male-01.jpg', role: 'Developer', status: 'online', tasksCount: 5 },
            { id: '2', name: 'Trần Thị B', avatar: 'assets/images/avatars/female-01.jpg', role: 'Designer', status: 'online', tasksCount: 3 },
            { id: '3', name: 'Giang IT', avatar: 'assets/images/avatars/male-03.jpg', role: 'Tester', status: 'away', tasksCount: 7 },
            { id: '4', name: 'Huyen', avatar: 'assets/images/avatars/female-01.jpg', role: 'Manager', status: 'offline', tasksCount: 2 }
        ];
    }

    loadProjectMembers(): void {
        this.dashboardService.getActiveMembers(this.selectedDepartmentId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Map ActiveMember data to ProjectMember format
                    this.projectMembers = response.data.map(member => ({
                        id: member.id,
                        name: member.name,
                        avatar: member.avatar || 'assets/images/avatars/male-01.jpg', // Default avatar if none provided
                        role: member.userType || 'Member',
                        status: 'online' as const, // Default status since API doesn't provide it
                        tasksCount: member.totalTasks,
                        doneTasks: member.doneTasks,
                        inProgressTasks: member.inProgressTasks,
                        overdueTasks: member.overdueTasks,
                        todoTasks: member.todoTasks
                    }));
                    console.log('Project members loaded:', this.projectMembers);
                },
                error: (error) => {
                    console.error('Error loading project members:', error);
                    this.projectMembers = []; // Clear on error
                }
            });
    }

    loadRecentActivities(): void {
        this.recentActivities = [
            {
                id: '1',
                title: 'Công việc "Phát triển tính năng mới" đã được hoàn thành',
                time: '2 phút trước',
                type: 'completed'
            },
            {
                id: '2',
                title: 'Nguyễn Văn A đã bắt đầu công việc "Kiểm thử hệ thống"',
                time: '15 phút trước',
                type: 'started'
            },
            {
                id: '3',
                title: 'Trần Thị B đã thêm bình luận vào công việc "Thiết kế UI"',
                time: '1 giờ trước',
                type: 'commented'
            },
            {
                id: '4',
                title: 'Công việc "Tối ưu hiệu suất" đã được giao cho Giang IT',
                time: '2 giờ trước',
                type: 'assigned'
            }
        ];
    }

    loadProgressData(): void {
        this.progressData = {
            total: 25,
            completed: 68,
            completedCount: 17,
            inProgress: 5,
            pending: 3,
            overdue: 2
        };
    }

    updateProgressData(): void {
        if (this.workStatistics) {
            this.progressData = {
                total: this.workStatistics.total,
                completed: this.workStatistics.done > 0 ? (this.workStatistics.done / this.workStatistics.total) * 100 : 0,
                completedCount: this.workStatistics.done,
                inProgress: this.workStatistics.inProgress,
                pending: this.workStatistics.todo,
                overdue: this.workStatistics.overdue
            };
        }
    }

    initializeWidgets(): void {
        // Initialize widget configurations
        // This would typically load from backend
    }

    // Chart Preparation Methods
    prepareStatusChartData(): void {
        console.log('prepareStatusChartData called');
        console.log('workStatistics:', this.workStatistics);
        
        // Use real data from API if available, otherwise use mock data
        let series: number[];
        let labels: string[];
        let colors: string[];

        if (this.workStatistics) {
            // Use real data from API
            series = [
                this.workStatistics.done || 0,        // Hoàn thành
                this.workStatistics.inProgress || 0,  // Đang thực hiện
                this.workStatistics.todo || 0,        // Chờ xử lý
                this.workStatistics.overdue || 0,     // Quá hạn
                0                                     // Tạm dừng (không có trong API)
            ];
            labels = ['Hoàn thành', 'Đang thực hiện', 'Chờ xử lý', 'Quá hạn', 'Tạm dừng'];
            colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];
            console.log('Using real data from API:', { series, labels, colors });
        } else {
            // Fallback to mock data
            series = [44, 55, 13, 8, 43];
            labels = ['Hoàn thành', 'Đang thực hiện', 'Chờ xử lý', 'Quá hạn', 'Tạm dừng'];
            colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];
            console.log('Using mock data:', { series, labels, colors });
        }

        // Ensure we have valid data
        if (!series || series.length === 0) {
            series = [1]; // At least one value to show chart
            labels = ['No Data'];
            colors = ['#9e9e9e'];
        }

        this.statusChartOptions = {
            series: series,
            chart: {
                type: 'pie',
                height: 250,
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
                }
            },
            labels: labels,
            colors: colors,
            legend: {
                position: 'bottom',
                fontSize: '12px',
                fontFamily: 'inherit'
            },
            tooltip: {
                enabled: true,
                theme: 'light'
            },
            dataLabels: {
                enabled: true,
                formatter: function (val: any, opts: any) {
                    return opts.w.globals.seriesTotals[opts.seriesIndex] || 0;
                }
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            ]
        };
        
        console.log('Final statusChartOptions:', this.statusChartOptions);
    }

    prepareDynamicChartData(): void {
        // Load chart data from API based on selected chart type
        this.loading = true;
        
        this.dashboardService.getChartData(this.selectedChartType as any, this.selectedTimeRange as any, this.selectedDepartmentId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    console.log('Chart data response:', response);
                    const chartData = response.data;
                    
                    // Determine chart type based on selected chart type
                    let chartType: any = 'bar';
                    if (this.selectedChartType === 'status') {
                        chartType = 'pie';
                    } else if (this.selectedChartType === 'timeline') {
                        chartType = 'line';
                    } else if (this.selectedChartType === 'member' || this.selectedChartType === 'priority' || this.selectedChartType === 'department') {
                        chartType = 'bar';
                    }
                    
                    if (chartType === 'pie') {
                        // For pie charts, use series as array of numbers
                        this.dynamicChartOptions = {
                            series: chartData.series as ApexNonAxisChartSeries,
                            chart: {
                                type: chartType,
                                height: 250
                            },
                            labels: chartData.labels || [],
                            colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'],
                            dataLabels: {
                                enabled: true,
                                formatter: function (val: any, opts: any) {
                                    return opts.w.globals.seriesTotals[opts.seriesIndex] || 0;
                                }
                            },
                            plotOptions: {
                                pie: {
                                    donut: {
                                        size: '70%'
                                    }
                                }
                            }
                        };
                    } else {
                        // For other chart types, use series as array of objects
                        this.dynamicChartOptions = {
                            series: chartData.series as ApexAxisChartSeries,
                            chart: {
                                type: chartType,
                                height: 250
                            },
                            xaxis: {
                                categories: chartData.categories || chartData.labels || []
                            },
                            yaxis: {
                                title: {
                                    text: 'Số lượng'
                                }
                            },
                            colors: ['#2196f3', '#4caf50', '#ff9800', '#f44336'],
                            dataLabels: {
                                enabled: false
                            },
                            plotOptions: {
                                bar: {
                                    horizontal: false
                                }
                            }
                        };
                    }
                    
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading chart data:', error);
                    // Fallback to mock data
                    const data = [30, 40, 35, 50, 49, 60, 70, 91, 125];
                    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

                    this.dynamicChartOptions = {
                        series: [
                            {
                                name: 'Công việc',
                                data: data
                            }
                        ] as ApexAxisChartSeries,
                        chart: {
                            type: 'bar',
                            height: 250
                        },
                        xaxis: {
                            categories: categories
                        },
                        yaxis: {
                            title: {
                                text: 'Số lượng'
                            }
                        },
                        colors: ['#2196f3'],
                        dataLabels: {
                            enabled: false
                        },
                        plotOptions: {
                            bar: {
                                horizontal: false
                            }
                        }
                    };
                    this.loading = false;
                }
            });
    }

    calculateTimeline(): void {
        if (this.tasks.length === 0) {
            this.timelineStart = new Date();
            this.timelineEnd = new Date();
            return;
        }

        const startDates = this.tasks.map(task => new Date(task.start_date));
        const endDates = this.tasks.map(task => new Date(task.end_date));

        this.timelineStart = new Date(Math.min(...startDates.map(d => d.getTime())));
        this.timelineEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

        // Add some padding
        this.timelineStart.setDate(this.timelineStart.getDate() - 7);
        this.timelineEnd.setDate(this.timelineEnd.getDate() + 7);
    }

    getTimelineDays(): Date[] {
        const days: Date[] = [];
        const current = new Date(this.timelineStart);
        
        while (current <= this.timelineEnd) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    }

    getTaskPosition(task: GanttTask): { left: string; width: string } {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        
        const startDiff = Math.max(0, (startDate.getTime() - this.timelineStart.getTime()) / (1000 * 60 * 60 * 24));
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
        
        const left = (startDiff * this.columnWidth) + 'px';
        const width = (duration * this.columnWidth) + 'px';
        
        return { left, width };
    }

    getTaskStatusColor(task: GanttTask): string {
        switch (task.status) {
            case 'completed':
                return '#4caf50';
            case 'in_progress':
                return '#2196f3';
            case 'todo':
                return '#ff9800';
            default:
                return '#9e9e9e';
        }
    }

    isToday(date: Date): boolean {
        return date.toDateString() === this.today.toDateString();
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    onTaskClick(task: GanttTask): void {
        console.log('Task clicked:', task);
        // Implement task details modal or navigation
    }

    getDependencies(task: GanttTask): string[] {
        if (!task.dependencies) return [];
        try {
            return JSON.parse(task.dependencies);
        } catch {
            return [];
        }
    }

    loadUserInfo(): void {
        // Get user information from UserService
        this.userService.user$.subscribe(user => {
            if (user) {
                this.userRole = user.type || 'staff';
                this.userDepartment = user.departmentName || '';
                this.userCompanyId = user.companyId || '';
                
                // If user is boss, load departments and show sidebar
                if (this.userRole === 'boss' && this.userCompanyId) {
                    this.loadDepartments();
                    this.showDepartmentSidebar = true;
                }
                
                // Load dashboard data after user info is loaded
                this.loadDashboardData();
                this.prepareDynamicChartData();
            }
        });
    }

    loadDepartments(): void {
        if (!this.userCompanyId) return;
        
        this.departmentSidebarLoading = true;
        this.departmentService.getDepartmentsByCompany(this.userCompanyId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.departments = response.data || [];
                    this.departmentSidebarLoading = false;
                },
                error: (error) => {
                    console.error('Error loading departments:', error);
                    this.departmentSidebarLoading = false;
                }
            });
    }

    selectDepartment(departmentId: string): void {
        this.selectedDepartmentId = departmentId;
        
        // Reload all dashboard data with department filter
        this.loadDashboardData();
        this.loadGanttData();
        this.prepareDynamicChartData();
    }

    clearDepartmentFilter(): void {
        this.selectedDepartmentId = '';
        
        // Reload all dashboard data without department filter
        this.loadDashboardData();
        this.loadGanttData();
        this.prepareDynamicChartData();
    }

    getSelectedDepartmentName(): string {
        if (!this.selectedDepartmentId) {
            return 'Tất cả phòng ban';
        }
        const department = this.departments.find(d => d.id === this.selectedDepartmentId);
        return department?.name || 'Phòng ban';
    }

    getRoleDisplayName(role: string): string {
        switch (role) {
            case 'boss':
                return 'Giám đốc';
            case 'manager':
                return 'Quản lý';
            case 'staff':
                return 'Nhân viên';
            default:
                return role;
        }
    }

    prepareApexChartData(): void {
        this.chartOptions = {
            series: [
                {
                    data: this.tasks.map(task => ({
                        x: task.title,
                        y: [
                            new Date(task.start_date).getTime(),
                            new Date(task.end_date).getTime()
                        ],
                        fillColor: this.getTaskStatusColor(task),
                        task: task
                    }))
                }
            ],
            chart: {
                type: 'rangeBar',
                height: 400
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '60%'
                }
            },
            xaxis: {
                type: 'datetime'
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val: any, opts: any) {
                    return opts.w.globals.initialSeries[opts.seriesIndex].data[opts.dataPointIndex].task.status || '';
                }
            },
            tooltip: {
                custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                    const task = w.globals.initialSeries[seriesIndex].data[dataPointIndex].task;
                    return `
                        <div>
                            <b>${task.title}</b><br>
                            ${task.start_date} - ${task.end_date}<br>
                            Trạng thái: ${task.status}
                        </div>
                    `;
                }
            },
            title: {
                text: 'Gantt Chart'
            }
        };
    }
}
