import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { GanttService, GanttTask } from './gantt.service';
import { Subject, takeUntil } from 'rxjs';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexDataLabels,
    ApexTitleSubtitle,
    ApexPlotOptions,
    ApexTooltip,
    ApexYAxis
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
};
@Component({
    selector     : 'example',
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ExampleComponent implements OnInit, OnDestroy
{
    @Input() boardId: string = '';
    @ViewChild('ganttContainer', { static: true }) ganttContainer!: ElementRef;
    chartOptions: Partial<ChartOptions> = {};
    tasks: GanttTask[] = [];
    loading = false;
    error = '';
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
        private ganttService: GanttService
    )
    {

    }

    ngOnInit(): void {
        if (this.boardId) {
            this.loadGanttData();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    loadGanttData(): void {
        this.loading = true;
        this.error = '';

        this.ganttService.getGanttData(this.boardId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (tasks) => {
                    this.tasks = tasks.filter(task =>
                        task.start_date && task.end_date
                    );
                    this.calculateTimeline();
                    this.prepareApexChartData();
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load Gantt data';
                    this.loading = false;
                    console.error('Gantt data error:', err);
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
