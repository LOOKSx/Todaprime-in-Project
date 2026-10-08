import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'standard';
  email_verified: boolean;
  verified_at?: string;
}

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_USER_KEY = 'todaprime_user';
  private readonly STORAGE_ACCOUNTS_KEY = 'todaprime_accounts';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor() {}

  private getStoredUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(this.STORAGE_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getStoredAccounts(): StoredAccount[] {
    try {
      const data = localStorage.getItem(this.STORAGE_ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredAccounts(accounts: StoredAccount[]): void {
    localStorage.setItem(this.STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  public isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  public readonly GOOGLE_CLIENT_ID = '953392232918-6ro73lc44iactdfu89e2ksdltkr9lbg9.apps.googleusercontent.com';

  public getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  // 1.1 DECODE REAL GOOGLE JWT ID TOKEN (Without external library)
  public decodeGoogleJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode Google JWT token', e);
      return null;
    }
  }

  // 1.2 LOGIN WITH REAL GOOGLE OAUTH CREDENTIAL
  public loginWithGoogleJwt(credential: string): { success: boolean; message: string; user?: UserProfile } {
    const payload = this.decodeGoogleJwt(credential);
    if (!payload || !payload.email) {
      return { success: false, message: 'ไม่สามารถอ่านข้อมูลยืนยันจาก Google ได้ กรุณาลองใหม่อีกครั้ง' };
    }

    const name = payload.name || payload.given_name || 'Google User';
    const email = payload.email.toLowerCase();
    const avatar = payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    const user: UserProfile = {
      id: `google_${payload.sub || Date.now()}`,
      name,
      email,
      avatar,
      provider: 'google',
      email_verified: payload.email_verified ?? true,
      verified_at: new Date().toLocaleTimeString('th-TH')
    };

    localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    return { success: true, message: 'ยืนยันตัวตนผ่าน Google สำเร็จ!', user };
  }

  // 1.3 GOOGLE SIGN-IN MANUAL CONFIRMATION FALLBACK (No OTP)
  public loginWithGoogleAccount(googleName: string, googleEmail: string, googleAvatar?: string): UserProfile {
    const name = googleName.trim() || 'Google User';
    const email = googleEmail.trim() || 'user@gmail.com';
    const avatar = googleAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    const user: UserProfile = {
      id: `google_${Date.now()}`,
      name,
      email,
      avatar,
      provider: 'google',
      email_verified: true,
      verified_at: new Date().toLocaleTimeString('th-TH')
    };

    localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    return user;
  }

  // 2. STANDARD REGISTRATION: Name, Email, Password (at least 8 chars)
  public registerStandard(name: string, email: string, password: string): { success: boolean; message: string; user?: UserProfile } {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      return { success: false, message: 'กรุณากรอกชื่อของคุณ' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' };
    }
    if (!password || password.length < 8) {
      return { success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรขึ้นไป' };
    }

    const accounts = this.getStoredAccounts();
    const existing = accounts.find(a => a.email === cleanEmail);
    if (existing) {
      return { success: false, message: 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบ' };
    }

    const newAccount: StoredAccount = {
      id: `user_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: password,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    this.saveStoredAccounts(accounts);

    const userProfile: UserProfile = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      avatar: newAccount.avatar,
      provider: 'standard',
      email_verified: true,
      verified_at: new Date().toLocaleTimeString('th-TH')
    };

    localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(userProfile));
    this.currentUserSubject.next(userProfile);
    return { success: true, message: 'ลงทะเบียนและเข้าสู่ระบบสำเร็จ!', user: userProfile };
  }

  // 3. STANDARD LOGIN: Email & Password (at least 8 chars)
  public loginStandard(email: string, password: string): { success: boolean; message: string; user?: UserProfile } {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' };
    }
    if (!password || password.length < 8) {
      return { success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรขึ้นไป' };
    }

    const accounts = this.getStoredAccounts();
    const account = accounts.find(a => a.email === cleanEmail);

    if (!account) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบอีเมลหรือลงทะเบียนใหม่' };
    }

    if (account.password !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    const userProfile: UserProfile = {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      provider: 'standard',
      email_verified: true,
      verified_at: new Date().toLocaleTimeString('th-TH')
    };

    localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(userProfile));
    this.currentUserSubject.next(userProfile);
    return { success: true, message: 'เข้าสู่ระบบสำเร็จ!', user: userProfile };
  }

  public logout(): void {
    localStorage.removeItem(this.STORAGE_USER_KEY);
    this.currentUserSubject.next(null);
  }
}
