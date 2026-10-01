import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: any };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform login and store token in localStorage', () => {
    const mockToken = 'mock.jwt.token';
    service.login('qa.user@quicktix.test', 'Passw0rd!test').subscribe((res) => {
      expect(res.token).toBe(mockToken);
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(service.currentUserToken()).toBe(mockToken);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'qa.user@quicktix.test',
      password: 'Passw0rd!test',
    });

    req.flush({ token: mockToken });
  });

  it('should remove token on logout and navigate to /login', () => {
    localStorage.setItem('token', 'active-token');
    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(service.currentUserToken()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should check if user is authenticated correctly based on token', () => {
    // No token
    expect(service.isAuthenticated()).toBe(false);

    // Valid non-expired JWT token with exp in the future
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ id: '1', email: 'user@test.com', exp: futureExp }));
    const validJwt = `${header}.${payload}.signature`;

    localStorage.setItem('token', validJwt);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getUserEmail()).toBe('user@test.com');

    // Expired token
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = btoa(JSON.stringify({ id: '1', email: 'user@test.com', exp: pastExp }));
    const expiredJwt = `${header}.${expiredPayload}.signature`;

    localStorage.setItem('token', expiredJwt);
    expect(service.isAuthenticated()).toBe(false);
  });
});
