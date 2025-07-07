import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { Board, Card, Label, List, Member } from 'app/modules/admin/scrumboard/scrumboard.models';
import { environment } from 'app/modules/admin/scrumboard/environments/environment';
import { users as mockUsers } from 'app/mock-api/common/user/data';

@Injectable({
    providedIn: 'root'
})
export class ScrumboardService
{
    // Private
    private _board: BehaviorSubject<Board | null>;
    private _boards: BehaviorSubject<Board[] | null>;
    private _card: BehaviorSubject<Card | null>;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {
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
    get board$(): Observable<Board>
    {
        return this._board.asObservable();
    }

    /**
     * Getter for boards
     */
    get boards$(): Observable<Board[]>
    {
        return this._boards.asObservable();
    }

    /**
     * Getter for card
     */
    get card$(): Observable<Card>
    {
        return this._card.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get boards
     */
    getBoards(email: string): Observable<Board[]>
    {
        return this._httpClient.get<Board[]>(`${environment.apiUrl}/api/boards?email=${email}`)
            .pipe(
                map(response => response.map(item => new Board(item))),
                tap(boards => this._boards.next(boards))
            );
    }

    /**
     * Get board
     *
     * @param id
     */
    getBoard(id: string): Observable<Board>
    {
        return this._httpClient.get<Board>(`${environment.apiUrl}/api/boards/${id}`)
            .pipe(
                map(response => new Board(response)),
                tap(board => this._board.next(board))
            );
    }

    /**
     * Create board
     *
     * @param board
     */
    createBoard(board: Board, ownerEmail: string): Observable<Board>
    {
        debugger
        const userStr = localStorage.getItem('user');
        ownerEmail == userStr
        return this._httpClient.post<Board>(`${environment.apiUrl}/api/boards`, {
            ...board,
            owner_email: ownerEmail
        }).pipe(map(response => new Board(response)));
    }

    /**
     * Update the board
     *
     * @param id
     * @param board
     */
    updateBoard(id: string, board: Board): Observable<Board>
    {
        return this._httpClient.put<Board>(`${environment.apiUrl}/api/boards/${id}`, board)
            .pipe(map(response => new Board(response)));
    }

    /**
     * Delete the board
     *
     * @param id
     */
    deleteBoard(id: string): Observable<any>
    {
        return this._httpClient.delete(`${environment.apiUrl}/api/boards/${id}`);
    }

    /**
     * Create list
     *
     * @param list
     */
    createList(boardId: string, list: List): Observable<List>
    {
        return this._httpClient.post<List>(`${environment.apiUrl}/api/boards/${boardId}/lists`, list)
            .pipe(map(response => new List(response)));
    }

    /**
     * Update the list
     *
     * @param list
     */
    updateList(listId: string, list: List): Observable<List>
    {
        return this._httpClient.put<List>(`${environment.apiUrl}/api/lists/${listId}`, list)
            .pipe(map(response => new List(response)));
    }

    /**
     * Delete the list
     *
     * @param id
     */
    deleteList(listId: string): Observable<any>
    {
        return this._httpClient.delete(`${environment.apiUrl}/api/lists/${listId}`);
    }

    /**
     * Get card
     */
    getCard(id: string): Observable<Card>
    {
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

                if ( !card )
                {
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
    createCard(listId: string, card: Card): Observable<Card>
    {
        return this._httpClient.post<Card>(`${environment.apiUrl}/api/lists/${listId}/cards`, card)
            .pipe(map(response => new Card(response)));
    }

    /**
     * Update the card
     *
     * @param id
     * @param card
     */
    updateCard(cardId: string, card: Card): Observable<Card>
    {
        return this._httpClient.put<Card>(`${environment.apiUrl}/api/cards/${cardId}`, card)
            .pipe(map(response => new Card(response)));
    }

    /**
     * Delete the card
     *
     * @param id
     */
    deleteCard(cardId: string): Observable<any>
    {
        return this._httpClient.delete(`${environment.apiUrl}/api/cards/${cardId}`);
    }

    /**
     * Create label
     *
     * @param label
     */
    createLabel(boardId: string, label: Label): Observable<Label>
    {
        return this._httpClient.post<Label>(`${environment.apiUrl}/api/boards/${boardId}/labels`, label)
            .pipe(map(response => new Label(response)));
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
    search(query: string): Observable<Card[] | null>
    {
        // @TODO: Update the board cards based on the search results
        return this._httpClient.get<Card[] | null>(`${environment.apiUrl}/api/apps/scrumboard/board/search`, {params: {query}});
    }

    /**
     * Reorder lists
     *
     * @param boardId
     * @param listIds
     */
    reorderLists(boardId: string, listIds: string[]): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/boards/${boardId}/lists/reorder`, {
            list_ids: listIds
        });
    }

    /**
     * Reorder cards
     *
     * @param listId
     * @param cardIds
     */
    reorderCards(listId: string, cardIds: string[]): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/lists/${listId}/cards/reorder`, {
            card_ids: cardIds
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
        return this._httpClient.post(`${environment.apiUrl}/api/cards/${cardId}/copy`, {
            list_id: destListId,
            board_id: destBoardId
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
        return this._httpClient.put(`${environment.apiUrl}/api/cards/${cardId}/move`, {
            list_id: destListId,
            board_id: destBoardId
        });
    }

    /**
     * Archive list
     *
     * @param listId
     */
    archiveList(listId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/lists/${listId}/archive`, {});
    }

    /**
     * Restore list
     *
     * @param listId
     */
    restoreList(listId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/lists/${listId}/restore`, {});
    }

    /**
     * Archive card
     *
     * @param cardId
     */
    archiveCard(cardId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/cards/${cardId}/archive`, {});
    }

    /**
     * Restore card
     *
     * @param cardId
     */
    restoreCard(cardId: string): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/cards/${cardId}/restore`, {});
    }

    /**
     * Add checklist item
     *
     * @param cardId
     * @param text
     */
    addChecklistItem(cardId: string, text: string): Observable<any> {
        return this._httpClient.post(`${environment.apiUrl}/api/cards/${cardId}/checklist`, {
            text: text
        });
    }

    /**
     * Update checklist item
     *
     * @param cardId
     * @param itemId
     * @param data
     */
    updateChecklistItem(cardId: string, itemId: string, data: {text?: string, checked?: boolean}): Observable<any> {
        return this._httpClient.put(`${environment.apiUrl}/api/cards/${cardId}/checklist/${itemId}`, data);
    }

    /**
     * Delete checklist item
     *
     * @param cardId
     * @param itemId
     */
    deleteChecklistItem(cardId: string, itemId: string): Observable<any> {
        return this._httpClient.delete(`${environment.apiUrl}/api/cards/${cardId}/checklist/${itemId}`);
    }
}
