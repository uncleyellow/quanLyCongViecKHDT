import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamService, User } from './team.service';

@Component({
    selector       : 'settings-team',
    templateUrl    : './team.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsTeamComponent implements OnInit, OnDestroy
{
    members: any[];
    roles: any[];
    users: User[] = [];
    selectedUser: User | null = null;
    isLoadingUsers: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _teamService: TeamService,
        private _changeDetectorRef: ChangeDetectorRef
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Setup the team members
        this.members = [
            {
                avatar: 'assets/images/avatars/male-01.jpg',
                name  : 'Dejesus Michael',
                email : 'dejesusmichael@mail.org',
                role  : 'admin'
            },
            {
                avatar: 'assets/images/avatars/male-03.jpg',
                name  : 'Mclaughlin Steele',
                email : 'mclaughlinsteele@mail.me',
                role  : 'admin'
            },
            {
                avatar: 'assets/images/avatars/female-02.jpg',
                name  : 'Laverne Dodson',
                email : 'lavernedodson@mail.ca',
                role  : 'write'
            },
            {
                avatar: 'assets/images/avatars/female-03.jpg',
                name  : 'Trudy Berg',
                email : 'trudyberg@mail.us',
                role  : 'read'
            },
            {
                avatar: 'assets/images/avatars/male-07.jpg',
                name  : 'Lamb Underwood',
                email : 'lambunderwood@mail.me',
                role  : 'read'
            },
            {
                avatar: 'assets/images/avatars/male-08.jpg',
                name  : 'Mcleod Wagner',
                email : 'mcleodwagner@mail.biz',
                role  : 'read'
            },
            {
                avatar: 'assets/images/avatars/female-07.jpg',
                name  : 'Shannon Kennedy',
                email : 'shannonkennedy@mail.ca',
                role  : 'read'
            }
        ];

        // Setup the roles
        this.roles = [
            {
                label      : 'Read',
                value      : 'read',
                description: 'Can read and clone this repository. Can also open and comment on issues and pull requests.'
            },
            {
                label      : 'Write',
                value      : 'write',
                description: 'Can read, clone, and push to this repository. Can also manage issues and pull requests.'
            },
            {
                label      : 'Admin',
                value      : 'admin',
                description: 'Can read, clone, and push to this repository. Can also manage issues, pull requests, and repository settings, including adding collaborators.'
            }
        ];

        // Load users from API
        this.loadUsers();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Load users from API
     */
    private loadUsers(): void
    {
        this.isLoadingUsers = true;
        this._changeDetectorRef.markForCheck(); // Trigger change detection for loading state
        
        this._teamService.getUsers()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    console.log('API Response:', response);
                    console.log('Users data:', response.data);
                    this.users = response.data || [];
                    this.isLoadingUsers = false;
                    console.log('Component users:', this.users);
                    this._changeDetectorRef.markForCheck(); // Trigger change detection after data update
                },
                error: (error) => {
                    console.error('Error loading users:', error);
                    this.isLoadingUsers = false;
                    // Fallback to empty array
                    this.users = [];
                    this._changeDetectorRef.markForCheck(); // Trigger change detection after error
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Handle user selection from dropdown
     */
    onUserSelected(user: User): void
    {
        this.selectedUser = user;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Add selected user to team
     */
    addSelectedUser(): void
    {
        if (this.selectedUser) {
            // Check if user is already in team
            const existingMember = this.members.find(member => member.email === this.selectedUser?.email);
            if (existingMember) {
                alert('User is already in the team!');
                return;
            }

            // Add user to team with default role
            const newMember = {
                avatar: null,
                name: this.selectedUser.name,
                email: this.selectedUser.email,
                role: 'read' // Default role
            };

            this.members.push(newMember);
            this.selectedUser = null; // Reset selection
            this._changeDetectorRef.markForCheck();
        }
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
