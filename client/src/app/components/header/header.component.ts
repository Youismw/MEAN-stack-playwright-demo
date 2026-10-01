import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Input() variant: 'login' | 'dashboard' = 'dashboard';
  @Input() badgeText = 'CORE TRACKER';
  @Input() userEmail = '';
  @Input() showUserActions = true;

  @Output() logout = new EventEmitter<void>();

  onLogout(): void {
    this.logout.emit();
  }
}
