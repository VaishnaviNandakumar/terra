/**
 * Session Manager for generating and managing unique session IDs
 */

export class SessionManager {
    private static instance: SessionManager;
    private sessionId: string | null = null;
  
    private constructor() {}
  
    public static getInstance(): SessionManager {
      if (!SessionManager.instance) {
        SessionManager.instance = new SessionManager();
      }
      return SessionManager.instance;
    }
  
    /**
     * Generate a new unique session ID
     */
    public generateSessionId(): string {
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 15);
      this.sessionId = `session_${timestamp}_${randomPart}`;
      return this.sessionId;
    }
  
    /**
     * Get the current session ID
     */
    public getSessionId(): string | null {
      return this.sessionId;
    }
  
    /**
     * Reset the session (generate new ID)
     */
    public resetSession(): string {
      return this.generateSessionId();
    }
  
    /**
     * Check if session exists
     */
    public hasSession(): boolean {
      return this.sessionId !== null;
    }
  }
  
  // Export singleton instance
  export const sessionManager = SessionManager.getInstance();