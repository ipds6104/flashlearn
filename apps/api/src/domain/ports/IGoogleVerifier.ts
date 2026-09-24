export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}

export interface IGoogleVerifier {
  verifyIdToken(idToken: string): Promise<GoogleUserProfile>;
}
