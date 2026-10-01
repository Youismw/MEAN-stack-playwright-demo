import { Component, OnInit, signal, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  email = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tickets']);
    }
  }

  fillDemoCredentials(): void {
    this.email = 'qa.user@quicktix.test';
    this.password = 'Passw0rd!test';
    this.errorMessage.set('');
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.loading.set(true);
    this.cdr.markForCheck();

    const cleanEmail = this.email.trim();
    const cleanPassword = this.password.trim();

    this.authService
      .login(cleanEmail, cleanPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
          this.router.navigate(['/tickets']);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 401) {
            this.errorMessage.set(err.error?.message || 'Invalid email or password');
          } else {
            this.errorMessage.set(err.error?.message || 'Failed to sign in. Please try again.');
          }
          this.cdr.markForCheck();
        },
      });
  }
}
