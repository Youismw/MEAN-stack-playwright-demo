/**
 * ============================================================================
 * FOLDER: client/src/app/services/
 * ============================================================================
 * Service Layer: Contains root-level singleton services (`@Injectable({ providedIn: 'root' })`)
 * that encapsulate business logic, backend API calls, and reactive application state.
 *
 * ============================================================================
 * MODULE: client/src/app/services/auth.service.ts (Client Authentication & Token Vault)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Serves as the single source of truth for user authentication and credentials:
 *   1. Token Storage: Saves and retrieves the JWT in `localStorage` under key `'token'`.
 *   2. Reactive Auth State: Exposes `currentUserToken` as an Angular Signal.
 *   3. Multi-Tab Synchronization: Listens to browser `storage` events so logging out
 *      in one tab immediately logs out all other open tabs.
 *   4. Login & Logout: Sends login requests to `/api/auth/login` and handles teardown.
 *   5. JWT Token Inspection: Base64 decodes the token payload in-browser to read
 *      the user's email and verify the expiration timestamp (`exp`).
 *
 * COMMUNICATES WITH:
 *   - Backend: Sends `POST /api/auth/login` to `server/src/routes/auth.routes.ts`.
 *   - Consumed by `client/src/app/guards/auth.guard.ts` (checks `isAuthenticated()`).
 *   - Consumed by `client/src/app/interceptors/auth.interceptor.ts` (retrieves token).
 *   - Consumed by `LoginComponent`, `HeaderComponent`, and `TicketListComponent`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User submits login form -> calls `authService.login(email, password)`.
 *   2. Server returns `{ token: 'eyJ...' }`.
 *   3. RxJS `tap` saves token to `localStorage` and updates `currentUserToken` signal.
 *   4. User navigates to dashboard.
 *   5. `HeaderComponent` calls `getUserEmail()` -> decodes payload to display email on navbar.
 *   6. When user clicks Logout -> calls `logout()`, purges `localStorage`, and redirects to `/login`.
 * ============================================================================
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  token: string;
}

/**
 * Decodes the Base64Url payload segment of a JWT token without external libraries.
 */
function decodeJwtPayload(token: string): { id?: string; email?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'token';
  // Reactive Signal holding current active token string (or null if logged out)
  readonly currentUserToken = signal<string | null>(this.getToken());

  constructor(private http: HttpClient, private router: Router) {
    // Cross-Tab Synchronization: if user logs out in another browser tab, log out here too
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === this.tokenKey) {
          this.currentUserToken.set(event.newValue);
          if (!event.newValue && !this.router.url.includes('/login')) {
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  /**
   * Submits credentials to the backend login endpoint.
   * On success, persists token to localStorage and updates reactive signal.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.currentUserToken.set(response.token);
        }
      })
    );
  }

  /**
   * Purges stored credentials, clears auth signal, and redirects to login view.
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserToken.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Reads raw token from localStorage.
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Decodes JWT payload to display user email on the navigation header.
   */
  getUserEmail(): string {
    const token = this.getToken();
    if (!token) return '';
    const payload = decodeJwtPayload(token);
    return payload?.email || '';
  }

  /**
   * Inspects exp claim with a 15-second grace window to prevent edge-case race conditions.
   */
  isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    const leewaySeconds = 15;
    return Date.now() >= (payload.exp - leewaySeconds) * 1000;
  }

  /**
   * Synchronously checks if the current user possesses a non-expired token.
   * Used by authGuard to protect routes.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      localStorage.removeItem(this.tokenKey);
      this.currentUserToken.set(null);
      return false;
    }
    return true;
  }
}
