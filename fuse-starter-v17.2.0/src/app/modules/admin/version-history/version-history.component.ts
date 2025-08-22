import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { VersionService, VersionInfo } from 'app/core/services/version.service';

@Component({
  selector: 'version-history',
  templateUrl: './version-history.component.html',
  styleUrls: ['./version-history.component.scss']
})
export class VersionHistoryComponent implements OnInit, OnDestroy {
  versions: VersionInfo[] = [];
  currentVersion: string = '';
  loading: boolean = true;
  
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(private _versionService: VersionService) {}

  ngOnInit(): void {
    // Get current version
    this._versionService.getCurrentVersion()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(version => {
        this.currentVersion = version;
      });

    // Get all versions
    this._versionService.getAllVersions()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(versions => {
        this.versions = versions;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  /**
   * Get badge color based on version type
   */
  getVersionTypeColor(type: string): string {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'bugfix':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'release':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'hotfix':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  /**
   * Get version type label in Vietnamese
   */
  getVersionTypeLabel(type: string): string {
    switch (type) {
      case 'feature':
        return 'Tính năng mới';
      case 'bugfix':
        return 'Sửa lỗi';
      case 'release':
        return 'Phát hành';
      case 'hotfix':
        return 'Sửa lỗi khẩn cấp';
      default:
        return 'Khác';
    }
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Track by function for version
   */
  trackByVersion(index: number, version: VersionInfo): string {
    return version.version;
  }

  /**
   * Track by function for change
   */
  trackByChange(index: number, change: string): number {
    return index;
  }
}
