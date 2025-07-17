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

export interface MaintenancePart {
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  warrantyPeriod?: number; // in months
}

export interface MaintenanceLabor {
  technician: string;
  hoursWorked: number;
  hourlyRate: number;
  description: string;
  startTime?: Date;
  endTime?: Date;
}

export interface MaintenanceChecklist {
  id: string;
  description: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  photos?: string[]; // URLs to photos
}

export interface MaintenanceTask {
  id?: string;
  taskId: string; // Unique task identifier
  machineId: string;
  title: string;
  description: string;
  type: "preventive" | "corrective" | "predictive" | "emergency" | "inspection";
  priority: "low" | "medium" | "high" | "urgent";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "on_hold";
  category:
    | "mechanical"
    | "electrical"
    | "hydraulic"
    | "lubrication"
    | "cleaning"
    | "inspection"
    | "replacement"
    | "repair";
  estimatedDuration: number; // in hours
  actualDuration?: number; // in hours
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo: string[]; // Array of user IDs
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  checklist: MaintenanceChecklist[];
  parts: MaintenancePart[];
  labor: MaintenanceLabor[];
  totalCost?: number;
  notes?: string;
  photos?: string[]; // URLs to photos
  documents?: string[]; // URLs to documents
  parentTaskId?: string; // For sub-tasks
  relatedTasks: string[]; // IDs of related tasks
  alertId?: string; // If created from an alert
  nextMaintenanceDate?: Date;
  operatingHoursAtMaintenance?: number;
  conditions: {
    weatherConditions?: string;
    operatingConditions?: string;
    specialRequirements?: string[];
  };
  feedback?: {
    rating: number; // 1-5
    comment: string;
    submittedBy: string;
    submittedAt: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceTaskData {
  machineId: string;
  title: string;
  description: string;
  type: MaintenanceTask["type"];
  priority?: MaintenanceTask["priority"];
  category: MaintenanceTask["category"];
  estimatedDuration: number;
  scheduledDate: Date;
  assignedTo: string[];
  createdBy: string;
  checklist?: Omit<
    MaintenanceChecklist,
    "id" | "isCompleted" | "completedBy" | "completedAt"
  >[];
  parts?: MaintenancePart[];
  notes?: string;
  parentTaskId?: string;
  alertId?: string;
  conditions?: MaintenanceTask["conditions"];
}

export interface UpdateMaintenanceTaskData {
  title?: string;
  description?: string;
  priority?: MaintenanceTask["priority"];
  status?: MaintenanceTask["status"];
  estimatedDuration?: number;
  scheduledDate?: Date;
  assignedTo?: string[];
  notes?: string;
  conditions?: MaintenanceTask["conditions"];
}

export interface MaintenanceFilters {
  machineId?: string;
  type?: string;
  priority?: string;
  status?: string;
  category?: string;
  assignedTo?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  scheduledDateRange?: {
    start: Date;
    end: Date;
  };
  isActive?: boolean;
  isOverdue?: boolean;
}

export interface PaginationOptions {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

export interface MaintenanceStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  avgCompletionTime: number;
  totalCost: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  upcomingTasks: number;
  completionRate: number;
}

// ============================================
// MAINTENANCE SERVICE
// ============================================

export const maintenanceService = {
  // Create new maintenance task
  async createMaintenanceTask(
    taskData: CreateMaintenanceTaskData
  ): Promise<MaintenanceTask> {
    try {
      const taskId = `MAINT-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;

      const checklist =
        taskData.checklist?.map((item, index) => ({
          id: `check_${index + 1}`,
          ...item,
          isCompleted: false,
        })) || [];

      const newTask = {
        taskId,
        machineId: taskData.machineId,
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        priority: taskData.priority || "medium",
        status: "scheduled" as const,
        category: taskData.category,
        estimatedDuration: taskData.estimatedDuration,
        scheduledDate: taskData.scheduledDate,
        assignedTo: taskData.assignedTo,
        createdBy: taskData.createdBy,
        checklist,
        parts: taskData.parts || [],
        labor: [],
        notes: taskData.notes || "",
        photos: [],
        documents: [],
        parentTaskId: taskData.parentTaskId || null,
        relatedTasks: [],
        alertId: taskData.alertId || null,
        conditions: taskData.conditions || {},
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "maintenanceTasks"), newTask);

      return {
        id: docRef.id,
        ...newTask,
        scheduledDate: taskData.scheduledDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as MaintenanceTask;
    } catch (error) {
      console.error("Error creating maintenance task:", error);
      throw error;
    }
  },

  // Get maintenance task by ID
  async getMaintenanceTask(id: string): Promise<MaintenanceTask | null> {
    try {
      const taskDoc = await getDoc(doc(db, "maintenanceTasks", id));

      if (!taskDoc.exists()) {
        return null;
      }

      const taskData = taskDoc.data();
      return {
        id: taskDoc.id,
        ...taskData,
        scheduledDate: taskData.scheduledDate
          ? taskData.scheduledDate.toDate()
          : new Date(),
        completedDate: taskData.completedDate
          ? taskData.completedDate.toDate()
          : undefined,
        approvedAt: taskData.approvedAt
          ? taskData.approvedAt.toDate()
          : undefined,
        nextMaintenanceDate: taskData.nextMaintenanceDate
          ? taskData.nextMaintenanceDate.toDate()
          : undefined,
        checklist:
          taskData.checklist?.map((item: any) => ({
            ...item,
            completedAt: item.completedAt
              ? item.completedAt.toDate()
              : undefined,
          })) || [],
        labor:
          taskData.labor?.map((item: any) => ({
            ...item,
            startTime: item.startTime ? item.startTime.toDate() : undefined,
            endTime: item.endTime ? item.endTime.toDate() : undefined,
          })) || [],
        feedback: taskData.feedback
          ? {
              ...taskData.feedback,
              submittedAt: taskData.feedback.submittedAt
                ? taskData.feedback.submittedAt.toDate()
                : new Date(),
            }
          : undefined,
        createdAt: taskData.createdAt
          ? taskData.createdAt.toDate()
          : new Date(),
        updatedAt: taskData.updatedAt
          ? taskData.updatedAt.toDate()
          : new Date(),
      } as MaintenanceTask;
    } catch (error) {
      console.error("Error getting maintenance task:", error);
      throw error;
    }
  },

  // Get maintenance task by task ID
  async getMaintenanceTaskByTaskId(
    taskId: string
  ): Promise<MaintenanceTask | null> {
    try {
      const taskQuery = query(
        collection(db, "maintenanceTasks"),
        where("taskId", "==", taskId),
        limit(1)
      );

      const snapshot = await getDocs(taskQuery);

      if (snapshot.empty) {
        return null;
      }

      const taskDoc = snapshot.docs[0];
      return this.getMaintenanceTask(taskDoc.id);
    } catch (error) {
      console.error("Error getting maintenance task by task ID:", error);
      throw error;
    }
  },

  // Update maintenance task
  async updateMaintenanceTask(
    id: string,
    updates: UpdateMaintenanceTaskData
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "maintenanceTasks", id), updateData);
    } catch (error) {
      console.error("Error updating maintenance task:", error);
      throw error;
    }
  },

  // Start maintenance task
  async startMaintenanceTask(id: string, startedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, "maintenanceTasks", id), {
        status: "in_progress",
        startedBy,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error starting maintenance task:", error);
      throw error;
    }
  },

  // Complete maintenance task
  async completeMaintenanceTask(
    id: string,
    completedBy: string,
    actualDuration: number,
    nextMaintenanceDate?: Date,
    operatingHours?: number,
    completionNotes?: string
  ): Promise<void> {
    try {
      const task = await this.getMaintenanceTask(id);
      if (!task) {
        throw new Error("Task not found");
      }

      // Calculate total cost
      const partsCost = task.parts.reduce(
        (sum, part) => sum + part.quantity * part.unitCost,
        0
      );
      const laborCost = task.labor.reduce(
        (sum, labor) => sum + labor.hoursWorked * labor.hourlyRate,
        0
      );
      const totalCost = partsCost + laborCost;

      const updateData: any = {
        status: "completed",
        completedDate: serverTimestamp(),
        completedBy,
        actualDuration,
        totalCost,
        updatedAt: serverTimestamp(),
      };

      if (nextMaintenanceDate) {
        updateData.nextMaintenanceDate = nextMaintenanceDate;
      }

      if (operatingHours) {
        updateData.operatingHoursAtMaintenance = operatingHours;
      }

      if (completionNotes) {
        updateData.notes = task.notes
          ? `${task.notes}\n\nCompletion Notes: ${completionNotes}`
          : completionNotes;
      }

      await updateDoc(doc(db, "maintenanceTasks", id), updateData);
    } catch (error) {
      console.error("Error completing maintenance task:", error);
      throw error;
    }
  },

  // Approve maintenance task
  async approveMaintenanceTask(id: string, approvedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, "maintenanceTasks", id), {
        approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error approving maintenance task:", error);
      throw error;
    }
  },

  // Cancel maintenance task
  async cancelMaintenanceTask(
    id: string,
    cancelledBy: string,
    reason: string
  ): Promise<void> {
    try {
      const task = await this.getMaintenanceTask(id);
      if (!task) {
        throw new Error("Task not found");
      }

      await updateDoc(doc(db, "maintenanceTasks", id), {
        status: "cancelled",
        cancelledBy,
        cancelledAt: serverTimestamp(),
        notes: task.notes
          ? `${task.notes}\n\nCancelled: ${reason}`
          : `Cancelled: ${reason}`,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error cancelling maintenance task:", error);
      throw error;
    }
  },

  // Update checklist item
  async updateChecklistItem(
    taskId: string,
    checklistItemId: string,
    isCompleted: boolean,
    completedBy?: string,
    notes?: string,
    photos?: string[]
  ): Promise<void> {
    try {
      const task = await this.getMaintenanceTask(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      const updatedChecklist = task.checklist.map((item) => {
        if (item.id === checklistItemId) {
          return {
            ...item,
            isCompleted,
            completedBy: isCompleted ? completedBy : undefined,
            completedAt: isCompleted ? new Date() : undefined,
            notes: notes || item.notes,
            photos: photos || item.photos,
          };
        }
        return item;
      });

      await updateDoc(doc(db, "maintenanceTasks", taskId), {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating checklist item:", error);
      throw error;
    }
  },

  // Add part to maintenance task
  async addPart(taskId: string, part: MaintenancePart): Promise<void> {
    try {
      const task = await this.getMaintenanceTask(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      const updatedParts = [...task.parts, part];

      await updateDoc(doc(db, "maintenanceTasks", taskId), {
        parts: updatedParts,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding part to maintenance task:", error);
      throw error;
    }
  },

  // Add labor to maintenance task
  async addLabor(taskId: string, labor: MaintenanceLabor): Promise<void> {
    try {
      const task = await this.getMaintenanceTask(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      const updatedLabor = [...task.labor, labor];

      await updateDoc(doc(db, "maintenanceTasks", taskId), {
        labor: updatedLabor,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding labor to maintenance task:", error);
      throw error;
    }
  },

  // Add feedback to maintenance task
  async addFeedback(
    taskId: string,
    rating: number,
    comment: string,
    submittedBy: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "maintenanceTasks", taskId), {
        feedback: {
          rating: Math.max(1, Math.min(5, rating)), // Ensure 1-5 range
          comment,
          submittedBy,
          submittedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding feedback:", error);
      throw error;
    }
  },

  // Reschedule maintenance task
  async rescheduleTask(
    id: string,
    newDate: Date,
    reason: string
  ): Promise<void> {
    try {
      const task = await this.getMaintenanceTask(id);
      if (!task) {
        throw new Error("Task not found");
      }

      await updateDoc(doc(db, "maintenanceTasks", id), {
        scheduledDate: newDate,
        notes: task.notes
          ? `${task.notes}\n\nRescheduled: ${reason}`
          : `Rescheduled: ${reason}`,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error rescheduling maintenance task:", error);
      throw error;
    }
  },

  // Delete maintenance task
  async deleteMaintenanceTask(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "maintenanceTasks", id));
    } catch (error) {
      console.error("Error deleting maintenance task:", error);
      throw error;
    }
  },

  // Get maintenance tasks with filters and pagination
  async getMaintenanceTasks(
    filters: MaintenanceFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ tasks: MaintenanceTask[]; lastDoc?: DocumentSnapshot }> {
    try {
      let taskQuery = query(collection(db, "maintenanceTasks"));

      // Apply filters
      if (filters.machineId) {
        taskQuery = query(
          taskQuery,
          where("machineId", "==", filters.machineId)
        );
      }
      if (filters.type) {
        taskQuery = query(taskQuery, where("type", "==", filters.type));
      }
      if (filters.priority) {
        taskQuery = query(taskQuery, where("priority", "==", filters.priority));
      }
      if (filters.status) {
        taskQuery = query(taskQuery, where("status", "==", filters.status));
      }
      if (filters.category) {
        taskQuery = query(taskQuery, where("category", "==", filters.category));
      }
      if (filters.assignedTo) {
        taskQuery = query(
          taskQuery,
          where("assignedTo", "array-contains", filters.assignedTo)
        );
      }
      if (filters.createdBy) {
        taskQuery = query(
          taskQuery,
          where("createdBy", "==", filters.createdBy)
        );
      }
      if (filters.isActive !== undefined) {
        taskQuery = query(taskQuery, where("isActive", "==", filters.isActive));
      }
      if (filters.dateRange) {
        taskQuery = query(
          taskQuery,
          where("createdAt", ">=", filters.dateRange.start),
          where("createdAt", "<=", filters.dateRange.end)
        );
      }
      if (filters.scheduledDateRange) {
        taskQuery = query(
          taskQuery,
          where("scheduledDate", ">=", filters.scheduledDateRange.start),
          where("scheduledDate", "<=", filters.scheduledDateRange.end)
        );
      }

      // Add ordering
      taskQuery = query(taskQuery, orderBy("scheduledDate", "asc"));

      // Add pagination
      if (pagination.lastDoc) {
        taskQuery = query(taskQuery, startAfter(pagination.lastDoc));
      }
      if (pagination.limitCount) {
        taskQuery = query(taskQuery, limit(pagination.limitCount));
      }

      const snapshot = await getDocs(taskQuery);

      let tasks = snapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
      });

      // Apply overdue filter if specified
      if (filters.isOverdue) {
        const now = new Date();
        tasks = tasks.filter(
          (task) =>
            task.status !== "completed" &&
            task.status !== "cancelled" &&
            task.scheduledDate < now
        );
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return { tasks, lastDoc };
    } catch (error) {
      console.error("Error getting maintenance tasks:", error);
      throw error;
    }
  },

  // Get maintenance tasks by machine
  async getMachineMaintenanceTasks(
    machineId: string,
    includeCompleted: boolean = false
  ): Promise<MaintenanceTask[]> {
    try {
      let taskQuery = query(
        collection(db, "maintenanceTasks"),
        where("machineId", "==", machineId)
      );

      if (!includeCompleted) {
        taskQuery = query(taskQuery, where("status", "!=", "completed"));
      }

      taskQuery = query(taskQuery, orderBy("scheduledDate", "asc"));

      const snapshot = await getDocs(taskQuery);

      return snapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
      });
    } catch (error) {
      console.error("Error getting machine maintenance tasks:", error);
      throw error;
    }
  },

  // Get assigned maintenance tasks for user
  async getAssignedMaintenanceTasks(
    userId: string
  ): Promise<MaintenanceTask[]> {
    try {
      const taskQuery = query(
        collection(db, "maintenanceTasks"),
        where("assignedTo", "array-contains", userId),
        where("status", "in", ["scheduled", "in_progress"]),
        orderBy("priority", "desc"),
        orderBy("scheduledDate", "asc")
      );

      const snapshot = await getDocs(taskQuery);

      return snapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
      });
    } catch (error) {
      console.error("Error getting assigned maintenance tasks:", error);
      throw error;
    }
  },

  // Get overdue maintenance tasks
  async getOverdueMaintenanceTasks(): Promise<MaintenanceTask[]> {
    try {
      const now = new Date();
      const taskQuery = query(
        collection(db, "maintenanceTasks"),
        where("scheduledDate", "<", now),
        where("status", "in", ["scheduled", "in_progress"]),
        orderBy("scheduledDate", "asc")
      );

      const snapshot = await getDocs(taskQuery);

      return snapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
      });
    } catch (error) {
      console.error("Error getting overdue maintenance tasks:", error);
      throw error;
    }
  },

  // Get upcoming maintenance tasks
  async getUpcomingMaintenanceTasks(
    days: number = 7
  ): Promise<MaintenanceTask[]> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const taskQuery = query(
        collection(db, "maintenanceTasks"),
        where("scheduledDate", ">=", now),
        where("scheduledDate", "<=", futureDate),
        where("status", "in", ["scheduled"]),
        orderBy("scheduledDate", "asc")
      );

      const snapshot = await getDocs(taskQuery);

      return snapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
      });
    } catch (error) {
      console.error("Error getting upcoming maintenance tasks:", error);
      throw error;
    }
  },

  // Real-time maintenance task subscription
  subscribeToMaintenanceTask(
    id: string,
    callback: (task: MaintenanceTask | null) => void
  ): () => void {
    return onSnapshot(doc(db, "maintenanceTasks", id), (doc) => {
      if (doc.exists()) {
        const taskData = doc.data();
        const task: MaintenanceTask = {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
        callback(task);
      } else {
        callback(null);
      }
    });
  },

  // Real-time maintenance tasks subscription with filters
  subscribeToMaintenanceTasks(
    filters: MaintenanceFilters = {},
    callback: (tasks: MaintenanceTask[]) => void
  ): () => void {
    let taskQuery = query(collection(db, "maintenanceTasks"));

    // Apply filters
    if (filters.machineId) {
      taskQuery = query(taskQuery, where("machineId", "==", filters.machineId));
    }
    if (filters.status) {
      taskQuery = query(taskQuery, where("status", "==", filters.status));
    }
    if (filters.assignedTo) {
      taskQuery = query(
        taskQuery,
        where("assignedTo", "array-contains", filters.assignedTo)
      );
    }
    if (filters.isActive !== undefined) {
      taskQuery = query(taskQuery, where("isActive", "==", filters.isActive));
    }

    // Add ordering
    taskQuery = query(taskQuery, orderBy("scheduledDate", "asc"));

    return onSnapshot(taskQuery, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          id: doc.id,
          ...taskData,
          scheduledDate: taskData.scheduledDate
            ? taskData.scheduledDate.toDate()
            : new Date(),
          completedDate: taskData.completedDate
            ? taskData.completedDate.toDate()
            : undefined,
          approvedAt: taskData.approvedAt
            ? taskData.approvedAt.toDate()
            : undefined,
          nextMaintenanceDate: taskData.nextMaintenanceDate
            ? taskData.nextMaintenanceDate.toDate()
            : undefined,
          checklist:
            taskData.checklist?.map((item: any) => ({
              ...item,
              completedAt: item.completedAt
                ? item.completedAt.toDate()
                : undefined,
            })) || [],
          labor:
            taskData.labor?.map((item: any) => ({
              ...item,
              startTime: item.startTime ? item.startTime.toDate() : undefined,
              endTime: item.endTime ? item.endTime.toDate() : undefined,
            })) || [],
          feedback: taskData.feedback
            ? {
                ...taskData.feedback,
                submittedAt: taskData.feedback.submittedAt
                  ? taskData.feedback.submittedAt.toDate()
                  : new Date(),
              }
            : undefined,
          createdAt: taskData.createdAt
            ? taskData.createdAt.toDate()
            : new Date(),
          updatedAt: taskData.updatedAt
            ? taskData.updatedAt.toDate()
            : new Date(),
        } as MaintenanceTask;
      });
      callback(tasks);
    });
  },

  // Get maintenance statistics
  async getMaintenanceStats(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<MaintenanceStats> {
    try {
      let taskQuery = query(collection(db, "maintenanceTasks"));

      if (dateRange) {
        taskQuery = query(
          taskQuery,
          where("createdAt", ">=", dateRange.start),
          where("createdAt", "<=", dateRange.end)
        );
      }

      const snapshot = await getDocs(taskQuery);
      const tasks = snapshot.docs.map((doc) => doc.data());

      const now = new Date();
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const stats: MaintenanceStats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "completed").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        overdue: tasks.filter(
          (t) =>
            t.status !== "completed" &&
            t.status !== "cancelled" &&
            t.scheduledDate &&
            t.scheduledDate.toDate() < now
        ).length,
        avgCompletionTime: 0,
        totalCost: 0,
        byType: {},
        byPriority: {},
        byStatus: {},
        upcomingTasks: tasks.filter(
          (t) =>
            t.status === "scheduled" &&
            t.scheduledDate &&
            t.scheduledDate.toDate() >= now &&
            t.scheduledDate.toDate() <= next7Days
        ).length,
        completionRate: 0,
      };

      // Calculate average completion time
      const completedTasks = tasks.filter(
        (t) => t.status === "completed" && t.actualDuration
      );
      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce(
          (sum, t) => sum + (t.actualDuration || 0),
          0
        );
        stats.avgCompletionTime = totalTime / completedTasks.length;
      }

      // Calculate total cost
      stats.totalCost = tasks.reduce((sum, t) => sum + (t.totalCost || 0), 0);

      // Calculate completion rate
      const relevantTasks = tasks.filter((t) => t.status !== "cancelled");
      if (relevantTasks.length > 0) {
        stats.completionRate = (stats.completed / relevantTasks.length) * 100;
      }

      // Count by type, priority, status
      tasks.forEach((task) => {
        stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;
        stats.byPriority[task.priority] =
          (stats.byPriority[task.priority] || 0) + 1;
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Error getting maintenance statistics:", error);
      throw error;
    }
  },
};
