import { cards } from './../../../../../mock-api/apps/scrumboard/data';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { debounceTime, Subject, takeUntil, tap } from 'rxjs';
import { assign } from 'lodash-es';
import { DateTime } from 'luxon';
import { ScrumboardService } from 'app/modules/admin/scrumboard/scrumboard.service';
import { Board, Card, Label, Member } from 'app/modules/admin/scrumboard/scrumboard.models';

@Component({
    selector       : 'scrumboard-card-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrumboardCardDetailsComponent implements OnInit, OnDestroy
{
    @ViewChild('labelInput') labelInput: ElementRef<HTMLInputElement>;
    board: Board;
    card: Card;
    cardForm: UntypedFormGroup;
    labels: Label[];
    filteredLabels: Label[];
    members: Member[] = [];
    newChecklistText: string = '';
    selectedMember: string = '';
    newLabels: string = '';

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
        // Lấy danh sách members từ mock data
        this._scrumboardService.getMembers().subscribe(members => {
            this.members = members;
            this._changeDetectorRef.markForCheck();
        });

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
                this.selectedMember = card.member || '';
                this.newLabels = ''; // reset khi mở
            });

        // Prepare the card form
        this.cardForm = this._formBuilder.group({
            id         : [''],
            title      : ['', Validators.required],
            description: [''],
            labels     : [[]],
            dueDate    : [null],
            checklistItems: this._formBuilder.array([]),
            list_id: this.card.listId
        });

        // Fill the form
        this.cardForm.setValue({
            id         : this.card.id,
            title      : this.card.title,
            description: this.card.description,
            labels     : this.card.labels,
            dueDate    : this.card.dueDate,
            checklistItems: [],
            list_id: this.card.listId
        });

        // Update card when there is a value change on the card form
        this.cardForm.valueChanges
            .pipe(
                tap((value) => {

                    // Update the card object
                    this.card = assign(this.card, value);
                }),
                debounceTime(300),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((value) => {

                // Update the card on the server
                this._scrumboardService.updateCard(value.id, value).subscribe();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Khi load card:
        const checklistFormArray = this.cardForm.get('checklistItems') as FormArray;
        checklistFormArray.clear();
        if (this.card && this.card.checklistItems) {
            this.card.checklistItems.forEach(item => {
                checklistFormArray.push(this._formBuilder.group({
                    text: [item.text],
                    checked: [item.checked]
                }));
            });
        }
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Return whether the card has the given label
     *
     * @param label
     */
    hasLabel(label: Label): boolean
    {
        return !!this.card.labels.find(cardLabel => cardLabel.id === label.id);
    }

    /**
     * Filter labels
     *
     * @param event
     */
    filterLabels(event): void
    {
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
    filterLabelsInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no label available...
        if ( this.filteredLabels.length === 0 )
        {
            // Return
            return;
        }

        // If there is a label...
        const label = this.filteredLabels[0];
        const isLabelApplied = this.card.labels.find(cardLabel => cardLabel.id === label.id);

        // If the found label is already applied to the card...
        if ( isLabelApplied )
        {
            // Remove the label from the card
            this.removeLabelFromCard(label);
        }
        else
        {
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
    toggleProductTag(label: Label, change: MatCheckboxChange): void
    {
        if ( change.checked )
        {
            this.addLabelToCard(label);
        }
        else
        {
            this.removeLabelFromCard(label);
        }
    }

    /**
     * Add label to the card
     *
     * @param label
     */
    addLabelToCard(label: Label): void
    {
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
    removeLabelFromCard(label: Label): void
    {
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
    isOverdue(date: string): boolean
    {
        return DateTime.fromISO(date).startOf('day') < DateTime.now().startOf('day');
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

    get checklistItems(): FormArray {
        return this.cardForm.get('checklistItems') as FormArray;
    }

    addChecklistItem() {
        if (this.newChecklistText && this.newChecklistText.trim()) {
            // Sử dụng API checklist mới
            this._scrumboardService.addChecklistItem(this.card.id, this.newChecklistText.trim()).subscribe(() => {
                // Reload card để lấy checklist mới
                this._scrumboardService.getCard(this.card.id).subscribe(updatedCard => {
                    this.card = updatedCard;
                    this._changeDetectorRef.markForCheck();
                });
            });
            this.newChecklistText = '';
        }
    }

    removeChecklistItem(i: number) {
        if (this.card.checklistItems && this.card.checklistItems[i]) {
            // Sử dụng API checklist mới
            const itemId = this.card.checklistItems[i].id;
            if (itemId) {
                this._scrumboardService.deleteChecklistItem(this.card.id, itemId).subscribe(() => {
                    // Reload card để lấy checklist mới
                    this._scrumboardService.getCard(this.card.id).subscribe(updatedCard => {
                        this.card = updatedCard;
                        this._changeDetectorRef.markForCheck();
                    });
                });
            }
        }
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
            } catch {}
        }
        // Nếu card chưa có members, set người tạo là member đầu tiên
        let members = this.card.members && this.card.members.length ? [...this.card.members] : [];
        if (members.length === 0 && creatorId) {
            members = [creatorId];
        }
        // Nếu chọn thêm member mới, thêm vào mảng (không trùng lặp, không xóa creator)
        if (this.selectedMember && !members.includes(this.selectedMember)) {
            members.push(this.selectedMember);
        }
        // Không cho xóa creator (phần tử đầu tiên)
        // (Nếu có UI xóa member, cần kiểm tra index > 0 mới cho xóa)
        const updateData = {
            ...formValue,
            checklistItems: formValue.checklistItems,
            member: this.selectedMember,
            members: members,
            labels: [
                ...this.card.labels,
                ...this.newLabels.split(',').map(l => ({ title: l.trim() })).filter(l => l.title)
            ],
            list_id: this.card.listId
        };
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
    private _readAsDataURL(file: File): Promise<any>
    {
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
