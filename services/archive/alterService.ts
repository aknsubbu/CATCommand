import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";

// ============================================
// INTERFACES
// ============================================

export interface AlertLocation {
  site: string;
  area: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AlertAction {
  id: string;
  description: string;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface AlertResolution {
  resolvedBy: string;
  resolution: string;
  actionsTaken: string[];
  rootCause?: string;
  preventiveMeasures?: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  timestamp: Date;
}

export interface Alert {
  id?: string;
  alertId: string; // Unique alert identifier
  machineId?: string;
  userId?: string; // User who created/triggered the alert
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "mechanical"
    | "electrical"
    | "hydraulic"
    | "safety"
    | "operational"
    | "maintenance"
    | "fuel"
    | "temperature"
    | "system";
  type: "automatic" | "manual" | "predictive";
  status:
    | "active"
    | "acknowledged"
    | "in_progress"
    | "resolved"
    | "closed"
    | "escalated";
  priority: "low" | "medium" | "high" | "urgent";
  location: AlertLocation;
  source: {
    component?: string;
    sensor?: string;
    system?: string;
    errorCode?: string;
  };
  alertData: {
    reading?: number;
    threshold?: number;
    unit?: string;
    normalRange?: {
      min: number;
      max: number;
    };
  };
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  estimatedResolutionTime?: number; // in minutes
  actualResolutionTime?: number; // in minutes
  actions: AlertAction[];
  resolution?: AlertResolution;
  tags: string[];
  relatedAlerts: string[]; // IDs of related alerts
  escalationRules: {
    escalateAfter: number; // minutes
    escalateTo: string[]; // user IDs
    maxEscalations: number;
    currentEscalationLevel: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlertData {
  machineId?: string;
  userId?: string;
  title: string;
  description: string;
  severity: Alert["severity"];
  category: Alert["category"];
  type: Alert["type"];
  priority?: Alert["priority"];
  location: AlertLocation;
  source: Alert["source"];
  alertData?: Alert["alertData"];
  estimatedResolutionTime?: number;
  tags?: string[];
}

export interface UpdateAlertData {
  title?: string;
  description?: string;
  severity?: Alert["severity"];
  priority?: Alert["priority"];
  status?: Alert["status"];
  assignedTo?: string;
  estimatedResolutionTime?: number;
  tags?: string[];
  source?: Alert["source"];
  alertData?: Alert["alertData"];
}

export interface AlertFilters {
  machineId?: string;
  userId?: string;
  severity?: string;
  category?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  location?: {
    site?: string;
    area?: string;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  isActive?: boolean;
}

export interface PaginationOptions {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

export interface AlertStats {
  total: number;
  active: number;
  critical: number;
  avgResolutionTime: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  escalated: number;
  overdue: number;
}

// ============================================
// ALERT SERVICE
// ============================================

export const alertService = {
  // Create new alert
  async createAlert(alertData: CreateAlertData): Promise<Alert> {
    try {
      const alertId = `ALERT-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;

      const newAlert = {
        alertId,
        machineId: alertData.machineId || null,
        userId: alertData.userId || null,
        title: alertData.title,
        description: alertData.description,
        severity: alertData.severity,
        category: alertData.category,
        type: alertData.type,
        status: "active" as const,
        priority: alertData.priority || "medium",
        location: alertData.location,
        source: alertData.source,
        alertData: alertData.alertData || {},
        estimatedResolutionTime: alertData.estimatedResolutionTime,
        actions: [],
        tags: alertData.tags || [],
        relatedAlerts: [],
        escalationRules: {
          escalateAfter:
            alertData.severity === "critical"
              ? 15
              : alertData.severity === "high"
              ? 60
              : 240,
          escalateTo: [],
          maxEscalations: 3,
          currentEscalationLevel: 0,
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "alerts"), newAlert);

      return {
        id: docRef.id,
        ...newAlert,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Alert;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  },

  // Get alert by ID
  async getAlert(id: string): Promise<Alert | null> {
    try {
      const alertDoc = await getDoc(doc(db, "alerts", id));

      if (!alertDoc.exists()) {
        return null;
      }

      const alertData = alertDoc.data();
      return {
        id: alertDoc.id,
        ...alertData,
        acknowledgedAt: alertData.acknowledgedAt
          ? alertData.acknowledgedAt.toDate()
          : undefined,
        actions:
          alertData.actions?.map((action: any) => ({
            ...action,
            dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
            completedAt: action.completedAt
              ? action.completedAt.toDate()
              : undefined,
          })) || [],
        resolution: alertData.resolution
          ? {
              ...alertData.resolution,
              followUpDate: alertData.resolution.followUpDate
                ? alertData.resolution.followUpDate.toDate()
                : undefined,
              timestamp: alertData.resolution.timestamp
                ? alertData.resolution.timestamp.toDate()
                : new Date(),
            }
          : undefined,
        createdAt: alertData.createdAt
          ? alertData.createdAt.toDate()
          : new Date(),
        updatedAt: alertData.updatedAt
          ? alertData.updatedAt.toDate()
          : new Date(),
      } as Alert;
    } catch (error) {
      console.error("Error getting alert:", error);
      throw error;
    }
  },

  // Get alert by alert ID
  async getAlertByAlertId(alertId: string): Promise<Alert | null> {
    try {
      const alertQuery = query(
        collection(db, "alerts"),
        where("alertId", "==", alertId),
        limit(1)
      );

      const snapshot = await getDocs(alertQuery);

      if (snapshot.empty) {
        return null;
      }

      const alertDoc = snapshot.docs[0];
      const alertData = alertDoc.data();

      return {
        id: alertDoc.id,
        ...alertData,
        acknowledgedAt: alertData.acknowledgedAt
          ? alertData.acknowledgedAt.toDate()
          : undefined,
        actions:
          alertData.actions?.map((action: any) => ({
            ...action,
            dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
            completedAt: action.completedAt
              ? action.completedAt.toDate()
              : undefined,
          })) || [],
        resolution: alertData.resolution
          ? {
              ...alertData.resolution,
              followUpDate: alertData.resolution.followUpDate
                ? alertData.resolution.followUpDate.toDate()
                : undefined,
              timestamp: alertData.resolution.timestamp
                ? alertData.resolution.timestamp.toDate()
                : new Date(),
            }
          : undefined,
        createdAt: alertData.createdAt
          ? alertData.createdAt.toDate()
          : new Date(),
        updatedAt: alertData.updatedAt
          ? alertData.updatedAt.toDate()
          : new Date(),
      } as Alert;
    } catch (error) {
      console.error("Error getting alert by alert ID:", error);
      throw error;
    }
  },

  // Update alert
  async updateAlert(id: string, updates: UpdateAlertData): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "alerts", id), updateData);
    } catch (error) {
      console.error("Error updating alert:", error);
      throw error;
    }
  },

  // Acknowledge alert
  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, "alerts", id), {
        status: "acknowledged",
        acknowledgedBy,
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      throw error;
    }
  },

  // Assign alert to user
  async assignAlert(id: string, assignedTo: string): Promise<void> {
    try {
      await updateDoc(doc(db, "alerts", id), {
        assignedTo,
        status: "in_progress",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error assigning alert:", error);
      throw error;
    }
  },

  // Update alert status
  async updateStatus(id: string, status: Alert["status"]): Promise<void> {
    try {
      await updateDoc(doc(db, "alerts", id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating alert status:", error);
      throw error;
    }
  },

  // Add action to alert
  async addAction(
    alertId: string,
    description: string,
    assignedTo?: string,
    dueDate?: Date
  ): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) {
        throw new Error("Alert not found");
      }

      const newAction: AlertAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        description,
        assignedTo,
        status: "pending",
        dueDate,
      };

      const updatedActions = [...alert.actions, newAction];

      await updateDoc(doc(db, "alerts", alertId), {
        actions: updatedActions,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding action to alert:", error);
      throw error;
    }
  },

  // Update action status
  async updateActionStatus(
    alertId: string,
    actionId: string,
    status: AlertAction["status"],
    notes?: string
  ): Promise<void> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) {
        throw new Error("Alert not found");
      }

      const updatedActions = alert.actions.map((action) => {
        if (action.id === actionId) {
          return {
            ...action,
            status,
            notes: notes || action.notes,
            completedAt:
              status === "completed" ? new Date() : action.completedAt,
          };
        }
        return action;
      });

      await updateDoc(doc(db, "alerts", alertId), {
        actions: updatedActions,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating action status:", error);
      throw error;
    }
  },

  // Resolve alert
  async resolveAlert(
    id: string,
    resolvedBy: string,
    resolution: string,
    actionsTaken: string[],
    rootCause?: string,
    preventiveMeasures?: string[],
    followUpRequired: boolean = false,
    followUpDate?: Date
  ): Promise<void> {
    try {
      const alert = await this.getAlert(id);
      if (!alert) {
        throw new Error("Alert not found");
      }

      const actualResolutionTime = Math.floor(
        (new Date().getTime() - alert.createdAt.getTime()) / 60000
      );

      const resolutionData: AlertResolution = {
        resolvedBy,
        resolution,
        actionsTaken,
        rootCause,
        preventiveMeasures: preventiveMeasures || [],
        followUpRequired,
        followUpDate,
        timestamp: new Date(),
      };

      await updateDoc(doc(db, "alerts", id), {
        status: "resolved",
        resolution: resolutionData,
        actualResolutionTime,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error resolving alert:", error);
      throw error;
    }
  },

  // Escalate alert
  async escalateAlert(
    id: string,
    escalatedTo: string,
    reason: string
  ): Promise<void> {
    try {
      const alert = await this.getAlert(id);
      if (!alert) {
        throw new Error("Alert not found");
      }

      const currentLevel = alert.escalationRules.currentEscalationLevel + 1;

      await updateDoc(doc(db, "alerts", id), {
        status: "escalated",
        priority: "urgent",
        assignedTo: escalatedTo,
        "escalationRules.currentEscalationLevel": currentLevel,
        updatedAt: serverTimestamp(),
      });

      // Add escalation action
      await this.addAction(
        id,
        `Alert escalated to level ${currentLevel}: ${reason}`,
        escalatedTo
      );
    } catch (error) {
      console.error("Error escalating alert:", error);
      throw error;
    }
  },

  // Close alert
  async closeAlert(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, "alerts", id), {
        status: "closed",
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error closing alert:", error);
      throw error;
    }
  },

  // Delete alert permanently
  async deleteAlert(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "alerts", id));
    } catch (error) {
      console.error("Error deleting alert:", error);
      throw error;
    }
  },

  // Get alerts with filters and pagination
  async getAlerts(
    filters: AlertFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ alerts: Alert[]; lastDoc?: DocumentSnapshot }> {
    try {
      let alertQuery = query(collection(db, "alerts"));

      // Apply filters
      if (filters.machineId) {
        alertQuery = query(
          alertQuery,
          where("machineId", "==", filters.machineId)
        );
      }
      if (filters.userId) {
        alertQuery = query(alertQuery, where("userId", "==", filters.userId));
      }
      if (filters.severity) {
        alertQuery = query(
          alertQuery,
          where("severity", "==", filters.severity)
        );
      }
      if (filters.category) {
        alertQuery = query(
          alertQuery,
          where("category", "==", filters.category)
        );
      }
      if (filters.status) {
        alertQuery = query(alertQuery, where("status", "==", filters.status));
      }
      if (filters.priority) {
        alertQuery = query(
          alertQuery,
          where("priority", "==", filters.priority)
        );
      }
      if (filters.assignedTo) {
        alertQuery = query(
          alertQuery,
          where("assignedTo", "==", filters.assignedTo)
        );
      }
      if (filters.location?.site) {
        alertQuery = query(
          alertQuery,
          where("location.site", "==", filters.location.site)
        );
      }
      if (filters.isActive !== undefined) {
        alertQuery = query(
          alertQuery,
          where("isActive", "==", filters.isActive)
        );
      }
      if (filters.dateRange) {
        alertQuery = query(
          alertQuery,
          where("createdAt", ">=", filters.dateRange.start),
          where("createdAt", "<=", filters.dateRange.end)
        );
      }

      // Add ordering
      alertQuery = query(alertQuery, orderBy("createdAt", "desc"));

      // Add pagination
      if (pagination.lastDoc) {
        alertQuery = query(alertQuery, startAfter(pagination.lastDoc));
      }
      if (pagination.limitCount) {
        alertQuery = query(alertQuery, limit(pagination.limitCount));
      }

      const snapshot = await getDocs(alertQuery);

      const alerts = snapshot.docs.map((doc) => {
        const alertData = doc.data();
        return {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return { alerts, lastDoc };
    } catch (error) {
      console.error("Error getting alerts:", error);
      throw error;
    }
  },

  // Get active alerts
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const alertQuery = query(
        collection(db, "alerts"),
        where("isActive", "==", true),
        where("status", "in", [
          "active",
          "acknowledged",
          "in_progress",
          "escalated",
        ]),
        orderBy("severity", "desc"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(alertQuery);

      return snapshot.docs.map((doc) => {
        const alertData = doc.data();
        return {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
      });
    } catch (error) {
      console.error("Error getting active alerts:", error);
      throw error;
    }
  },

  // Get critical alerts
  async getCriticalAlerts(): Promise<Alert[]> {
    try {
      const alertQuery = query(
        collection(db, "alerts"),
        where("severity", "==", "critical"),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(alertQuery);

      return snapshot.docs.map((doc) => {
        const alertData = doc.data();
        return {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
      });
    } catch (error) {
      console.error("Error getting critical alerts:", error);
      throw error;
    }
  },

  // Get alerts by machine
  async getMachineAlerts(
    machineId: string,
    includeResolved: boolean = false
  ): Promise<Alert[]> {
    try {
      let alertQuery = query(
        collection(db, "alerts"),
        where("machineId", "==", machineId)
      );

      if (!includeResolved) {
        alertQuery = query(alertQuery, where("isActive", "==", true));
      }

      alertQuery = query(alertQuery, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(alertQuery);

      return snapshot.docs.map((doc) => {
        const alertData = doc.data();
        return {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
      });
    } catch (error) {
      console.error("Error getting machine alerts:", error);
      throw error;
    }
  },

  // Get assigned alerts for user
  async getAssignedAlerts(userId: string): Promise<Alert[]> {
    try {
      const alertQuery = query(
        collection(db, "alerts"),
        where("assignedTo", "==", userId),
        where("isActive", "==", true),
        orderBy("priority", "desc"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(alertQuery);

      return snapshot.docs.map((doc) => {
        const alertData = doc.data();
        return {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
      });
    } catch (error) {
      console.error("Error getting assigned alerts:", error);
      throw error;
    }
  },

  // Real-time alert subscription
  subscribeToAlert(
    id: string,
    callback: (alert: Alert | null) => void
  ): () => void {
    return onSnapshot(doc(db, "alerts", id), (doc) => {
      if (doc.exists()) {
        const alertData = doc.data();
        const alert: Alert = {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
        callback(alert);
      } else {
        callback(null);
      }
    });
  },

  // Real-time alerts subscription with filters
  subscribeToAlerts(
    filters: AlertFilters = {},
    callback: (alerts: Alert[]) => void
  ): () => void {
    let alertQuery = query(collection(db, "alerts"));

    // Apply filters
    if (filters.machineId) {
      alertQuery = query(
        alertQuery,
        where("machineId", "==", filters.machineId)
      );
    }
    if (filters.severity) {
      alertQuery = query(alertQuery, where("severity", "==", filters.severity));
    }
    if (filters.status) {
      alertQuery = query(alertQuery, where("status", "==", filters.status));
    }
    if (filters.assignedTo) {
      alertQuery = query(
        alertQuery,
        where("assignedTo", "==", filters.assignedTo)
      );
    }
    if (filters.isActive !== undefined) {
      alertQuery = query(alertQuery, where("isActive", "==", filters.isActive));
    }

    // Add ordering
    alertQuery = query(alertQuery, orderBy("createdAt", "desc"));

    return onSnapshot(alertQuery, (snapshot) => {
      const alerts = snapshot.docs.map((doc) => {
        const alertData = doc.data();
        return {
          id: doc.id,
          ...alertData,
          acknowledgedAt: alertData.acknowledgedAt
            ? alertData.acknowledgedAt.toDate()
            : undefined,
          actions:
            alertData.actions?.map((action: any) => ({
              ...action,
              dueDate: action.dueDate ? action.dueDate.toDate() : undefined,
              completedAt: action.completedAt
                ? action.completedAt.toDate()
                : undefined,
            })) || [],
          resolution: alertData.resolution
            ? {
                ...alertData.resolution,
                followUpDate: alertData.resolution.followUpDate
                  ? alertData.resolution.followUpDate.toDate()
                  : undefined,
                timestamp: alertData.resolution.timestamp
                  ? alertData.resolution.timestamp.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: alertData.createdAt
            ? alertData.createdAt.toDate()
            : new Date(),
          updatedAt: alertData.updatedAt
            ? alertData.updatedAt.toDate()
            : new Date(),
        } as Alert;
      });
      callback(alerts);
    });
  },

  // Get alert statistics
  async getAlertStats(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<AlertStats> {
    try {
      let alertQuery = query(collection(db, "alerts"));

      if (dateRange) {
        alertQuery = query(
          alertQuery,
          where("createdAt", ">=", dateRange.start),
          where("createdAt", "<=", dateRange.end)
        );
      }

      const snapshot = await getDocs(alertQuery);
      const alerts = snapshot.docs.map((doc) => doc.data());

      const now = new Date();
      const stats: AlertStats = {
        total: alerts.length,
        active: alerts.filter((a) => a.isActive).length,
        critical: alerts.filter((a) => a.severity === "critical" && a.isActive)
          .length,
        avgResolutionTime: 0,
        bySeverity: {},
        byCategory: {},
        byStatus: {},
        escalated: alerts.filter((a) => a.status === "escalated").length,
        overdue: 0,
      };

      // Calculate average resolution time
      const resolvedAlerts = alerts.filter((a) => a.actualResolutionTime);
      if (resolvedAlerts.length > 0) {
        const totalTime = resolvedAlerts.reduce(
          (sum, a) => sum + (a.actualResolutionTime || 0),
          0
        );
        stats.avgResolutionTime = totalTime / resolvedAlerts.length;
      }

      // Count overdue alerts
      stats.overdue = alerts.filter((alert) => {
        if (!alert.isActive || !alert.estimatedResolutionTime) return false;
        const createdAt = alert.createdAt
          ? alert.createdAt.toDate()
          : new Date();
        const expectedResolution = new Date(
          createdAt.getTime() + alert.estimatedResolutionTime * 60000
        );
        return now > expectedResolution;
      }).length;

      // Count by severity, category, status
      alerts.forEach((alert) => {
        stats.bySeverity[alert.severity] =
          (stats.bySeverity[alert.severity] || 0) + 1;
        stats.byCategory[alert.category] =
          (stats.byCategory[alert.category] || 0) + 1;
        stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Error getting alert statistics:", error);
      throw error;
    }
  },
};
