import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  type: 'feature' | 'bugfix' | 'release' | 'hotfix';
  title: string;
  description: string;
  changes: string[];
  author: string;
}

export interface VersionHistory {
  currentVersion: string;
  versions: VersionInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private versionHistorySubject = new BehaviorSubject<VersionHistory | null>(null);
  public versionHistory$ = this.versionHistorySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadVersionHistory();
  }

  /**
   * Load version history from JSON file
   */
  private loadVersionHistory(): void {
    this.http.get<VersionHistory>('/assets/data/version-history.json')
      .subscribe({
        next: (data) => {
          this.versionHistorySubject.next(data);
        },
        error: (error) => {
          console.error('Error loading version history:', error);
          // Fallback data
          const fallbackData: VersionHistory = {
            currentVersion: '1.0.0',
            versions: []
          };
          this.versionHistorySubject.next(fallbackData);
        }
      });
  }

  /**
   * Get current version
   */
  getCurrentVersion(): Observable<string> {
    return this.versionHistory$.pipe(
      map(history => history?.currentVersion || '1.0.0')
    );
  }

  /**
   * Get all versions
   */
  getAllVersions(): Observable<VersionInfo[]> {
    return this.versionHistory$.pipe(
      map(history => history?.versions || [])
    );
  }

  /**
   * Get latest version info
   */
  getLatestVersion(): Observable<VersionInfo | null> {
    return this.versionHistory$.pipe(
      map(history => {
        if (!history || !history.versions || history.versions.length === 0) {
          return null;
        }
        return history.versions[0]; // First item is the latest
      })
    );
  }

  /**
   * Get version by version number
   */
  getVersionByNumber(versionNumber: string): Observable<VersionInfo | null> {
    return this.versionHistory$.pipe(
      map(history => {
        if (!history || !history.versions) {
          return null;
        }
        return history.versions.find(v => v.version === versionNumber) || null;
      })
    );
  }

  /**
   * Refresh version history
   */
  refreshVersionHistory(): void {
    this.loadVersionHistory();
  }
}
