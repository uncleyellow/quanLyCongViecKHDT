import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, Observable, throwError, map, switchMap } from 'rxjs';
import { TasksService } from 'app/modules/admin/tasks/tasks.service';
import { Tag, Task } from 'app/modules/admin/tasks/tasks.types';

@Injectable({
    providedIn: 'root'
})
export class TasksTagsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _tasksService: TasksService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Tag[]>
    {
        return this._tasksService.getTags();
    }
}

@Injectable({
    providedIn: 'root'
})
export class TasksResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _tasksService: TasksService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Task[]>
    {
        console.log('TasksResolver - resolving tasks');
        // Use getUserCards instead of getTasks to ensure userCards data is loaded
        return this._tasksService.getUserCards().pipe(
            map((userCards) => {
                console.log('TasksResolver - loaded userCards:', userCards?.length || 0);
                return []; // Return empty array since we're using userCards for display
            })
        );
    }
}

@Injectable({
    providedIn: 'root'
})
export class TasksTaskResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _tasksService: TasksService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Task>
    {
        const taskId = route.paramMap.get('id');
        console.log('TasksTaskResolver - resolving task with id:', taskId);
        
        // First ensure user cards are loaded, then get the specific task
        return this._tasksService.getUserCards().pipe(
            switchMap(() => this._tasksService.getTaskById(taskId)),
            catchError((error) => {

                // Log the error
                console.error('TasksTaskResolver - error:', error);

                // Get the parent url
                const parentUrl = state.url.split('/').slice(0, -1).join('/');

                // Navigate to there
                this._router.navigateByUrl(parentUrl);

                // Throw an error
                return throwError(error);
            })
        );
    }
}
