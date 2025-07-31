import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Injectable({
    providedIn: 'root'
})
export class UserLoaderService
{
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _userService: UserService
    )
    {
    }

    /**
     * Load user information if authenticated
     */
    loadUserIfAuthenticated(): Promise<void>
    {
        return new Promise((resolve) => {
            this._authService.check().subscribe((isAuthenticated: boolean) => {
                if (isAuthenticated) {
                    this._userService.get().subscribe({
                        next: (user) => {
                            console.log('User information loaded successfully:', user);
                            resolve();
                        },
                        error: (error) => {
                            console.error('Failed to load user information:', error);
                            // Clear authentication if user info cannot be loaded
                            this._authService.signOut().subscribe(() => {
                                resolve();
                            });
                        }
                    });
                } else {
                    resolve();
                }
            });
        });
    }
} 