import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-logo">
            <span class="logo-icon">⚡</span>
            <h1>QuickTix</h1>
          </div>
          <p class="subtitle">Sign in to manage and track your support tickets</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div *ngIf="errorMessage()" data-testid="login-error" role="alert" class="alert-box alert-danger">
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              type="email"
              data-testid="login-email"
              [(ngModel)]="email"
              name="email"
              placeholder="qa.user@quicktix.test"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              data-testid="login-password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            data-testid="login-submit"
            class="btn btn-primary btn-block"
            [disabled]="loading()"
          >
            {{ loading() ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <div class="login-footer">
          <p class="demo-hint">Demo QA credentials: <code>qa.user@quicktix.test</code> / <code>Passw0rd!test</code></p>
          <button
            type="button"
            (click)="fillDemoCredentials()"
            class="btn-demo-fill"
          >
            ⚡ Auto-fill Demo Credentials
          </button>
          <p class="demo-subhint">Note: Password has a zero <code>0</code>, not the letter <code>o</code>.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 50% 20%, #1e1e38 0%, #0f172a 100%);
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2.5rem 2rem;
      box-shadow: var(--shadow-lg);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .logo-icon {
      font-size: 1.75rem;
    }

    .brand-logo h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.8rem;
    }

    .login-footer {
      margin-top: 1.75rem;
      text-align: center;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }

    .demo-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .demo-hint code {
      background: #0b1120;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      color: #93c5fd;
    }

    .btn-demo-fill {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      color: #a5b4fc;
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: 0.6rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .btn-demo-fill:hover {
      background: rgba(99, 102, 241, 0.28);
      border-color: #818cf8;
      color: #ffffff;
      transform: translateY(-1px);
    }

    .demo-subhint {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .demo-subhint code {
      background: #0b1120;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      color: #fbbf24;
      font-weight: 600;
    }
  `],
})
export class LoginComponent implements OnInit {
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

    this.authService.login(cleanEmail, cleanPassword).subscribe({
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
