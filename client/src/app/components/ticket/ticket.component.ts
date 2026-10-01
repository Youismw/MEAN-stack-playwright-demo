import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../services/ticket.service';

@Component({
  selector: 'app-ticket',
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.css',
})
export class TicketComponent {
  @Input({ required: true }) ticket!: Ticket;

  @Output() edit = new EventEmitter<Ticket>();
  @Output() delete = new EventEmitter<Ticket>();

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  get statusBadgeClass(): string {
    return `badge badge-${this.getStatusClass(this.ticket.status)}`;
  }

  get priorityBadgeClass(): string {
    return `priority-badge priority-${this.ticket.priority.toLowerCase()}`;
  }

  onEdit(): void {
    this.edit.emit(this.ticket);
  }

  onDelete(): void {
    this.delete.emit(this.ticket);
  }
}
