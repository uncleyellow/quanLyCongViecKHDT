import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Tag, Task, UserCard } from 'app/modules/admin/tasks/tasks.types';
import { environment } from 'environments/environment.local';

@Injectable({
    providedIn: 'root'
})
export class TasksService
{
    // Private
    private _tags: BehaviorSubject<Tag[] | null> = new BehaviorSubject(null);
    private _task: BehaviorSubject<Task | null> = new BehaviorSubject(null);
    private _tasks: BehaviorSubject<Task[] | null> = new BehaviorSubject(null);
    private _userCards: BehaviorSubject<UserCard[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for tags
     */
    get tags$(): Observable<Tag[]>
    {
        return this._tags.asObservable();
    }

    /**
     * Getter for task
     */
    get task$(): Observable<Task>
    {
        return this._task.asObservable();
    }

    /**
     * Getter for tasks
     */
    get tasks$(): Observable<Task[]>
    {
        return this._tasks.asObservable();
    }

    /**
     * Getter for user cards
     */
    get userCards$(): Observable<UserCard[]>
    {
        return this._userCards.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get tags
     */
    getTags(): Observable<Tag[]>
    {
        return this._httpClient.get<Tag[]>('api/apps/tasks/tags').pipe(
            tap((response: any) => {
                this._tags.next(response);
            })
        );
    }

    /**
     * Crate tag
     *
     * @param tag
     */
    createTag(tag: Tag): Observable<Tag>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.post<Tag>('api/apps/tasks/tag', {tag}).pipe(
                map((newTag) => {

                    // Update the tags with the new tag
                    this._tags.next([...tags, newTag]);

                    // Return new tag from observable
                    return newTag;
                })
            ))
        );
    }

    /**
     * Update the tag
     *
     * @param id
     * @param tag
     */
    updateTag(id: string, tag: Tag): Observable<Tag>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.patch<Tag>('api/apps/tasks/tag', {
                id,
                tag
            }).pipe(
                map((updatedTag) => {

                    // Find the index of the updated tag
                    const index = tags.findIndex(item => item.id === id);

                    // Update the tag
                    tags[index] = updatedTag;

                    // Update the tags
                    this._tags.next(tags);

                    // Return the updated tag
                    return updatedTag;
                })
            ))
        );
    }

    /**
     * Delete the tag
     *
     * @param id
     */
    deleteTag(id: string): Observable<boolean>
    {
        return this.tags$.pipe(
            take(1),
            switchMap(tags => this._httpClient.delete('api/apps/tasks/tag', {params: {id}}).pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted tag
                    const index = tags.findIndex(item => item.id === id);

                    // Delete the tag
                    tags.splice(index, 1);

                    // Update the tags
                    this._tags.next(tags);

                    // Return the deleted status
                    return isDeleted;
                }),
                filter(isDeleted => isDeleted),
                switchMap(isDeleted => this.tasks$.pipe(
                    take(1),
                    map((tasks) => {

                        // Iterate through the tasks
                        tasks.forEach((task) => {

                            const tagIndex = task.tags.findIndex(tag => tag === id);

                            // If the task has a tag, remove it
                            if ( tagIndex > -1 )
                            {
                                task.tags.splice(tagIndex, 1);
                            }
                        });

                        // Return the deleted status
                        return isDeleted;
                    })
                ))
            ))
        );
    }

    /**
     * Get tasks
     */
    getTasks(): Observable<Task[]>
    {
        return this._httpClient.get<Task[]>('api/apps/tasks/all').pipe(
            tap((response) => {
                this._tasks.next(response);
            })
        );
    }

    /**
     * Update tasks orders
     *
     * @param tasks
     */
    updateTasksOrders(tasks: Task[]): Observable<Task[]>
    {
        return this._httpClient.patch<Task[]>('api/apps/tasks/order', {tasks});
    }

    /**
     * Search tasks with given query
     *
     * @param query
     */
    searchTasks(query: string): Observable<Task[] | null>
    {
        return this._httpClient.get<Task[] | null>('api/apps/tasks/search', {params: {query}});
    }

    /**
     * Get task by id
     */
    getTaskById(id: string): Observable<Task>
    {
        return this._userCards.pipe(
            take(1),
            map((userCards) => {

                // Find the task in user cards
                const userCard = userCards.find(item => item.id === id) || null;

                // Convert UserCard to Task format if found
                let task: Task = null;
                if (userCard) {
                    task = {
                        id: userCard.id,
                        title: userCard.title,
                        notes: userCard.description || '',
                        completed: userCard.status === 'completed' || userCard.status === 'done',
                        dueDate: userCard.dueDate,
                        priority: 0,
                        tags: [],
                        order: userCard.position || 0,
                        type: 'task'
                    };
                }

                // Update the task
                this._task.next(task);

                // Return the task
                return task;
            }),
            switchMap((task) => {

                if ( !task )
                {
                    return throwError('Could not found task with id of ' + id + '!');
                }

                return of(task);
            })
        );
    }

    /**
     * Create task
     *
     * @param type
     */
    createTask(type: string): Observable<Task>
    {
        return this.tasks$.pipe(
            take(1),
            switchMap(tasks => this._httpClient.post<Task>('api/apps/tasks/task', {type}).pipe(
                map((newTask) => {

                    // Update the tasks with the new task
                    this._tasks.next([newTask, ...tasks]);

                    // Return the new task
                    return newTask;
                })
            ))
        );
    }

    /**
     * Update task
     *
     * @param id
     * @param task
     */
    updateTask(id: string, task: Task): Observable<Task>
    {
        return this.tasks$
                   .pipe(
                       take(1),
                       switchMap(tasks => this._httpClient.patch<Task>('api/apps/tasks/task', {
                           id,
                           task
                       }).pipe(
                           map((updatedTask) => {

                               // Find the index of the updated task
                               const index = tasks.findIndex(item => item.id === id);

                               // Update the task
                               tasks[index] = updatedTask;

                               // Update the tasks
                               this._tasks.next(tasks);

                               // Return the updated task
                               return updatedTask;
                           }),
                           switchMap(updatedTask => this.task$.pipe(
                               take(1),
                               filter(item => item && item.id === id),
                               tap(() => {

                                   // Update the task if it's selected
                                   this._task.next(updatedTask);

                                   // Return the updated task
                                   return updatedTask;
                               })
                           ))
                       ))
                   );
    }

    /**
     * Delete the task
     *
     * @param id
     */
    deleteTask(id: string): Observable<boolean>
    {
        return this.tasks$.pipe(
            take(1),
            switchMap(tasks => this._httpClient.delete('api/apps/tasks/task', {params: {id}}).pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted task
                    const index = tasks.findIndex(item => item.id === id);

                    // Delete the task
                    tasks.splice(index, 1);

                    // Update the tasks
                    this._tasks.next(tasks);

                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }

    /**
     * Get user cards
     */
    getUserCards(): Observable<UserCard[]>
    {
        return this._httpClient.get<any>(`${environment.apiBaseUrl}/cards/user/all`).pipe(
            map((response: any) => {
                // Handle API response format
                const cards = response.data || response;
                this._userCards.next(cards);
                return cards;
            })
        );
    }

    /**
     * Update card status
     *
     * @param cardId
     * @param status
     */
    updateCardStatus(cardId: string, status: string): Observable<any>
    {
        return this._httpClient.patch<any>(`${environment.apiBaseUrl}/cards/${cardId}`, {
            status: status
        }).pipe(
            tap(() => {
                // Update local cards data
                const currentCards = this._userCards.getValue();
                if (currentCards) {
                    const updatedCards = currentCards.map(card => 
                        card.id === cardId ? { ...card, status } : card
                    );
                    this._userCards.next(updatedCards);
                }
            })
        );
    }

    /**
     * Update cards order
     *
     * @param cardOrderIds
     */
    updateCardsOrder(cardOrderIds: string[]): Observable<any>
    {
        return this._httpClient.patch<any>(`${environment.apiBaseUrl}/users/card-order`, {
            cardOrderIds: cardOrderIds
        }).pipe(
            tap(() => {
                // Update local cards data with new order
                const currentCards = this._userCards.getValue();
                if (currentCards) {
                    const cardMap = new Map(currentCards.map(card => [card.id, card]));
                    const orderedCards: UserCard[] = [];
                    const completedCards: UserCard[] = [];
                    
                    // Process cards in the order specified by cardOrderIds
                    cardOrderIds.forEach(cardId => {
                        const card = cardMap.get(cardId);
                        if (card) {
                            // Check if card is completed
                            if (this.isCardCompleted(card)) {
                                completedCards.push(card);
                            } else {
                                orderedCards.push(card);
                            }
                            cardMap.delete(cardId);
                        }
                    });
                    
                    // Add any remaining cards that weren't in the order list
                    cardMap.forEach(card => {
                        if (this.isCardCompleted(card)) {
                            completedCards.push(card);
                        } else {
                            orderedCards.push(card);
                        }
                    });
                    
                    // Return ordered cards first, then completed cards at the end
                    this._userCards.next([...orderedCards, ...completedCards]);
                }
            })
        );
    }

    /**
     * Check if a card is completed
     *
     * @param card
     */
    private isCardCompleted(card: UserCard): boolean {
        return card.status === 'completed' || card.status === 'done';
    }

    /**
     * Update UserCard in local state
     *
     * @param updatedCard
     */
    updateUserCard(updatedCard: UserCard): void {
        const currentCards = this._userCards.getValue();
        if (currentCards) {
            const cardIndex = currentCards.findIndex(card => card.id === updatedCard.id);
            if (cardIndex !== -1) {
                const updatedCards = [...currentCards];
                updatedCards[cardIndex] = updatedCard;
                this._userCards.next(updatedCards);
            }
        }
    }
}
