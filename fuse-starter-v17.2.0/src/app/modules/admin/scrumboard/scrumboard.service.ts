import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Board, Card, CreateCard, CreateList, Label, List, Member, UpdateList } from 'app/modules/admin/scrumboard/scrumboard.models';
import { ViewConfig, RecurringConfig } from 'app/modules/admin/scrumboard/scrumboard.types';
// import { environment } from 'app/modules/admin/scrumboard/environments/environment';
import { users as mockUsers } from 'app/mock-api/common/user/data';
import { environment } from 'environments/environment.local';

@Injectable({
    providedIn: 'root'
})
export class ScrumboardService {
    // Private
    private _board: BehaviorSubject<Board | null>;
    private _boards: BehaviorSubject<Board[] | null>;
    private _card: BehaviorSubject<Card | null>;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    ) {
        // Set the private defaults
        this._board = new BehaviorSubject(null);
        this._boards = new BehaviorSubject(null);
        this._card = new BehaviorSubject(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for board
     */
    get board$(): Observable<Board> {
        return this._board.asObservable();
    }

    /**
     * Getter for boards
     */
    get boards$(): Observable<Board[]> {
        return this._boards.asObservable();
    }

    /**
     * Getter for card
     */
    get card$(): Observable<Card> {
        return this._card.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get boards
     */
    getBoards(userId: string): Observable<Board[]> {
        return this._httpClient.get<Board[]>(`${environment.apiBaseUrl}/boards`)
            .pipe(
                map((response: any) => {
                    // Handle API response with { data: [...] }
                    if (response && Array.isArray(response.data)) {
                        return response.data.map(item => new Board(item));
                    }
                    // Fallback: if response itself is an array
                    if (Array.isArray(response)) {
                        return response.map(item => new Board(item));
                    }
                    // Unexpected format
                    console.error('Unexpected boards response format:', response);
                    return [];
                }),
                tap(boards => this._boards.next(boards))
            );
    }

    /**
     * Get board
     *
     * @param id
     */
    getBoard(id: string): Observable<Board> {
        return this._httpClient.get<Board>(`${environment.apiBaseUrl}/boards/${id}`)
            .pipe(
                map((response: any) => {
                    // Handle API response with { data: {...} }
                    if (response && response.data) {
                        return new Board(response.data);
                    }
                    // Fallback: if response itself is the board data
                    if (response && response.id) {
                        return new Board(response);
                    }
                    // Unexpected format
                    console.error('Unexpected board response format:', response);
                    return new Board({ title: 'Unknown Board' });
                }),
                tap(board => {
                    this._board.next(board)
                })
            );
    }

    /**
     * Create board
     *
     * @param board
     */
    createBoard(board: Board, ownerEmail: string): Observable<Board> {
        // debugger
        // const userStr = localStorage.getItem('user');
        // ownerEmail == userStr
        const createBoardPayload = {
            title: board.title,
            description: board.description,
            icon: board.icon,
        }
        return this._httpClient.post<Board>(`${environment.apiBaseUrl}/boards`, createBoardPayload).pipe(map((response: any) => {
            // Handle API response with { data: {...} }
            if (response && response.data) {
                return new Board(response.data);
            }
            // Fallback: if response itself is the board data
            if (response && response.id) {
                return new Board(response);
            }
            // Unexpected format
            console.error('Unexpected create board response format:', response);
            return new Board({ title: 'Unknown Board' });
        }));
    }

    /**
     * Update the board
     *
     * @param id
     * @param board
     */
    updateBoard(id: string, board: Board): Observable<Board> {
        return this._httpClient.put<Board>(`${environment.apiBaseUrl}/boards/${id}`, board)
            .pipe(map((response: any) => {
                // Handle API response with { data: {...} }
                if (response && response.data) {
                    return new Board(response.data);
                }
                // Fallback: if response itself is the board data
                if (response && response.id) {
                    return new Board(response);
                }
                // Unexpected format
                console.error('Unexpected update board response format:', response);
                return new Board({ title: 'Unknown Board' });
            }));
    }

    /**
     * Delete the board
     *
     * @param id
     */
    deleteBoard(id: string): Observable<any> {
        return this._httpClient.delete(`${environment.apiBaseUrl}/boards/${id}`);
    }

    /**
     * Update board view config
     *
     * @param id
     * @param viewConfig
     */
    updateBoardViewConfig(id: string, viewConfig: ViewConfig): Observable<Board> {
        return this._httpClient.patch<Board>(`${environment.apiBaseUrl}/boards/${id}/view-config`, { viewConfig })
            .pipe(
                map((response: any) => {
                    // Handle API response with { data: {...} }
                    if (response && response.data) {
                        return new Board(response.data);
                    }
                    // Fallback: if response itself is the board data
                    if (response && response.id) {
                        return new Board(response);
                    }
                    // Unexpected format
                    console.error('Unexpected update view config response format:', response);
                    return new Board({ title: 'Unknown' });
                }),
                tap(board => {
                    // Update the current board if it matches
                    this._board.pipe(take(1)).subscribe(currentBoard => {
                        if (currentBoard && currentBoard.id === id) {
                            this._board.next(board);
                        }
                    });
                })
            );
    }

    /**
     * Update board recurring config
     *
     * @param id
     * @param recurringConfig
     */
    updateBoardRecurringConfig(id: string, recurringConfig: RecurringConfig): Observable<Board> {
        return this._httpClient.patch<Board>(`${environment.apiBaseUrl}/boards/${id}/recurring-config`, { recurringConfig })
            .pipe(
                map((response: any) => {
                    // Handle API response with { data: {...} }
                    if (response && response.data) {
                        return new Board(response.data);
                    }
                    // Fallback: if response itself is the board data
                    if (response && response.id) {
                        return new Board(response);
                    }
                    // Unexpected format
                    console.error('Unexpected update recurring config response format:', response);
                    return new Board({ title: 'Unknown' });
                }),
                tap(board => {
                    // Update the current board if it matches
                    this._board.pipe(take(1)).subscribe(currentBoard => {
                        if (currentBoard && currentBoard.id === id) {
                            this._board.next(board);
                        }
                    });
                })
            );
    }

    /**
     * Create list
     *
     * @param list
     */
    createList(boardId: string, list: CreateList): Observable<List> {
        return this._httpClient.post<List>(`${environment.apiBaseUrl}/lists`, list)
            .pipe(map((response: any) => {
                // Handle API response with { data: {...} }
                if (response && response.data) {
                    return new List(response.data);
                }
                // Fallback: if response itself is the list data
                if (response && response.id) {
                    return new List(response);
                }
                // Unexpected format
                console.error('Unexpected create list response format:', response);
                return new List({ boardId: boardId, title: 'Unknown List', cards: [] });
            }));
    }

    /**
     * Update the list
     *
     * @param list
     */
    updateList(listId: string, list: UpdateList): Observable<List> {
        return this._httpClient.put<List>(`${environment.apiBaseUrl}/lists/${listId}`, list)
            .pipe(map((response: any) => {
                // Handle API response with { data: {...} }
                if (response && response.data) {
                    return new List(response.data);
                }
                // Fallback: if response itself is the list data
                if (response && response.id) {
                    return new List(response);
                }
                // Unexpected format
                console.error('Unexpected update list response format:', response);
                return new List({ boardId: list.boardId, title: list.title, cards: [] });
            }));
    }

    /**
     * Delete the list
     *
     * @param id
     */
    deleteList(listId: string): Observable<any> {
        return this._httpClient.delete(`${environment.apiBaseUrl}/lists/${listId}`);
    }

    /**
     * Get card
     */
    getCard(id: string): Observable<Card> {
        return this._board.pipe(
            take(1),
            map((board) => {

                // Find the card
                const card = board.lists.find(list => list.cards.some(item => item.id === id))
                    .cards.find(item => item.id === id);

                // Update the card
                this._card.next(card);

                // Return the card
                return card;
            }),
            switchMap((card) => {

                if (!card) {
                    return throwError('Could not found the card with id of ' + id + '!');
                }

                return of(card);
            })
        );
    }

    /**
     * Create card
     *
     * @param card
     */
    createCard(listId: string, card: CreateCard): Observable<Card> {
        console.log('Creating card with data:', card);
        
        return this._httpClient.post<Card>(`${environment.apiBaseUrl}/cards`, card)
            .pipe(map((response: any) => {
                console.log('Create card API response:', response);
                
                // Handle API response with { data: {...} }
                if (response && response.data) {
                    console.log('Using response.data:', response.data);
                    return new Card(response.data);
                }
                // Fallback: if response itself is the card data
                if (response && response.id) {
                    console.log('Using response directly:', response);
                    return new Card(response);
                }
                // Unexpected format
                console.error('Unexpected create card response format:', response);
                return new Card({ boardId: card.boardId, listId: listId, position: 0, title: 'Unknown Card' });
            }));
    }

    /**
     * Update the card
     *
     * @param id
     * @param card
     */
    updateCard(cardId: string, card: Card): Observable<Card> {
        console.log('Updating card with ID:', cardId, 'and data:', card);
        
        // Filter only allowed fields according to backend validation
        const allowedFields = {
            title: card.title,
            description: card.description,
            dueDate: card.dueDate,
            listId: card.listId,
            boardId: card.boardId,
            status: card.status,
            checklistItems: card.checklistItems,
            labels: card.labels,
            members: card.members
        };

        return this._httpClient.put<Card>(`${environment.apiBaseUrl}/cards/${cardId}`, allowedFields)
            .pipe(
                map((response: any) => {
                    console.log('Update card API response:', response);
                    
                    // Handle API response with { data: {...} }
                    if (response && response.data) {
                        return new Card(response.data);
                    }
                    // Fallback: if response itself is the card data
                    if (response && response.id) {
                        return new Card(response);
                    }
                    // Unexpected format
                    console.error('Unexpected update card response format:', response);
                    return new Card({ boardId: card.boardId, listId: card.listId, position: card.position, title: card.title });
                }),
                tap((updatedCard) => {
                    // Fetch lại board sau khi cập nhật card thành công
                    if (card.boardId) {
                        this.getBoard(card.boardId).subscribe();
                    }
                })
            );
    }

    /**
     * Delete the card
     *
     * @param id
     */
    deleteCard(cardId: string): Observable<any> {
        return this._httpClient.delete(`${environment.apiBaseUrl}/cards/${cardId}`);
    }

    /**
     * Create label
     *
     * @param label
     */
    createLabel(boardId: string, label: Label): Observable<Label> {
        return this._httpClient.post<Label>(`${environment.apiBaseUrl}/boards/${boardId}/labels`, label)
            .pipe(map((response: any) => {
                // Handle API response with { data: {...} }
                if (response && response.data) {
                    return new Label(response.data);
                }
                // Fallback: if response itself is the label data
                if (response && response.id) {
                    return new Label(response);
                }
                // Unexpected format
                console.error('Unexpected create label response format:', response);
                return new Label({ id: null, boardId: boardId, title: label.title });
            }));
    }

    /**
     * Lấy danh sách member (mock)
     */
    getMembers(): Observable<Member[]> {
        return of(mockUsers.map(u => new Member({ id: u.id, name: u.name, avatar: u.avatar })));
    }

    /**
     * Lấy member theo email (mock)
     */
    getMemberByEmail(email: string): Observable<Member | undefined> {
        const found = mockUsers.find(u => u.email === email);
        return of(found ? new Member({ id: found.id, name: found.name, avatar: found.avatar }) : undefined);
    }

    /**
     * Thêm member vào board (mock, chỉ trả về thành công)
     */
    addMemberToBoard(boardId: string, memberId: string): Observable<any> {
        // FE tự xử lý, backend không lưu trạng thái
        return of({ message: 'Member added to board (mock)' });
    }

    /**
     * Xóa member khỏi board (mock, chỉ trả về thành công)
     */
    removeMemberFromBoard(boardId: string, memberId: string): Observable<any> {
        // FE tự xử lý, backend không lưu trạng thái
        return of({ message: 'Member removed from board (mock)' });
    }

    /**
     * Update card positions
     *
     * @param cards
     */
    updateCardPositions(cards: Card[]): void // Observable<Card[]>
    {
        /*return this._httpClient.patch<Card[]>('api/apps/scrumboard/board/card/positions', {cards}).pipe(
            map((response) => response.map((item) => new Card(item))),
            tap((updatedCards) => {

                // Get the board value
                const board = this._board.value;

                // Find the card and update it
                board.lists.forEach((listItem) => {
                    listItem.cards.forEach((cardItem, index, array) => {
                        if ( cardItem.id === id )
                        {
                            array[index] = updatedCard;
                        }
                    });
                });

                // Update the lists
                board.lists = updatedLists;

                // Sort the board lists
                board.lists.sort((a, b) => a.position - b.position);

                // Update the board
                this._board.next(board);
            })
        );*/
    }

    /**
     * Search within board cards
     *
     * @param query
     */
    search(query: string): Observable<Card[] | null> {
        // @TODO: Update the board cards based on the search results
        return this._httpClient.get<Card[] | null>(`${environment.apiBaseUrl}/api/apps/scrumboard/board/search`, { params: { query } });
    }

    /**
     * Reorder lists
     *
     * @param boardId
     * @param listIds
     */
    reorderLists(boardId: string, listIds: string[]): Observable<any> {
        return this._httpClient.patch(`${environment.apiBaseUrl}/boards/${boardId}/reorder`, {
            listOrderIds: listIds
        });
    }

    /**
     * Reorder cards
     *
     * @param listId
     * @param cardIds
     */
    reorderCards(listId: string, cardIds: string[]): Observable<any> {
        return this._httpClient.patch(`${environment.apiBaseUrl}/lists/${listId}/reorder`, {
            cardOrderIds: cardIds
        });
    }

    /**
     * Copy card
     *
     * @param cardId
     * @param destListId
     * @param destBoardId
     */
    copyCard(cardId: string, destListId: string, destBoardId: string): Observable<any> {
        return this._httpClient.post(`${environment.apiBaseUrl}/api/cards/${cardId}/copy`, {
            listId: destListId,
            boardId: destBoardId
        });
    }

    /**
     * Move card
     *
     * @param cardId
     * @param destListId
     * @param destBoardId
     */
    moveCard(cardId: string, destListId: string, destBoardId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiBaseUrl}/api/cards/${cardId}/move`, {
            listId: destListId,
            boardId: destBoardId
        });
    }

    /**
     * Archive list
     *
     * @param listId
     */
    archiveList(listId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiBaseUrl}/api/lists/${listId}/archive`, {});
    }

    /**
     * Restore list
     *
     * @param listId
     */
    restoreList(listId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiBaseUrl}/api/lists/${listId}/restore`, {});
    }

    /**
     * Archive card
     *
     * @param cardId
     */
    archiveCard(cardId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiBaseUrl}/api/cards/${cardId}/archive`, {});
    }

    /**
     * Restore card
     *
     * @param cardId
     */
    restoreCard(cardId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiBaseUrl}/api/cards/${cardId}/restore`, {});
    }

    /**
     * Update checklist item
     *
     * @param cardId
     * @param newChecklistItems
     */
    updateChecklistItem(cardId: string, newChecklistItems: any[]): Observable<any> {       

        // Cập nhật card với checklist mới
        return this._httpClient.patch(`${environment.apiBaseUrl}/cards/${cardId}`, {
            checklistItems: newChecklistItems
        }).pipe(
            map((response: any) => {
                // Handle API response format
                if (response && response.data) {
                    return response.data;
                }
                return response;
            })
        );
    }

    /**
     * Update board order
     *
     * @param boardOrderIds
     */
    updateBoardOrder(boardOrderIds: string[]): Observable<any> {
        return this._httpClient.put<any>(`${environment.apiBaseUrl}/boards/order`, { boardOrderIds });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Time Tracking Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Start time tracking for a card
     */
    startTimeTracking(cardId: string, note?: string): Observable<any> {
        return this._httpClient.post<any>(`${environment.apiBaseUrl}/cards/tracking`, {
            cardId,
            action: 'start',
            note
        });
    }

    /**
     * Pause time tracking for a card
     */
    pauseTimeTracking(cardId: string, note?: string): Observable<any> {
        return this._httpClient.post<any>(`${environment.apiBaseUrl}/cards/tracking`, {
            cardId,
            action: 'pause',
            note
        });
    }

    /**
     * Resume time tracking for a card
     */
    resumeTimeTracking(cardId: string, note?: string): Observable<any> {
        return this._httpClient.post<any>(`${environment.apiBaseUrl}/cards/tracking`, {
            cardId,
            action: 'resume',
            note
        });
    }

    /**
     * Stop time tracking for a card
     */
    stopTimeTracking(cardId: string, note?: string): Observable<any> {
        return this._httpClient.post<any>(`${environment.apiBaseUrl}/cards/tracking`, {
            cardId,
            action: 'stop',
            note
        });
    }

    /**
     * Get time tracking history for a card
     */
    getTimeTrackingHistory(cardId: string): Observable<any> {
        return this._httpClient.get<any>(`${environment.apiBaseUrl}/cards/tracking/${cardId}/history`);
    }

    /**
     * Get card time summary
     */
    getCardTimeSummary(cardId: string): Observable<any> {
        return this._httpClient.get<any>(`${environment.apiBaseUrl}/cards/tracking/${cardId}/summary`);
    }

    /**
     * Reset total time for a card
     */
    resetTotalTime(cardId: string): Observable<any> {
        return this._httpClient.post<any>(`${environment.apiBaseUrl}/cards/tracking/${cardId}/reset`, {});
    }
}
