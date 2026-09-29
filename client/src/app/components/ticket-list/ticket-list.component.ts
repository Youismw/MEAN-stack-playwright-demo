import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-layout">
      <!-- Architectural Navbar -->
      <header class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <svg class="brand-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span class="brand-name">QUICKTIX</span>
            <span class="brand-badge">CORE TRACKER</span>
          </div>

          <div class="nav-actions">
            <span class="nav-user-label">qa.user@quicktix.test</span>
            <button (click)="onLogout()" class="btn btn-secondary btn-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Dashboard Stream -->
      <main class="content-container">
        <!-- Action & Filter Header -->
        <section class="toolbar-section">
          <div class="toolbar-left">
            <h2>Support Tickets</h2>
            <p class="section-subtitle">Track, filter, and resolve technical issues with architectural precision</p>
          </div>

          <div class="toolbar-right">
            <!-- Native Status Filter -->
            <div class="filter-wrapper">
              <label for="status-filter-select" class="filter-label">Status Filter</label>
              <select
                id="status-filter-select"
                data-testid="status-filter"
                [(ngModel)]="selectedStatus"
                (change)="onFilterChange()"
                class="native-select"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <!-- Create Button: Squarespace-style Solid White -->
            <button
              data-testid="ticket-new"
              (click)="openCreateModal()"
              class="btn btn-primary"
            >
              + Create Ticket
            </button>
          </div>
        </section>

        <!-- Loading State -->
        <div *ngIf="loading()" data-testid="list-loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading ticket stream...</span>
        </div>

        <!-- Empty State (No Emoji, Monoline SVG) -->
        <div
          *ngIf="!loading() && tickets().length === 0"
          data-testid="ticket-empty"
          class="empty-card"
        >
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="1"/>
              <path d="M7 8h10M7 12h6M7 16h4"/>
            </svg>
          </div>
          <h3>No tickets found</h3>
          <p>No tickets match the selected filter or your account has no tickets.</p>
        </div>

        <!-- Ticket List Grid -->
        <div
          *ngIf="!loading() && tickets().length > 0"
          data-testid="ticket-list"
          class="ticket-grid"
        >
          <article
            *ngFor="let ticket of tickets()"
            data-testid="ticket-row"
            [attr.data-ticket-id]="ticket._id"
            class="ticket-card"
          >
            <div class="ticket-card-header">
              <div class="title-group">
                <span
                  data-testid="ticket-status"
                  [ngClass]="'badge badge-' + getStatusClass(ticket.status)"
                >
                  {{ ticket.status }}
                </span>
                <span [ngClass]="'priority-badge priority-' + ticket.priority.toLowerCase()">
                  • {{ ticket.priority }} Priority
                </span>
              </div>
              <time class="ticket-date">
                {{ ticket.createdAt | date: 'mediumDate' }}
              </time>
            </div>

            <div class="ticket-card-body">
              <h3 data-testid="ticket-title" class="ticket-title">
                {{ ticket.title }}
              </h3>
              <p *ngIf="ticket.description" class="ticket-desc">
                {{ ticket.description }}
              </p>
            </div>

            <div class="ticket-card-footer">
              <button
                data-testid="ticket-edit"
                (click)="openEditModal(ticket)"
                class="btn btn-secondary btn-sm"
              >
                Edit
              </button>
              <button
                data-testid="ticket-delete"
                (click)="openDeleteModal(ticket)"
                class="btn btn-danger-outline btn-sm"
              >
                Delete
              </button>
            </div>
          </article>
        </div>
      </main>

      <!-- Ticket Form Modal (Create / Edit) -->
      <div *ngIf="isFormModalOpen()" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingTicketId ? 'Edit Ticket' : 'Create New Ticket' }}</h3>
            <button (click)="closeFormModal()" class="close-btn" aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form
            data-testid="ticket-form"
            (ngSubmit)="onSaveTicket()"
            class="modal-form"
          >
            <div class="form-group">
              <label for="ticket-title-input">Title *</label>
              <input
                id="ticket-title-input"
                type="text"
                data-testid="ticket-title-input"
                [(ngModel)]="formTitle"
                (input)="validateTitle()"
                name="title"
                placeholder="Brief summary of the issue (3-100 characters)"
                required
              />
              <div
                *ngIf="titleError()"
                data-testid="ticket-title-error"
                role="alert"
                class="field-error"
              >
                {{ titleError() }}
              </div>
            </div>

            <div class="form-group">
              <label for="ticket-description-input">Description</label>
              <textarea
                id="ticket-description-input"
                data-testid="ticket-description-input"
                [(ngModel)]="formDescription"
                name="description"
                placeholder="Provide additional details, reproduction steps, or context (max 500 characters)"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ticket-priority-select">Priority</label>
                <select
                  id="ticket-priority-select"
                  data-testid="ticket-priority-select"
                  [(ngModel)]="formPriority"
                  name="priority"
                  class="native-select"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div class="form-group">
                <label for="ticket-status-select">Status</label>
                <select
                  id="ticket-status-select"
                  data-testid="ticket-status-select"
                  [(ngModel)]="formStatus"
                  name="status"
                  class="native-select"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div *ngIf="formServerError()" role="alert" class="alert-box alert-danger">
              {{ formServerError() }}
            </div>

            <div class="modal-footer">
              <button
                type="button"
                (click)="closeFormModal()"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="ticket-submit"
                class="btn btn-primary"
                [disabled]="isSubmitting()"
              >
                {{ isSubmitting() ? 'Saving...' : 'Save Ticket' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Custom Confirm Deletion Modal (No Emoji, Monoline SVG) -->
      <div
        *ngIf="isConfirmModalOpen()"
        data-testid="confirm-dialog"
        class="modal-overlay"
      >
        <div class="modal-content confirm-modal-card">
          <div class="confirm-body">
            <div class="warning-icon-wrap">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3>Delete Ticket?</h3>
            <p>
              Are you sure you want to delete
              <strong>"{{ deletingTicket?.title }}"</strong>? This action cannot be undone.
            </p>
          </div>

          <div class="confirm-footer">
            <button
              data-testid="confirm-cancel"
              (click)="closeDeleteModal()"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              data-testid="confirm-accept"
              (click)="onConfirmDelete()"
              class="btn btn-danger"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      min-height: 100vh;
      background-color: var(--bg-primary);
      display: flex;
      flex-direction: column;
    }

    .navbar {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      padding: 0.95rem 2rem;
    }

    .nav-container {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .brand-svg {
      color: var(--accent);
    }

    .brand-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.16em;
    }

    .brand-badge {
      font-size: 0.66rem;
      font-weight: 600;
      background: var(--accent-subtle);
      color: var(--accent);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-xs);
      border: 1px solid rgba(197, 155, 109, 0.28);
      letter-spacing: 0.08em;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .nav-user-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      letter-spacing: 0.03em;
    }

    .content-container {
      max-width: 1240px;
      width: 100%;
      margin: 2.5rem auto;
      padding: 0 2rem;
      flex: 1;
    }

    .toolbar-section {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 2.25rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .toolbar-left h2 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 3.2vw, 2.75rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: var(--text-primary);
    }

    .section-subtitle {
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin-top: 0.35rem;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .filter-wrapper {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .filter-label {
      font-size: 0.74rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .native-select {
      width: auto;
      min-width: 150px;
    }

    .ticket-grid {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .ticket-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 1.35rem 1.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    }

    .ticket-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .ticket-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .ticket-date {
      font-size: 0.78rem;
      color: var(--text-muted);
      letter-spacing: 0.03em;
    }

    .ticket-title {
      font-size: 1.12rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
    }

    .ticket-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }

    .ticket-card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.85rem;
      margin-top: 0.25rem;
    }

    .modal-form {
      padding: 1.65rem;
      display: flex;
      flex-direction: column;
      gap: 1.35rem;
    }

    .confirm-modal-card {
      max-width: 440px;
    }

    .confirm-body {
      padding: 2.25rem 2rem 1.5rem;
      text-align: center;
    }

    .warning-icon-wrap {
      color: #f87171;
      margin-bottom: 1rem;
      display: flex;
      justify-content: center;
    }

    .confirm-body h3 {
      font-family: var(--font-display);
      font-size: 1.65rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .confirm-body p {
      color: var(--text-secondary);
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .confirm-body strong {
      color: var(--text-primary);
    }

    .confirm-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      padding: 1.25rem 2rem 1.75rem;
      border-top: 1px solid var(--border-color);
    }
  `],
})
export class TicketListComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  selectedStatus = 'All';
  loading = signal<boolean>(true);

  // Form modal state
  isFormModalOpen = signal(false);
  editingTicketId: string | null = null;
  formTitle = '';
  formDescription = '';
  formPriority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
  formStatus: 'Open' | 'In Progress' | 'Resolved' | 'Closed' = 'Open';
  titleError = signal('');
  formServerError = signal('');
  isSubmitting = signal(false);

  // Delete modal state
  isConfirmModalOpen = signal(false);
  deletingTicket: Ticket | null = null;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.cdr.markForCheck();
    this.ticketService.getTickets(this.selectedStatus).subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.loadTickets();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  // Create & Edit Modal Actions
  openCreateModal(): void {
    this.editingTicketId = null;
    this.formTitle = '';
    this.formDescription = '';
    this.formPriority = 'Medium';
    this.formStatus = 'Open';
    this.titleError.set('');
    this.formServerError.set('');
    this.isFormModalOpen.set(true);
    this.cdr.markForCheck();
  }

  openEditModal(ticket: Ticket): void {
    this.editingTicketId = ticket._id;
    this.formTitle = ticket.title;
    this.formDescription = ticket.description || '';
    this.formPriority = ticket.priority;
    this.formStatus = ticket.status;
    this.titleError.set('');
    this.formServerError.set('');
    this.isFormModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.editingTicketId = null;
    this.cdr.markForCheck();
  }

  validateTitle(): void {
    const trimmed = (this.formTitle || '').trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 100) {
      this.titleError.set('Title must be between 3 and 100 characters');
    } else {
      this.titleError.set('');
    }
    this.cdr.markForCheck();
  }

  onSaveTicket(): void {
    this.validateTitle();
    if (this.titleError()) {
      return;
    }

    this.isSubmitting.set(true);
    this.formServerError.set('');
    this.cdr.markForCheck();

    const payload = {
      title: this.formTitle.trim(),
      description: this.formDescription,
      priority: this.formPriority,
      status: this.formStatus,
    };

    if (this.editingTicketId) {
      this.ticketService.updateTicket(this.editingTicketId, payload).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          const current = [...this.tickets()];
          const index = current.findIndex((t) => t._id === updated._id);
          if (index !== -1) {
            current[index] = updated;
            this.tickets.set(current);
          } else {
            this.loadTickets();
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
      this.ticketService.createTicket(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.tickets.set([created, ...this.tickets()]);
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
    this.ticketService.deleteTicket(id).subscribe({
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

  onLogout(): void {
    this.authService.logout();
  }
}
