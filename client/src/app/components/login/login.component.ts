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
      <!-- Minimalist Editorial Top Bar -->
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand-monogram">
            <svg class="brand-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span class="brand-title">QUICKTIX</span>
          </div>
          <span class="topbar-tag">ARCHITECTURAL EDITION</span>
        </div>
      </header>

      <!-- Main Login Stage -->
      <main class="login-stage">
        <div class="hero-header">
          <h1 class="hero-title">Resolution makes it real</h1>
          <p class="hero-subtitle">Architectural issue orchestration for high-velocity engineering.</p>
        </div>

        <div class="login-card">
          <div class="card-header">
            <h2>Sign In</h2>
            <p class="card-description">Access your engineering ticket stream</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div *ngIf="errorMessage()" data-testid="login-error" role="alert" class="alert-box alert-danger">
              <svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ errorMessage() }}</span>
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

          <footer class="login-footer">
            <p class="demo-hint">Demo QA credentials: <code>qa.user@quicktix.test</code> / <code>Passw0rd!test</code></p>
            <button
              type="button"
              (click)="fillDemoCredentials()"
              class="btn-demo-fill"
            >
              <svg class="btn-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Auto-fill Demo Credentials
            </button>
            <p class="demo-subhint">Note: Password has a zero <code>0</code>, not the letter <code>o</code>.</p>
          </footer>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: radial-gradient(ellipse at 50% 12%, rgba(68, 47, 30, 0.35) 0%, rgba(12, 10, 9, 0.98) 72%);
    }

    /* Topbar */
    .topbar {
      border-bottom: 1px solid var(--border-color);
      padding: 1.1rem 2rem;
      background: rgba(12, 10, 9, 0.85);
      backdrop-filter: blur(8px);
    }

    .topbar-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-monogram {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      color: var(--text-primary);
    }

    .brand-svg {
      color: var(--accent);
    }

    .brand-title {
      font-family: var(--font-sans);
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      color: var(--text-primary);
    }

    .topbar-tag {
      font-family: var(--font-sans);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      color: var(--text-muted);
      text-transform: uppercase;
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-xs);
    }

    /* Stage */
    .login-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
    }

    .hero-header {
      text-align: center;
      margin-bottom: 2.25rem;
      max-width: 600px;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2.2rem, 4vw, 3.25rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.12;
      color: var(--text-primary);
      margin-bottom: 0.65rem;
    }

    .hero-subtitle {
      font-family: var(--font-sans);
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Card */
    .login-card {
      width: 100%;
      max-width: 440px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 2.5rem 2.25rem;
      box-shadow: var(--shadow-lg);
    }

    .card-header {
      margin-bottom: 1.75rem;
      text-align: left;
    }

    .card-header h2 {
      font-family: var(--font-display);
      font-size: 1.65rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .card-description {
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .alert-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .alert-icon {
      flex-shrink: 0;
      color: #f87171;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .form-group label {
      font-family: var(--font-sans);
      font-size: 0.74rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
    }

    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.85rem;
      font-size: 0.84rem;
      letter-spacing: 0.1em;
    }

    /* Footer */
    .login-footer {
      margin-top: 1.75rem;
      text-align: center;
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
    }

    .demo-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    .demo-hint code {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-xs);
      color: var(--accent);
      font-family: monospace;
      font-size: 0.78rem;
    }

    .btn-demo-fill {
      background: var(--accent-subtle);
      border: 1px solid rgba(197, 155, 109, 0.35);
      color: var(--accent);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-size: 0.76rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 0.85rem;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }

    .btn-demo-fill:hover {
      background: rgba(197, 155, 109, 0.22);
      border-color: var(--accent);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .btn-svg {
      color: currentColor;
    }

    .demo-subhint {
      margin-top: 0.65rem;
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .demo-subhint code {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-xs);
      color: var(--accent);
      font-weight: 600;
      font-family: monospace;
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
