/**
 * Types & Domain Contracts for ARM Exhaust Authentication
 */

export type AuthMode = 'login' | 'register';
export type AuthStep = 'form' | 'otp';

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface AuthApiResponse {
  ok?: boolean;
  user?: UserSession;
  error?: string;
  message?: string | string[];
  requiresOtp?: boolean;
  statusCode?: number;
  status?: number;
}

export interface PromoSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageSrc: string;
  altText: string;
}

export interface AuthFormState {
  mode: AuthMode;
  step?: AuthStep;
  name: string;
  email: string;
  password: string;
  error: string;
  loading: boolean;
  rememberMe?: boolean;
}
