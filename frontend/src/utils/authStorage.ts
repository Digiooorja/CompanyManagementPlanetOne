const TOKENS_KEY = 'auth_tokens';
const USERS_KEY = 'auth_users';
const ACTIVE_USER_ID_KEY = 'active_user_id';
const LAST_ACTIVE_USER_ID_KEY = 'last_active_user_id';

interface SavedUsers {
  [userId: string]: any;
}

interface SavedTokens {
  [userId: string]: string;
}

export const authStorage = {
  /**
   * Retrieves the token for the active user session in this tab.
   * If no user is active in this tab, falls back to the last active logged-in user,
   * then to the first available user in the dictionary.
   */
  getToken(): string | null {
    const activeUserId = sessionStorage.getItem(ACTIVE_USER_ID_KEY);
    const tokens = this.getAllTokens();

    if (activeUserId && tokens[activeUserId]) {
      return tokens[activeUserId];
    }

    // Fallback 1: Use the last active user across the entire browser
    const lastActiveUserId = localStorage.getItem(LAST_ACTIVE_USER_ID_KEY);
    if (lastActiveUserId && tokens[lastActiveUserId]) {
      // Bind this tab to the last active user
      this.setActiveUserId(lastActiveUserId);
      return tokens[lastActiveUserId];
    }

    // Fallback 2: If no last active user matches, default to the first available user
    const userIds = Object.keys(tokens);
    if (userIds.length > 0) {
      const fallbackUserId = userIds[0];
      this.setActiveUserId(fallbackUserId);
      return tokens[fallbackUserId];
    }

    return null;
  },

  /**
   * Saves the session token and user details under a unique user ID.
   * Also binds this tab and browser fallback to the specified user ID.
   */
  saveSession(userId: number | string, token: string, user: any): void {
    const strUserId = String(userId);

    // 1. Lock this tab to the logged-in user ID
    this.setActiveUserId(strUserId);

    // 2. Add the token to the global dictionary in localStorage
    const tokens = this.getAllTokens();
    tokens[strUserId] = token;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));

    // 3. Add the user details to the global dictionary in localStorage
    const users = this.getAllUsers();
    users[strUserId] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  /**
   * Clears the current tab's active user binding and removes their token/profile
   * from the global localStorage dictionaries.
   */
  clearSession(): void {
    const activeUserId = sessionStorage.getItem(ACTIVE_USER_ID_KEY);
    sessionStorage.removeItem(ACTIVE_USER_ID_KEY);

    if (activeUserId) {
      // Remove this user's token
      const tokens = this.getAllTokens();
      delete tokens[activeUserId];
      if (Object.keys(tokens).length > 0) {
        localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
      } else {
        localStorage.removeItem(TOKENS_KEY);
      }

      // Remove this user's profile info
      const users = this.getAllUsers();
      delete users[activeUserId];
      if (Object.keys(users).length > 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } else {
        localStorage.removeItem(USERS_KEY);
      }

      // Clear last active user if it was this user
      const lastActiveUserId = localStorage.getItem(LAST_ACTIVE_USER_ID_KEY);
      if (lastActiveUserId === activeUserId) {
        const remainingUserIds = Object.keys(tokens);
        if (remainingUserIds.length > 0) {
          localStorage.setItem(LAST_ACTIVE_USER_ID_KEY, remainingUserIds[0]);
        } else {
          localStorage.removeItem(LAST_ACTIVE_USER_ID_KEY);
        }
      }
    } else {
      // Fallback: if somehow there was no activeUserId, wipe all sessions
      localStorage.removeItem(TOKENS_KEY);
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(LAST_ACTIVE_USER_ID_KEY);
    }
  },

  /**
   * Binds the current tab and global fallback to a specific user ID.
   */
  setActiveUserId(userId: number | string): void {
    const strUserId = String(userId);
    sessionStorage.setItem(ACTIVE_USER_ID_KEY, strUserId);
    localStorage.setItem(LAST_ACTIVE_USER_ID_KEY, strUserId);
  },

  /**
   * Helper to retrieve all active tokens from localStorage.
   */
  getAllTokens(): SavedTokens {
    try {
      const data = localStorage.getItem(TOKENS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to parse auth tokens from localStorage', e);
      return {};
    }
  },

  /**
   * Helper to retrieve all active user profiles from localStorage.
   */
  getAllUsers(): SavedUsers {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to parse auth users from localStorage', e);
      return {};
    }
  }
};
