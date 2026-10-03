import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'guest';
  email_verified: boolean;
  verified_at?: string;
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

  // Google Sign-In with Email Verification
  public loginWithVerifiedGoogle(name: string, email: string): void {
    const cleanName = name.trim() || 'Google User';
    const cleanEmail = email.trim() || 'user@gmail.com';
    const googleUser: UserProfile = {
      id: `google_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      provider: 'google',
      email_verified: true,
      verified_at: new Date().toLocaleTimeString('th-TH')
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(googleUser));
    this.currentUserSubject.next(googleUser);
  }

  public loginWithGoogle(): void {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    this.loginWithVerifiedGoogle(`Todaprime User #${randomSuffix}`, `user.${randomSuffix}@gmail.com`);
  }

  public loginWithCustomGoogle(name: string, email: string): void {
    this.loginWithVerifiedGoogle(name, email);
  }

  public logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }
}
