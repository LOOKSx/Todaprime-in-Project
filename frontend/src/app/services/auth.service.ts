import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'guest';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'todaprime_user';
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor() {}

  private getStoredUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  // Google Sign-In (Interactive login flow)
  public loginWithGoogle(): void {
    // Simulated Google OAuth Flow with realistic Google profile
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const googleUser: UserProfile = {
      id: `google_${Date.now()}`,
      name: `Todaprime User #${randomSuffix}`,
      email: `user.${randomSuffix}@gmail.com`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=user${randomSuffix}`,
      provider: 'google'
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(googleUser));
    this.currentUserSubject.next(googleUser);
  }

  public loginWithCustomGoogle(name: string, email: string): void {
    const googleUser: UserProfile = {
      id: `google_${Date.now()}`,
      name: name.trim() || 'Google User',
      email: email.trim() || 'user@gmail.com',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      provider: 'google'
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(googleUser));
    this.currentUserSubject.next(googleUser);
  }

  public logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }
}
