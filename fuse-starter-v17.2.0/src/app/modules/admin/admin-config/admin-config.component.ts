import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: Date;
  avatar?: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  startDate: Date;
  endDate: Date;
  manager: string;
  team: string[];
}

interface Task {
  id: number;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: Date;
  projectId: number;
}

@Component({
  selector: 'admin-config',
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.scss']
})
export class AdminConfigComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Active tab
  activeTab = 'dashboard';

  // Forms
  userForm: FormGroup;
  smtpForm: FormGroup;
  zaloForm: FormGroup;
  notificationForm: FormGroup;

  // Data sources
  usersDataSource = new MatTableDataSource<User>();
  projectsDataSource = new MatTableDataSource<Project>();

  // Table columns
  userColumns = ['avatar', 'name', 'email', 'role', 'status', 'lastLogin', 'actions'];
  projectColumns = ['name', 'status', 'progress', 'startDate', 'endDate', 'manager', 'actions'];

  // Sample data
  users: User[] = [
    {
      id: 1,
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@company.com',
      role: 'Admin',
      status: 'active',
      lastLogin: new Date('2024-01-15T10:30:00'),
      avatar: 'assets/avatars/avatar-1.jpg'
    },
    {
      id: 2,
      name: 'Trần Thị Bích',
      email: 'bich.tran@company.com',
      role: 'Manager',
      status: 'active',
      lastLogin: new Date('2024-01-14T16:45:00'),
      avatar: 'assets/avatars/avatar-2.jpg'
    },
    {
      id: 3,
      name: 'Lê Minh Cường',
      email: 'cuong.le@company.com',
      role: 'Developer',
      status: 'inactive',
      lastLogin: new Date('2024-01-10T09:15:00'),
      avatar: 'assets/avatars/avatar-3.jpg'
    }
  ];

  projects: Project[] = [
    {
      id: 1,
      name: 'Website Redesign',
      status: 'in-progress',
      progress: 65,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      manager: 'Nguyễn Văn An',
      team: ['Trần Thị Bích', 'Lê Minh Cường']
    },
    {
      id: 2,
      name: 'Mobile App Development',
      status: 'planning',
      progress: 15,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-06-30'),
      manager: 'Trần Thị Bích',
      team: ['Lê Minh Cường']
    }
  ];

  tasks: Task[] = [
    {
      id: 1,
      title: 'Design homepage mockup',
      status: 'done',
      priority: 'high',
      assignee: 'Trần Thị Bích',
      dueDate: new Date('2024-01-20'),
      projectId: 1
    },
    {
      id: 2,
      title: 'Implement user authentication',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Lê Minh Cường',
      dueDate: new Date('2024-01-25'),
      projectId: 1
    },
    {
      id: 3,
      title: 'Setup database schema',
      status: 'todo',
      priority: 'medium',
      assignee: 'Lê Minh Cường',
      dueDate: new Date('2024-02-05'),
      projectId: 2
    }
  ];

  // Dashboard stats
  dashboardStats = {
    totalUsers: 25,
    activeUsers: 18,
    totalProjects: 12,
    completedProjects: 8,
    pendingTasks: 34,
    overdueTasks: 5
  };

  constructor(
    private formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    // Initialize forms
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      status: ['active', [Validators.required]]
    });

    this.smtpForm = this.formBuilder.group({
      host: ['smtp.gmail.com', [Validators.required]],
      port: [587, [Validators.required]],
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      encryption: ['tls', [Validators.required]],
      fromName: ['Company Name', [Validators.required]],
      fromEmail: ['', [Validators.required, Validators.email]]
    });

    this.zaloForm = this.formBuilder.group({
      oaId: ['', [Validators.required]],
      accessToken: ['', [Validators.required]],
      secretKey: ['', [Validators.required]],
      webhookUrl: ['', [Validators.required]]
    });

    this.notificationForm = this.formBuilder.group({
      emailEnabled: [true],
      zaloEnabled: [false],
      taskDueHours: [24, [Validators.required, Validators.min(1)]],
      taskOverdueHours: [2, [Validators.required, Validators.min(1)]],
      projectDeadlineHours: [48, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.usersDataSource.data = this.users;
    this.projectsDataSource.data = this.projects;
  }

  ngAfterViewInit(): void {
    this.usersDataSource.paginator = this.paginator;
    this.usersDataSource.sort = this.sort;
  }

  // Tab navigation
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // User management methods
  addUser(): void {
    if (this.userForm.valid) {
      const newUser: User = {
        id: this.users.length + 1,
        ...this.userForm.value,
        lastLogin: new Date()
      };
      this.users.push(newUser);
      this.usersDataSource.data = this.users;
      this.userForm.reset();
      this.userForm.patchValue({ status: 'active' });
    }
  }

  editUser(user: User): void {
    this.userForm.patchValue(user);
  }

  deleteUser(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      this.users = this.users.filter(user => user.id !== id);
      this.usersDataSource.data = this.users;
    }
  }

  toggleUserStatus(user: User): void {
    user.status = user.status === 'active' ? 'inactive' : 'active';
    this.usersDataSource.data = [...this.users];
  }

  resetPassword(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn reset mật khẩu cho ${user.name}?`)) {
      // Implementation for password reset
      alert('Email reset mật khẩu đã được gửi!');
    }
  }

  // Configuration methods
  saveSmtpConfig(): void {
    if (this.smtpForm.valid) {
      // Implementation for saving SMTP config
      alert('Cấu hình SMTP đã được lưu thành công!');
    }
  }

  testSmtpConnection(): void {
    if (this.smtpForm.valid) {
      // Implementation for testing SMTP connection
      alert('Đang kiểm tra kết nối SMTP...');
    }
  }

  saveZaloConfig(): void {
    if (this.zaloForm.valid) {
      // Implementation for saving Zalo config
      alert('Cấu hình Zalo OA đã được lưu thành công!');
    }
  }

  testZaloConnection(): void {
    if (this.zaloForm.valid) {
      // Implementation for testing Zalo connection
      alert('Đang kiểm tra kết nối Zalo OA...');
    }
  }

  saveNotificationConfig(): void {
    if (this.notificationForm.valid) {
      // Implementation for saving notification config
      alert('Cấu hình thông báo đã được lưu thành công!');
    }
  }

  // Utility methods
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.usersDataSource.filter = filterValue.trim().toLowerCase();
  }

  getRoleColor(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'developer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: string): string {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getProjectStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Chart data for dashboard
  getTaskStatusData() {
    const todoTasks = this.tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress').length;
    const doneTasks = this.tasks.filter(t => t.status === 'done').length;

    return [
      { name: 'Chờ xử lý', value: todoTasks },
      { name: 'Đang thực hiện', value: inProgressTasks },
      { name: 'Hoàn thành', value: doneTasks }
    ];
  }

  getProjectProgressData() {
    return this.projects.map(project => ({
      name: project.name,
      progress: project.progress
    }));
  }
}