import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { DeviceInfo, ServiceResponse, UserSession } from "../types";

export const sessionService = {
  // Create new session
  async createSession(
    userId: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<ServiceResponse<UserSession>> {
    try {
      const sessionData = {
        userId,
        deviceInfo,
        ipAddress,
        loginTime: serverTimestamp(),
        logoutTime: null,
        isActive: true,
      };

      const sessionRef = await addDoc(
        collection(db, "users", userId, "sessions"),
        sessionData
      );

      const session: UserSession = {
        id: sessionRef.id,
        userId,
        deviceInfo,
        ipAddress,
        loginTime: new Date(),
        logoutTime: null,
        isActive: true,
      };

      return { success: true, data: session };
    } catch (error) {
      console.error("Error creating session:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // End session
  async endSession(
    userId: string,
    sessionId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "users", userId, "sessions", sessionId), {
        logoutTime: serverTimestamp(),
        isActive: false,
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error ending session:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // End all active sessions for user
  async endAllUserSessions(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const sessionsQuery = query(
        collection(db, "users", userId, "sessions"),
        where("isActive", "==", true)
      );

      const snapshot = await getDocs(sessionsQuery);

      const updatePromises = snapshot.docs.map((sessionDoc) =>
        updateDoc(doc(db, "users", userId, "sessions", sessionDoc.id), {
          logoutTime: serverTimestamp(),
          isActive: false,
        })
      );

      await Promise.all(updatePromises);

      return { success: true, data: true };
    } catch (error) {
      console.error("Error ending all user sessions:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get user sessions
  async getUserSessions(
    userId: string,
    activeOnly: boolean = false
  ): Promise<ServiceResponse<UserSession[]>> {
    try {
      let sessionsQuery = query(
        collection(db, "users", userId, "sessions"),
        orderBy("loginTime", "desc")
      );

      if (activeOnly) {
        sessionsQuery = query(sessionsQuery, where("isActive", "==", true));
      }

      const snapshot = await getDocs(sessionsQuery);

      const sessions: UserSession[] = snapshot.docs.map((doc) => {
        const sessionData = doc.data();
        return {
          id: doc.id,
          userId,
          ...sessionData,
          loginTime: sessionData.loginTime?.toDate() || new Date(),
          logoutTime: sessionData.logoutTime?.toDate() || null,
        } as UserSession;
      });

      return { success: true, data: sessions };
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get active sessions across all users (admin only)
  async getAllActiveSessions(): Promise<ServiceResponse<UserSession[]>> {
    try {
      // This requires a composite query across all users
      // For better performance, consider maintaining a separate collection for active sessions
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allSessions: UserSession[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const sessionsQuery = query(
          collection(db, "users", userDoc.id, "sessions"),
          where("isActive", "==", true)
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);

        const userSessions: UserSession[] = sessionsSnapshot.docs.map((doc) => {
          const sessionData = doc.data();
          return {
            id: doc.id,
            userId: userDoc.id,
            ...sessionData,
            loginTime: sessionData.loginTime?.toDate() || new Date(),
            logoutTime: sessionData.logoutTime?.toDate() || null,
          } as UserSession;
        });

        allSessions.push(...userSessions);
      }

      // Sort by login time
      allSessions.sort((a, b) => b.loginTime.getTime() - a.loginTime.getTime());

      return { success: true, data: allSessions };
    } catch (error) {
      console.error("Error getting all active sessions:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get session by ID
  async getSessionById(
    userId: string,
    sessionId: string
  ): Promise<ServiceResponse<UserSession>> {
    try {
      const sessionDoc = await getDocs(
        query(
          collection(db, "users", userId, "sessions"),
          where("__name__", "==", sessionId),
          limit(1)
        )
      );

      if (sessionDoc.empty) {
        return { success: false, error: "Session not found" };
      }

      const sessionData = sessionDoc.docs[0].data();
      const session: UserSession = {
        id: sessionDoc.docs[0].id,
        userId,
        ...sessionData,
        loginTime: sessionData.loginTime?.toDate() || new Date(),
        logoutTime: sessionData.logoutTime?.toDate() || null,
      } as UserSession;

      return { success: true, data: session };
    } catch (error) {
      console.error("Error getting session:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete session
  async deleteSession(
    userId: string,
    sessionId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      await deleteDoc(doc(db, "users", userId, "sessions", sessionId));
      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting session:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Clean up old sessions (older than specified days)
  async cleanupOldSessions(
    userId: string,
    olderThanDays: number = 30
  ): Promise<ServiceResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const sessionsQuery = query(
        collection(db, "users", userId, "sessions"),
        where("loginTime", "<", cutoffDate)
      );

      const snapshot = await getDocs(sessionsQuery);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

      await Promise.all(deletePromises);

      return { success: true, data: snapshot.size };
    } catch (error) {
      console.error("Error cleaning up old sessions:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Check if session is valid
  async isSessionValid(
    userId: string,
    sessionId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const sessionResult = await this.getSessionById(userId, sessionId);

      if (!sessionResult.success || !sessionResult.data) {
        return { success: true, data: false };
      }

      const session = sessionResult.data;
      const isValid = session.isActive && !session.logoutTime;

      return { success: true, data: isValid };
    } catch (error) {
      console.error("Error checking session validity:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get session statistics for user
  async getUserSessionStats(userId: string): Promise<
    ServiceResponse<{
      totalSessions: number;
      activeSessions: number;
      avgSessionDuration: number; // in minutes
      lastLoginDate: Date | null;
    }>
  > {
    try {
      const sessionsResult = await this.getUserSessions(userId);

      if (!sessionsResult.success || !sessionsResult.data) {
        return { success: false, error: "Failed to get user sessions" };
      }

      const sessions = sessionsResult.data;
      const activeSessions = sessions.filter((s) => s.isActive).length;

      // Calculate average session duration for completed sessions
      const completedSessions = sessions.filter((s) => s.logoutTime);
      const totalDuration = completedSessions.reduce((sum, session) => {
        if (session.logoutTime) {
          return (
            sum + (session.logoutTime.getTime() - session.loginTime.getTime())
          );
        }
        return sum;
      }, 0);

      const avgSessionDuration =
        completedSessions.length > 0
          ? totalDuration / completedSessions.length / (1000 * 60) // Convert to minutes
          : 0;

      const lastLoginDate = sessions.length > 0 ? sessions[0].loginTime : null;

      const stats = {
        totalSessions: sessions.length,
        activeSessions,
        avgSessionDuration,
        lastLoginDate,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error getting session stats:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Subscribe to user sessions
  subscribeToUserSessions(
    userId: string,
    callback: (sessions: UserSession[]) => void,
    activeOnly: boolean = false
  ): () => void {
    let sessionsQuery = query(
      collection(db, "users", userId, "sessions"),
      orderBy("loginTime", "desc")
    );

    if (activeOnly) {
      sessionsQuery = query(sessionsQuery, where("isActive", "==", true));
    }

    return onSnapshot(sessionsQuery, (snapshot) => {
      const sessions: UserSession[] = snapshot.docs.map((doc) => {
        const sessionData = doc.data();
        return {
          id: doc.id,
          userId,
          ...sessionData,
          loginTime: sessionData.loginTime?.toDate() || new Date(),
          logoutTime: sessionData.logoutTime?.toDate() || null,
        } as UserSession;
      });
      callback(sessions);
    });
  },

  // Update session activity (extend session)
  async updateSessionActivity(
    userId: string,
    sessionId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "users", userId, "sessions", sessionId), {
        lastActivity: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error updating session activity:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get device info helper
  getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },

  // Get client IP helper
  async getClientIP(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error getting client IP:", error);
      return "unknown";
    }
  },
};
