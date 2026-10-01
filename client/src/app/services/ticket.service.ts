import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Ticket {
  _id: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  status: TicketStatus;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly apiUrl = '/api/tickets';

  constructor(private http: HttpClient) {}

  getTickets(status?: string): Observable<Ticket[]> {
    let params = new HttpParams();
    if (status && status !== 'All') {
      params = params.set('status', status);
    }
    return this.http.get<Ticket[]>(this.apiUrl, { params });
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(payload: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
  }): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, payload);
  }

  updateTicket(id: string, payload: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
