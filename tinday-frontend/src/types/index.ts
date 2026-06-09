// Matches OpenAPI: User schema
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Matches OpenAPI: Session schema
export interface Session {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}

// Matches OpenAPI: AuthResponse schema
// Used by POST /api/auth/login and POST /api/auth/refresh
export interface AuthResponse {
  session: Session;
  user: User;
}

// Matches OpenAPI: Profile schema (own profile — includes preferences)
export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  about: string | null;
  location: string | null;
  experience_years: number;
  skills: string[];
  roles: string[];
  projects: Project[];
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Matches OpenAPI: PublicProfile schema (other users — no preferences)
export interface PublicProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  about: string | null;
  location: string | null;
  experience_years: number;
  skills: string[];
  roles: string[];
  projects: Project[];
}

// Body for PUT /api/profiles/me — all fields optional (partial update)
export interface UpdateProfileRequest {
  name?: string;
  about?: string;
  location?: string;
  experience_years?: number;
  skills?: string[];
  roles?: string[];
  projects?: Project[];
  preferences?: Record<string, unknown>;
}

export interface Project {
  title?: string;
  description?: string;
  url?: string;
  media_url?: string;
  [key: string]: unknown;
}

// Matches OpenAPI: SwipeResponse schema
export interface SwipeResponse {
  swipe: {
    id: string;
    giver_id: string;
    receiver_id: string;
    direction: "RIGHT" | "LEFT";
    created_at: string;
  };
  match: {
    id: string;
    user_a_id: string;
    user_b_id: string;
    created_at: string;
  } | null;
}

// Matches OpenAPI: MatchWithUser schema
// Returned by GET /api/matches
export interface MatchWithUser {
  match_id: string;
  created_at: string;
  user: PublicProfile;
}

// Matches OpenAPI: Message schema
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

// Matches OpenAPI: InboxEntry schema
export interface InboxEntry {
  match_id: string;
  other_user: PublicProfile;
  latest_message: {
    id: string;
    sender_id: string;
    content: string;
    read_at: string | null;
    created_at: string;
  } | null;
  unread_count: number;
  last_activity: string;
}

// Matches OpenAPI: PaginatedProfiles schema
export interface PaginatedProfiles {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
}

// Matches OpenAPI: ChatRequest schema
export interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
}

// Matches OpenAPI: ProfileAnalysis schema
export interface ProfileAnalysis {
  analysis: string;
}

// Local-only type for AI conversation state
export interface AIConversation {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
}
