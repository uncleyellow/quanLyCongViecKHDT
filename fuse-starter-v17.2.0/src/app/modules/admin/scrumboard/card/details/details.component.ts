import { cards } from './../../../../../mock-api/apps/scrumboard/data';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { debounceTime, Subject, takeUntil, tap, skip } from 'rxjs';
import { assign } from 'lodash-es';
import { DateTime } from 'luxon';
import { ScrumboardService } from 'app/modules/admin/scrumboard/scrumboard.service';
import { Board, Card, Label, Member } from 'app/modules/admin/scrumboard/scrumboard.models';

@Component({
    selector: 'scrumboard-card-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrumboardCardDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('labelInput') labelInput: ElementRef<HTMLInputElement>;
    board: Board;
    card: Card;
    cardForm: UntypedFormGroup;
    labels: Label[];
    filteredLabels: Label[];
    newChecklistText: string = '';
    selectedMember: string = '';
    newLabels: string = '';
    // Time tracking properties
    trackingHistory: any[] = [];
    currentSessionTime: number = 0;
    showHistory: boolean = false; // Mặc định là đóng
    private sessionTimer: any;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        public matDialogRef: MatDialogRef<ScrumboardCardDetailsComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _scrumboardService: ScrumboardService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Không cần lấy mock data nữa, sẽ sử dụng card.members thực tế

        // Get the board
        this._scrumboardService.board$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((board) => {

                // Board data
                this.board = board;

                // Get the labels
                this.labels = this.filteredLabels = board.labels;
            });

        // Get the card details
        this._scrumboardService.card$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((card) => {
                this.card = card;
                let foundListId = undefined;
                for (let i = 0; i < this.board.lists.length; i++) {
                    const list = this.board.lists[i];
                    for (let r = 0; r < list.cards.length; r++) {
                        if (this.card.id === list.cards[r].id) {
                            foundListId = list.id;
                            break;
                        }
                    }
                    if (foundListId) break;
                }
                this.card.listId = foundListId;
                // Sử dụng members thực tế từ card
                if (card.members && Array.isArray(card.members) && card.members.length > 0) {
                    this.selectedMember = card.members[0]; // Lấy member đầu tiên làm selected
                } else {
                    this.selectedMember = '';
                }
                this.newLabels = ''; // reset khi mở
            });

        // Prepare the card form
        this.cardForm = this._formBuilder.group({
            id: [''],
            title: ['', Validators.required],
            description: [''],
            labels: [[]],
            dueDate: [null],
            checklistItems: this._formBuilder.array([]),
            listId: this.card.listId,
            boardId: this.board.id,
            // selectedMember: [this.selectedMember || '']
        });

        // Fill the form
        this.cardForm.setValue({
            id: this.card.id,
            title: this.card.title,
            description: this.card.description,
            labels: this.card.labels,
            dueDate: this.card.dueDate,
            checklistItems: [],
            listId: this.card.listId,
            boardId: this.board.id,
            // selectedMember: [this.selectedMember || '']
        });

        // Update card when there is a value change on the card form
        this.cardForm.valueChanges
            .pipe(
                tap((value) => {

                    // Update the card object
                    this.card = assign(this.card, value);
                }),
                debounceTime(300),
                skip(1), // Bỏ qua lần đầu tiên (khi form được setValue)
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((value: any) => {
                const cardId = value.id;
                delete value.id;

                // Update the card on the server
                this._scrumboardService.updateCard(cardId, value as Card).subscribe();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Không cần khởi tạo checklist form array nữa vì đã chuyển sang sử dụng card.checklistItems trực tiếp
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        
        // Stop session timer
        this.stopSessionTimer();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Return whether the card has the given label
     *
     * @param label
     */
    hasLabel(label: Label): boolean {
        return !!this.card.labels.find(cardLabel => cardLabel.id === label.id);
    }

    /**
     * Filter labels
     *
     * @param event
     */
    filterLabels(event): void {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the labels
        this.filteredLabels = this.labels.filter(label => label.title.toLowerCase().includes(value));
    }

    /**
     * Filter labels input key down event
     *
     * @param event
     */
    filterLabelsInputKeyDown(event): void {
        // Return if the pressed key is not 'Enter'
        if (event.key !== 'Enter') {
            return;
        }

        // If there is no label available...
        if (this.filteredLabels.length === 0) {
            // Return
            return;
        }

        // If there is a label...
        const label = this.filteredLabels[0];
        const isLabelApplied = this.card.labels.find(cardLabel => cardLabel.id === label.id);

        // If the found label is already applied to the card...
        if (isLabelApplied) {
            // Remove the label from the card
            this.removeLabelFromCard(label);
        }
        else {
            // Otherwise add the label to the card
            this.addLabelToCard(label);
        }
    }

    /**
     * Toggle card label
     *
     * @param label
     * @param change
     */
    toggleProductTag(label: Label, change: MatCheckboxChange): void {
        if (change.checked) {
            this.addLabelToCard(label);
        }
        else {
            this.removeLabelFromCard(label);
        }
    }

    /**
     * Add label to the card
     *
     * @param label
     */
    addLabelToCard(label: Label): void {
        // Add the label
        this.card.labels.unshift(label);

        // Update the card form data
        this.cardForm.get('labels').patchValue(this.card.labels);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove label from the card
     *
     * @param label
     */
    removeLabelFromCard(label: Label): void {
        // Remove the label
        this.card.labels.splice(this.card.labels.findIndex(cardLabel => cardLabel.id === label.id), 1);

        // Update the card form data
        this.cardForm.get('labels').patchValue(this.card.labels);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Check if the given date is overdue
     */
    isOverdue(date: string): boolean {
        return DateTime.fromISO(date).startOf('day') < DateTime.now().startOf('day');
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // Không cần getter checklistItems nữa vì đã chuyển sang sử dụng card.checklistItems trực tiếp

    addChecklistItem() {
        if (this.newChecklistText && this.newChecklistText.trim()) {
            const newItemText = this.newChecklistText.trim();

            // Tạo item mới tạm thời để hiển thị ngay lập tức
            const tempItem = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: newItemText,
                checked: false
            };

            // Thêm item mới vào UI ngay lập tức
            if (!this.card.checklistItems) {
                this.card.checklistItems = [];
            }
            this.card.checklistItems.push(tempItem);
            this._changeDetectorRef.markForCheck();

            const currentChecklistItems = this.card.checklistItems || [];

            // Thêm item mới vào checklist
            const newChecklistItems = [
                ...currentChecklistItems,
                // {
                //     id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Tạo ID tạm thời unique
                //     checked: false,
                //     text: newItemText
                // }
            ];
            // Gọi API để lưu vào database
            this._scrumboardService.updateChecklistItem(this.card.id, newChecklistItems).subscribe((response: any) => {
                // Cập nhật item với ID thật từ server (nếu có)
                if (response && response.data) {
                    const serverItem = response.data;
                    const tempIndex = this.card.checklistItems.findIndex(item => item.id === tempItem.id);
                    if (tempIndex !== -1) {
                        this.card.checklistItems[tempIndex] = serverItem;
                        this._changeDetectorRef.markForCheck();
                    }
                }
            }, (error) => {
                // Nếu có lỗi, xóa item tạm thời
                const tempIndex = this.card.checklistItems.findIndex(item => item.id === tempItem.id);
                if (tempIndex !== -1) {
                    this.card.checklistItems.splice(tempIndex, 1);
                    this._changeDetectorRef.markForCheck();
                }
                console.error('Error adding checklist item:', error);
            });

            this.newChecklistText = '';
        }
    }

    removeChecklistItem(i: number) {
        if (this.card.checklistItems && this.card.checklistItems[i]) {
            const itemToRemove = this.card.checklistItems[i];
            const itemId = itemToRemove.id;

            // Xóa item khỏi UI ngay lập tức
            this.card.checklistItems.splice(i, 1);
            this._changeDetectorRef.markForCheck();

            // Gọi API để xóa khỏi database bằng PATCH method
            if (itemId) {
                // Sử dụng PATCH để cập nhật checklistItems mới (không có item bị xóa)
                this._scrumboardService.updateChecklistItem(this.card.id, this.card.checklistItems).subscribe(() => {
                    // Xóa thành công, không cần làm gì thêm
                }, (error) => {
                    // Nếu có lỗi, thêm lại item vào UI
                    this.card.checklistItems.splice(i, 0, itemToRemove);
                    this._changeDetectorRef.markForCheck();
                    console.error('Error removing checklist item:', error);
                });
            }
        }
    }

    toggleChecklistItem(i: number) {
        debugger
        if (this.card.checklistItems && this.card.checklistItems[i]) {
            const item = this.card.checklistItems[i];
            const itemId = item.id;

            // Toggle trạng thái checked ngay lập tức
            item.checked = !item.checked;
            this._changeDetectorRef.markForCheck();

            // Gọi API để cập nhật database
            if (itemId) {
                this._scrumboardService.updateChecklistItem(this.card.id, this.card.checklistItems).subscribe(() => {
                    // Cập nhật thành công, không cần làm gì thêm
                }, (error) => {
                    // Nếu có lỗi, revert lại trạng thái
                    item.checked = !item.checked;
                    this._changeDetectorRef.markForCheck();
                    console.error('Error updating checklist item:', error);
                });
            }
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Time Tracking Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Start or resume time tracking (combined method)
     */
    startOrResumeTracking(): void {
        // Nếu đã có trackingStartTime thì resume, ngược lại thì start
        if (this.card.trackingStartTime) {
            this.resumeTracking();
        } else {
            this.startTracking();
        }
    }

    /**
     * Pause or stop time tracking (combined method)
     */
    pauseOrStopTracking(): void {
        // Nếu đang tracking và có thời gian đã track, thì pause
        // Nếu không có thời gian track hoặc user muốn kết thúc hoàn toàn, thì stop
        if (this.card.totalTimeSpent > 0 || this.currentSessionTime > 30) { // Nếu đã track > 30s thì pause
            this.pauseTracking();
        } else {
            this.stopTracking();
        }
    }

    /**
     * Start time tracking
     */
    startTracking(): void {
        this._scrumboardService.startTimeTracking(this.card.id).subscribe({
            next: () => {
                this.card.isTracking = 1;
                this.card.trackingStartTime = new Date().toISOString();
                this.startSessionTimer();
                this.loadTrackingHistory();
                this.refreshCardData(); // Refresh card data from backend
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error starting tracking:', error);
            }
        });
    }

    /**
     * Pause time tracking
     */
    pauseTracking(): void {
        this._scrumboardService.pauseTimeTracking(this.card.id).subscribe({
            next: () => {
                this.card.isTracking = 0;
                this.card.trackingStartTime = null;
                this.stopSessionTimer();
                this.loadTrackingHistory();
                this.refreshCardData(); // Refresh card data from backend
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error pausing tracking:', error);
            }
        });
    }

    /**
     * Resume time tracking
     */
    resumeTracking(): void {
        this._scrumboardService.resumeTimeTracking(this.card.id).subscribe({
            next: () => {
                this.card.isTracking = 1;
                this.card.trackingStartTime = new Date().toISOString();
                this.startSessionTimer();
                this.loadTrackingHistory();
                this.refreshCardData(); // Refresh card data from backend
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error resuming tracking:', error);
            }
        });
    }

    /**
     * Stop time tracking
     */
    stopTracking(): void {
        this._scrumboardService.stopTimeTracking(this.card.id).subscribe({
            next: () => {
                this.card.isTracking = 0;
                this.card.trackingStartTime = null;
                this.stopSessionTimer();
                this.loadTrackingHistory();
                this.refreshCardData(); // Refresh card data from backend
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error stopping tracking:', error);
            }
        });
    }

    /**
     * Refresh card data from backend
     */
    refreshCardData(): void {
        // Get updated card data from backend
        this._scrumboardService.getBoard(this.board.id).subscribe({
            next: (board) => {
                // Find the current card in the updated board
                for (const list of board.lists) {
                    const foundCard = list.cards.find(c => c.id === this.card.id);
                    if (foundCard) {
                        // Update card with latest data from backend
                        this.card.totalTimeSpent = foundCard.totalTimeSpent;
                        this.card.isTracking = foundCard.isTracking;
                        this.card.trackingStartTime = foundCard.trackingStartTime;
                        this.card.trackingPauseTime = foundCard.trackingPauseTime;
                        console.log('Refreshed card data from backend:', foundCard);
                        break;
                    }
                }
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error refreshing card data:', error);
            }
        });
    }

    /**
     * Load tracking history
     */
    loadTrackingHistory(): void {
        this._scrumboardService.getTimeTrackingHistory(this.card.id).subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    this.trackingHistory = response.data;
                    
                    // Debug logs
                    console.log('Card totalTimeSpent from backend:', this.card.totalTimeSpent);
                    console.log('Tracking history:', this.trackingHistory);
                    
                    // Tính toán tổng thời gian từ lịch sử nếu card chưa có hoặc để kiểm tra
                    const totalTimeFromHistory = this.trackingHistory
                        .filter(record => record.duration > 0)
                        .reduce((total, record) => total + record.duration, 0);
                    
                    console.log('Total time calculated from history:', totalTimeFromHistory);
                    
                    // Nếu card chưa có totalTimeSpent hoặc bằng 0, sử dụng từ lịch sử
                    if (!this.card.totalTimeSpent || this.card.totalTimeSpent === 0) {
                        if (totalTimeFromHistory > 0) {
                            this.card.totalTimeSpent = totalTimeFromHistory;
                            console.log('Updated card totalTimeSpent from history:', this.card.totalTimeSpent);
                        }
                    } else {
                        // Nếu có sự khác biệt lớn, log để debug
                        const difference = Math.abs(this.card.totalTimeSpent - totalTimeFromHistory);
                        if (difference > 60) { // Khác biệt hơn 1 phút
                            console.warn('Large difference between card totalTimeSpent and history:', {
                                cardTotal: this.card.totalTimeSpent,
                                historyTotal: totalTimeFromHistory,
                                difference: difference
                            });
                        }
                    }
                }
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error loading tracking history:', error);
            }
        });
    }

    /**
     * Start session timer
     */
    private startSessionTimer(): void {
        this.stopSessionTimer();
        this.sessionTimer = setInterval(() => {
            if (this.card.isTracking && this.card.trackingStartTime) {
                const now = new Date();
                const startTime = new Date(this.card.trackingStartTime);
                this.currentSessionTime = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                this._changeDetectorRef.markForCheck();
            }
        }, 1000);
    }

    /**
     * Stop session timer
     */
    private stopSessionTimer(): void {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        this.currentSessionTime = 0;
    }

    /**
     * Format time in seconds to HH:mm:ss
     */
    formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Format date time
     */
    formatDateTime(dateTime: string): string {
        return new Date(dateTime).toLocaleString('vi-VN');
    }

    /**
     * Get action text
     */
    getActionText(action: string): string {
        const actionMap = {
            'start': 'Bắt đầu',
            'pause': 'Tạm dừng',
            'resume': 'Tiếp tục',
            'stop': 'Kết thúc'
        };
        return actionMap[action] || action;
    }

    /**
     * Toggle history visibility
     */
    toggleHistory(): void {
        this.showHistory = !this.showHistory;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Reset total time to 0
     */
    resetTotalTime(): void {
        this._scrumboardService.resetTotalTime(this.card.id).subscribe({
            next: () => {
                this.card.isTracking = 0;
                this.card.trackingStartTime = null;
                this.card.trackingPauseTime = 0;
                this.stopSessionTimer();
                this.loadTrackingHistory();
                this.refreshCardData(); // Refresh card data from backend
                console.log('Reset totalTimeSpent to 0');
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error resetting totalTimeSpent:', error);
            }
        });
    }

    // Khi lưu (update card)
    saveDetails() {
        const formValue = this.cardForm.value;
        // Lấy user hiện tại từ localStorage
        let creatorId = '';
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                creatorId = user.id;
            } catch { }
        }
        // Xử lý members từ card thực tế
        let members: any[] = [];
        debugger
        // Lấy members hiện tại từ card
        if (this.card.members && Array.isArray(this.card.members)) {
            members = [...this.card.members];
        } else if (this.card.members && typeof this.card.members === 'string') {
            members = [this.card.members];
        }
        
        // Nếu card chưa có members, set người tạo là member đầu tiên
        if (members.length === 0 && creatorId) {
            members.push({
                memberId: creatorId,
                cardId: this.card.id,
                role: 'member'
            })
            // members = [creatorId];
        }
        debugger
        
        // Nếu chọn thêm member mới, thêm vào mảng (không trùng lặp)
        if (this.selectedMember && !members.includes(this.selectedMember)) {
            members.push(this.selectedMember);
        }
        // Không cho xóa creator (phần tử đầu tiên)
        // (Nếu có UI xóa member, cần kiểm tra index > 0 mới cho xóa)

        // Lấy danh sách label id hiện tại
        const labelIds = this.card.labels.map(l => l.id);

        // Nếu có nhãn mới, tạo nhãn mới trước (nếu có API)
        // Ở đây chỉ lấy id các nhãn đã có, nhãn mới sẽ được tạo ở chỗ khác

        const updateData = {
            ...formValue,
            checklistItems: this.card.checklistItems, // Sử dụng checklistItems từ card object
            // member: this.selectedMember,
            members: members,
            labels: labelIds, // <-- truyền mảng id nhãn
            listId: this.card.listId,
            boardId: this.board.id
        };
        delete updateData.id;
        this._scrumboardService.updateCard(this.card.id, updateData).subscribe();
    }

    onSave() {
        this.saveDetails(); // Đã có sẵn logic lưu
        this.matDialogRef.close(true); // Đóng dialog, có thể truyền dữ liệu nếu muốn
    }

    onCancel() {
        this.matDialogRef.close(false); // Đóng dialog, không lưu
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Read the given file for demonstration purposes
     *
     * @param file
     */
    private _readAsDataURL(file: File): Promise<any> {
        // Return a new promise
        return new Promise((resolve, reject) => {

            // Create a new reader
            const reader = new FileReader();

            // Resolve the promise on success
            reader.onload = (): void => {
                resolve(reader.result);
            };

            // Reject the promise on error
            reader.onerror = (e): void => {
                reject(e);
            };

            // Read the file as the
            reader.readAsDataURL(file);
        });
    }
}
