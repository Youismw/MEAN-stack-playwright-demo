import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketPriority, TicketStatus } from '../../services/ticket.service';

export interface TicketFormData {
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
}

@Component({
  selector: 'app-ticket-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.css',
})
export class TicketFormComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() initialTicket: Ticket | null = null;
  @Input() isSubmitting = false;
  @Input() serverError = '';

  @Output() save = new EventEmitter<TicketFormData>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  description = '';
  priority: TicketPriority = 'Medium';
  status: TicketStatus = 'Open';
  titleError = '';

  get isEditing(): boolean {
    return !!this.initialTicket;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.initialTicket) {
        this.title = this.initialTicket.title;
        this.description = this.initialTicket.description || '';
        this.priority = this.initialTicket.priority;
        this.status = this.initialTicket.status;
      } else {
        this.title = '';
        this.description = '';
        this.priority = 'Medium';
        this.status = 'Open';
      }
      this.titleError = '';
    }
  }

  validateTitle(): void {
    const trimmed = (this.title || '').trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 100) {
      this.titleError = 'Title must be between 3 and 100 characters';
    } else {
      this.titleError = '';
    }
  }

  onSubmit(): void {
    this.validateTitle();
    if (this.titleError) {
      return;
    }

    this.save.emit({
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      status: this.status,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
