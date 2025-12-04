export interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  phone?: string;
  role?: string;
  profile_image?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

