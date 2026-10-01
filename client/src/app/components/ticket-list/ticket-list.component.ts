import { Component, OnInit, signal, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketService, Ticket } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component';
import { TicketComponent } from '../ticket/ticket.component';
import { TicketFormComponent, TicketFormData } from '../ticket-form/ticket-form.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ticket-list',
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    TicketComponent,
    TicketFormComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
})
export class TicketListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private filterSubject = new Subject<string | undefined>();

  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  selectedStatus = 'All';

  // Form Modal State
  isFormModalOpen = signal(false);
  editingTicket: Ticket | null = null;
  isSubmitting = signal(false);
  formServerError = signal('');

  // Delete Modal State
  isConfirmModalOpen = signal(false);
  deletingTicket: Ticket | null = null;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterSubject
      .pipe(
        switchMap((filterStatus) => {
          this.loading.set(true);
          this.cdr.markForCheck();
          return this.ticketService.getTickets(filterStatus).pipe(
            catchError(() => {
              this.loading.set(false);
              this.cdr.markForCheck();
              return of([]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        this.tickets.set(data);
        this.loading.set(false);
        this.cdr.markForCheck();
      });

    this.loadTickets();
  }

  loadTickets(): void {
    const filterStatus = this.selectedStatus === 'All' ? undefined : this.selectedStatus;
    this.filterSubject.next(filterStatus);
  }

  onFilterChange(): void {
    this.loadTickets();
  }

  // Create & Edit Modal Actions
  openCreateModal(): void {
    this.editingTicket = null;
    this.formServerError.set('');
    this.isFormModalOpen.set(true);
    this.cdr.markForCheck();
  }

  openEditModal(ticket: Ticket): void {
    this.editingTicket = ticket;
    this.formServerError.set('');
    this.isFormModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.editingTicket = null;
    this.formServerError.set('');
    this.cdr.markForCheck();
  }

  onSaveTicket(formData: TicketFormData): void {
    this.isSubmitting.set(true);
    this.formServerError.set('');
    this.cdr.markForCheck();

    if (this.editingTicket) {
      const ticketId = this.editingTicket._id;
      this.ticketService
        .updateTicket(ticketId, formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updated) => {
            this.isSubmitting.set(false);
            this.closeFormModal();
            const current = [...this.tickets()];
            const index = current.findIndex((t) => t._id === updated._id);
            if (index !== -1) {
              if (this.selectedStatus === 'All' || this.selectedStatus === updated.status) {
                current[index] = updated;
                this.tickets.set(current);
              } else {
                current.splice(index, 1);
                this.tickets.set(current);
              }
            } else {
              if (this.selectedStatus === 'All' || this.selectedStatus === updated.status) {
                this.loadTickets();
              }
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.formServerError.set(err.error?.message || 'Failed to update ticket');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.ticketService
        .createTicket(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (created) => {
            this.isSubmitting.set(false);
            this.closeFormModal();
            if (this.selectedStatus === 'All' || this.selectedStatus === created.status) {
              this.tickets.set([created, ...this.tickets()]);
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.formServerError.set(err.error?.message || 'Failed to create ticket');
            this.cdr.markForCheck();
          },
        });
    }
  }

  // Delete Confirmation Modal Actions
  openDeleteModal(ticket: Ticket): void {
    this.deletingTicket = ticket;
    this.isConfirmModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    this.isConfirmModalOpen.set(false);
    this.deletingTicket = null;
    this.cdr.markForCheck();
  }

  onConfirmDelete(): void {
    if (!this.deletingTicket) return;

    const id = this.deletingTicket._id;
    this.ticketService
      .deleteTicket(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.tickets.set(this.tickets().filter((t) => t._id !== id));
          this.closeDeleteModal();
          this.cdr.markForCheck();
        },
        error: () => {
          this.closeDeleteModal();
          this.cdr.markForCheck();
        },
      });
  }

  get userEmail(): string {
    return this.authService.getUserEmail() || 'qa.user@quicktix.test';
  }

  onLogout(): void {
    this.authService.logout();
  }
}
