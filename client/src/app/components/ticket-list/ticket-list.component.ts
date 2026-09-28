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
      <!-- Navbar -->
      <header class="navbar">
        <div class="nav-container">
          <div class="nav-brand">
            <span class="brand-icon">⚡</span>
            <span class="brand-name">QuickTix</span>
            <span class="brand-badge">Tracker</span>
          </div>

          <div class="nav-actions">
            <button (click)="onLogout()" class="btn btn-secondary btn-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="content-container">
        <!-- Action Header -->
        <section class="toolbar-section">
          <div class="toolbar-left">
            <h2>Support Tickets</h2>
            <p class="section-subtitle">Track, filter, and resolve incoming technical issues</p>
          </div>

          <div class="toolbar-right">
            <!-- Status Filter -->
            <div class="filter-wrapper">
              <label for="status-filter-select" class="filter-label">Filter:</label>
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

            <!-- Create Button -->
            <button
              data-testid="ticket-new"
              (click)="openCreateModal()"
              class="btn btn-primary"
            >
              + Create Ticket
            </button>
          </div>
        </section>

        <!-- Loading Spinner -->
        <div *ngIf="loading()" data-testid="list-loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading tickets...</span>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!loading() && tickets().length === 0"
          data-testid="ticket-empty"
          class="empty-card"
        >
          <div class="empty-icon">📂</div>
          <h3>No tickets found</h3>
          <p>No tickets match the selected filter or your account has no tickets.</p>
        </div>

        <!-- Ticket List Container -->
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
              <div class="ticket-date">
                {{ ticket.createdAt | date: 'mediumDate' }}
              </div>
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
                class="btn btn-danger btn-sm"
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
            <button (click)="closeFormModal()" class="close-btn">&times;</button>
          </div>

          <form
            data-testid="ticket-form"
            (ngSubmit)="onSaveTicket()"
            class="modal-form"
          >
            <!-- Title -->
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

            <!-- Description -->
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

            <!-- Priority & Status Row -->
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

            <!-- Server Error -->
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

      <!-- Custom Confirm Deletion Modal -->
      <div
        *ngIf="isConfirmModalOpen()"
        data-testid="confirm-dialog"
        class="modal-overlay"
      >
        <div class="modal-content confirm-modal-card">
          <div class="confirm-body">
            <div class="warning-icon">⚠️</div>
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
    }

    /* Navbar */
    .navbar {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      padding: 0.85rem 1.5rem;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-icon {
      font-size: 1.35rem;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .brand-badge {
      font-size: 0.72rem;
      font-weight: 600;
      background: var(--accent-glow);
      color: var(--accent-primary);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    /* Content Area */
    .content-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    /* Toolbar Section */
    .toolbar-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .toolbar-left h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #ffffff;
    }

    .section-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 0.2rem;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .filter-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .native-select {
      width: auto;
      min-width: 140px;
    }

    /* Ticket Grid / List */
    .ticket-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ticket-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .ticket-card:hover {
      border-color: #475569;
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
      gap: 0.75rem;
    }

    .ticket-date {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .ticket-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.35rem;
    }

    .ticket-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .ticket-card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.65rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.75rem;
      margin-top: 0.25rem;
    }

    /* States */
    .loading-state,
    .empty-card {
      background-color: var(--bg-surface);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 3.5rem 2rem;
      text-align: center;
      color: var(--text-secondary);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-card h3 {
      color: #ffffff;
      margin-bottom: 0.35rem;
    }

    /* Modal Form */
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
      color: #ffffff;
      font-size: 1.15rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .close-btn:hover {
      color: #ffffff;
    }

    .modal-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    /* Confirm Modal */
    .confirm-modal-card {
      max-width: 420px;
    }

    .confirm-body {
      padding: 2rem 1.5rem 1.25rem;
      text-align: center;
    }

    .warning-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    .confirm-body h3 {
      color: #ffffff;
      margin-bottom: 0.5rem;
    }

    .confirm-body p {
      color: var(--text-secondary);
      font-size: 0.92rem;
    }

    .confirm-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem 1.5rem;
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
