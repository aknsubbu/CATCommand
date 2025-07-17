import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

// ===== INTERFACES =====

export interface Operator {
  id: string;
  name: string;
  employeeId: string;
  certifications: string[];
  trainingLevel: string;
  phoneNumber: string;
  email: string;
  shift: string;
  status: "active" | "inactive" | "on_break";
  currentMachineId?: string;
  lastLogin: Date;
  totalHours: number;
  safetyScore: number;
  efficiencyRating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Machine {
  id: string;
  model: string;
  serialNumber: string;
  type: "excavator" | "dozer" | "loader" | "other";
  currentOperatorId?: string;
  status: "active" | "maintenance" | "idle" | "offline";
  location: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  engineHours: number;
  fuelLevel: number;
  lastMaintenance: Date;
  nextMaintenanceDue: Date;
  specifications: {
    maxLoad: number;
    fuelCapacity: number;
    operatingWeight: number;
  };
  sensors: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedOperatorId: string;
  assignedMachineId: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  location: {
    lat: number;
    lng: number;
    address: string;
    geofenceRadius: number; // in meters
  };
  checkpoints: Checkpoint[];
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Checkpoint {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  completed: boolean;
  completedAt?: Date;
  gpsTagged: boolean;
}

export interface ScheduledTask {
  id: string;
  operatorId: string;
  machineId: string;
  workOrderId?: string;
  title: string;
  description: string;
  type: "operation" | "maintenance" | "inspection" | "training";
  priority: "low" | "medium" | "high" | "critical";
  status: "scheduled" | "in_progress" | "completed" | "overdue" | "cancelled";
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  scheduledDate: Date;
  startTime?: Date;
  endTime?: Date;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  requirements: {
    seatbeltCheck: boolean;
    preInspection: boolean;
    specialCertification?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Inspection {
  id: string;
  machineId: string;
  operatorId: string;
  type: "daily" | "shift_change" | "maintenance" | "safety";
  status: "pending" | "in_progress" | "completed" | "failed";
  checklist: Record<string, InspectionItem>;
  overallResult: "pass" | "fail" | "conditional";
  startTime: Date;
  endTime?: Date;
  notes: string;
  photos: string[]; // URLs to images
  signature?: string; // base64 or URL
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionItem {
  name: string;
  category: "safety" | "mechanical" | "fluid" | "electrical";
  required: boolean;
  status: "pass" | "fail" | "na" | "pending";
  notes?: string;
  photo?: string; // URL to image
  timestamp?: Date;
}

export interface Alert {
  id: string;
  type:
    | "safety"
    | "maintenance"
    | "efficiency"
    | "location"
    | "fuel"
    | "system";
  severity: "info" | "warning" | "critical" | "emergency";
  title: string;
  message: string;
  machineId?: string;
  operatorId?: string;
  workOrderId?: string;
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  location?: {
    lat: number;
    lng: number;
  };
  triggerData: {
    metric: string;
    value: number;
    threshold: number;
    unit: string;
  };
  audioPlayed: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingData {
  id: string;
  operatorId: string;
  machineId: string;
  workOrderId?: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  status: "active" | "paused" | "completed";
  gpsTrack: GPSPoint[];
  metrics: SessionMetrics;
  safetyEvents: SafetyEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number;
  heading: number;
}

export interface SessionMetrics {
  idleTime: number; // in minutes
  activeTime: number; // in minutes
  fuelConsumed: number;
  loadCycles: number;
  avgSpeed: number;
  maxSpeed: number;
  distanceTraveled: number;
}

export interface SafetyEvent {
  type:
    | "seatbelt_unbuckled"
    | "speeding"
    | "harsh_braking"
    | "geofence_violation";
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
  severity: "low" | "medium" | "high";
  resolved: boolean;
}

export interface OfflineQueueItem {
  id: string;
  operatorId: string;
  type: "inspection" | "alert" | "tracking" | "metric" | "workorder_update";
  priority: "low" | "medium" | "high" | "critical";
  data: any; // The actual data to sync
  timestamp: Date;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "syncing" | "synced" | "failed";
  errorMessage?: string;
  dataSize: number; // in bytes
  compressed: boolean;
  createdAt: Date;
}

// ===== QUERY OPTIONS =====
export interface QueryOptions {
  filters?: {
    field: string;
    operator:
      | "=="
      | "!="
      | "<"
      | "<="
      | ">"
      | ">="
      | "in"
      | "not-in"
      | "array-contains";
    value: any;
  }[];
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limitCount?: number;
  startAfterDoc?: DocumentSnapshot;
}

// ===== UTILITY FUNCTIONS =====
const convertTimestamps = (data: any): any => {
  if (!data) return data;

  const converted = { ...data };

  // Convert known timestamp fields
  const timestampFields = [
    "createdAt",
    "updatedAt",
    "startTime",
    "endTime",
    "scheduledDate",
    "scheduledStart",
    "scheduledEnd",
    "actualStart",
    "actualEnd",
    "lastLogin",
    "lastMaintenance",
    "nextMaintenanceDue",
    "addedAt",
    "acknowledgedAt",
    "resolvedAt",
    "completedAt",
    "timestamp",
  ];

  timestampFields.forEach((field) => {
    if (converted[field] && converted[field].toDate) {
      converted[field] = converted[field].toDate();
    }
  });

  // Handle nested objects
  if (
    converted.location &&
    converted.location.timestamp &&
    converted.location.timestamp.toDate
  ) {
    converted.location.timestamp = converted.location.timestamp.toDate();
  }

  // Handle arrays
  if (converted.gpsTrack && Array.isArray(converted.gpsTrack)) {
    converted.gpsTrack = converted.gpsTrack.map((point: any) => ({
      ...point,
      timestamp:
        point.timestamp && point.timestamp.toDate
          ? point.timestamp.toDate()
          : point.timestamp,
    }));
  }

  if (converted.safetyEvents && Array.isArray(converted.safetyEvents)) {
    converted.safetyEvents = converted.safetyEvents.map((event: any) => ({
      ...event,
      timestamp:
        event.timestamp && event.timestamp.toDate
          ? event.timestamp.toDate()
          : event.timestamp,
    }));
  }

  if (converted.checkpoints && Array.isArray(converted.checkpoints)) {
    converted.checkpoints = converted.checkpoints.map((checkpoint: any) => ({
      ...checkpoint,
      completedAt:
        checkpoint.completedAt && checkpoint.completedAt.toDate
          ? checkpoint.completedAt.toDate()
          : checkpoint.completedAt,
    }));
  }

  // Handle checklist object
  if (converted.checklist && typeof converted.checklist === "object") {
    Object.keys(converted.checklist).forEach((key) => {
      if (
        converted.checklist[key].timestamp &&
        converted.checklist[key].timestamp.toDate
      ) {
        converted.checklist[key].timestamp =
          converted.checklist[key].timestamp.toDate();
      }
    });
  }

  return converted;
};

const buildQuery = (collectionName: string, options: QueryOptions = {}) => {
  const {
    filters = [],
    orderByField = "createdAt",
    orderDirection = "desc",
    limitCount,
    startAfterDoc,
  } = options;

  const constraints: QueryConstraint[] = [];

  // Apply filters
  filters.forEach((filter) => {
    constraints.push(where(filter.field, filter.operator, filter.value));
  });

  // Apply ordering
  constraints.push(orderBy(orderByField, orderDirection));

  // Apply limit
  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  // Apply pagination
  if (startAfterDoc) {
    constraints.push(startAfter(startAfterDoc));
  }

  return query(collection(db, collectionName), ...constraints);
};

// ===== OPERATOR SERVICE =====
export const operatorService = {
  async createOperator(
    operatorData: Omit<Operator, "id" | "createdAt" | "updatedAt">
  ): Promise<Operator> {
    try {
      const data = {
        ...operatorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "operators"), data);

      // Update with its own ID
      await updateDoc(docRef, { id: docRef.id });

      return {
        id: docRef.id,
        ...operatorData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating operator:", error);
      throw error;
    }
  },

  async getOperator(operatorId: string): Promise<Operator | null> {
    try {
      const docSnap = await getDoc(doc(db, "operators", operatorId));

      if (docSnap.exists()) {
        return convertTimestamps({
          id: docSnap.id,
          ...docSnap.data(),
        }) as Operator;
      }
      return null;
    } catch (error) {
      console.error("Error getting operator:", error);
      throw error;
    }
  },

  async getOperatorByEmployeeId(employeeId: string): Promise<Operator | null> {
    try {
      const q = query(
        collection(db, "operators"),
        where("employeeId", "==", employeeId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return convertTimestamps({ id: doc.id, ...doc.data() }) as Operator;
      }
      return null;
    } catch (error) {
      console.error("Error getting operator by employee ID:", error);
      throw error;
    }
  },

  async updateOperator(
    operatorId: string,
    data: Partial<Operator>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "operators", operatorId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating operator:", error);
      throw error;
    }
  },

  async updateOperatorStatus(
    operatorId: string,
    status: Operator["status"]
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "operators", operatorId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating operator status:", error);
      throw error;
    }
  },

  async assignMachineToOperator(
    operatorId: string,
    machineId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update operator
      batch.update(doc(db, "operators", operatorId), {
        currentMachineId: machineId,
        updatedAt: serverTimestamp(),
      });

      // Update machine
      batch.update(doc(db, "machines", machineId), {
        currentOperatorId: operatorId,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error("Error assigning machine to operator:", error);
      throw error;
    }
  },

  subscribeToOperator(
    operatorId: string,
    callback: (operator: Operator | null) => void
  ): () => void {
    return onSnapshot(doc(db, "operators", operatorId), (doc) => {
      if (doc.exists()) {
        callback(convertTimestamps({ id: doc.id, ...doc.data() }) as Operator);
      } else {
        callback(null);
      }
    });
  },
};

// ===== MACHINE SERVICE =====
export const machineService = {
  async createMachine(
    machineData: Omit<Machine, "id" | "createdAt" | "updatedAt">
  ): Promise<Machine> {
    try {
      const data = {
        ...machineData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "machines"), data);
      await updateDoc(docRef, { id: docRef.id });

      return {
        id: docRef.id,
        ...machineData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating machine:", error);
      throw error;
    }
  },

  async getMachine(machineId: string): Promise<Machine | null> {
    try {
      const docSnap = await getDoc(doc(db, "machines", machineId));

      if (docSnap.exists()) {
        return convertTimestamps({
          id: docSnap.id,
          ...docSnap.data(),
        }) as Machine;
      }
      return null;
    } catch (error) {
      console.error("Error getting machine:", error);
      throw error;
    }
  },

  async updateMachine(
    machineId: string,
    data: Partial<Machine>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating machine:", error);
      throw error;
    }
  },

  async updateMachineLocation(
    machineId: string,
    location: { lat: number; lng: number }
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        location: {
          ...location,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating machine location:", error);
      throw error;
    }
  },

  async getAvailableMachines(): Promise<Machine[]> {
    try {
      const q = query(
        collection(db, "machines"),
        where("status", "==", "active"),
        where("currentOperatorId", "==", null)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Machine
      );
    } catch (error) {
      console.error("Error getting available machines:", error);
      throw error;
    }
  },

  async getMachinesByStatus(status: Machine["status"]): Promise<Machine[]> {
    try {
      const q = query(
        collection(db, "machines"),
        where("status", "==", status)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Machine
      );
    } catch (error) {
      console.error("Error getting machines by status:", error);
      throw error;
    }
  },
};

// ===== WORK ORDER SERVICE =====
export const workOrderService = {
  async createWorkOrder(
    workOrderData: Omit<WorkOrder, "id" | "createdAt" | "updatedAt">
  ): Promise<WorkOrder> {
    try {
      const data = {
        ...workOrderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "workOrders"), data);
      await updateDoc(docRef, { id: docRef.id });

      return {
        id: docRef.id,
        ...workOrderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating work order:", error);
      throw error;
    }
  },

  async getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
    try {
      const docSnap = await getDoc(doc(db, "workOrders", workOrderId));

      if (docSnap.exists()) {
        return convertTimestamps({
          id: docSnap.id,
          ...docSnap.data(),
        }) as WorkOrder;
      }
      return null;
    } catch (error) {
      console.error("Error getting work order:", error);
      throw error;
    }
  },

  async getWorkOrdersByOperator(operatorId: string): Promise<WorkOrder[]> {
    try {
      const q = query(
        collection(db, "workOrders"),
        where("assignedOperatorId", "==", operatorId),
        orderBy("scheduledStart", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as WorkOrder
      );
    } catch (error) {
      console.error("Error getting work orders by operator:", error);
      throw error;
    }
  },

  async updateWorkOrderStatus(
    workOrderId: string,
    status: WorkOrder["status"]
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === "in_progress") {
        updateData.actualStart = serverTimestamp();
      } else if (status === "completed") {
        updateData.actualEnd = serverTimestamp();
      }

      await updateDoc(doc(db, "workOrders", workOrderId), updateData);
    } catch (error) {
      console.error("Error updating work order status:", error);
      throw error;
    }
  },

  async updateCheckpointStatus(
    workOrderId: string,
    checkpointId: string,
    completed: boolean,
    gpsTagged: boolean = false
  ): Promise<void> {
    try {
      const workOrder = await this.getWorkOrder(workOrderId);
      if (!workOrder) throw new Error("Work order not found");

      const updatedCheckpoints = workOrder.checkpoints.map((checkpoint) => {
        if (checkpoint.id === checkpointId) {
          return {
            ...checkpoint,
            completed,
            completedAt: completed ? new Date() : undefined,
            gpsTagged,
          };
        }
        return checkpoint;
      });

      await updateDoc(doc(db, "workOrders", workOrderId), {
        checkpoints: updatedCheckpoints,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating checkpoint status:", error);
      throw error;
    }
  },

  subscribeToWorkOrdersByOperator(
    operatorId: string,
    callback: (workOrders: WorkOrder[]) => void
  ): () => void {
    const q = query(
      collection(db, "workOrders"),
      where("assignedOperatorId", "==", operatorId),
      orderBy("scheduledStart", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const workOrders = snapshot.docs.map(
        (doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as WorkOrder
      );
      callback(workOrders);
    });
  },
};

// ===== SCHEDULED TASKS SERVICE =====
export const scheduledTaskService = {
  async createScheduledTask(
    taskData: Omit<ScheduledTask, "id" | "createdAt" | "updatedAt">
  ): Promise<ScheduledTask> {
    try {
      const data = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "scheduledTasks"), data);
      await updateDoc(docRef, { id: docRef.id });

      return {
        id: docRef.id,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating scheduled task:", error);
      throw error;
    }
  },

  async getTasksByOperator(
    operatorId: string,
    date?: Date
  ): Promise<ScheduledTask[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("operatorId", "==", operatorId),
      ];

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        constraints.push(
          where("scheduledDate", ">=", Timestamp.fromDate(startOfDay)),
          where("scheduledDate", "<=", Timestamp.fromDate(endOfDay))
        );
      }

      constraints.push(orderBy("scheduledDate", "asc"));

      const q = query(collection(db, "scheduledTasks"), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          convertTimestamps({ id: doc.id, ...doc.data() }) as ScheduledTask
      );
    } catch (error) {
      console.error("Error getting tasks by operator:", error);
      throw error;
    }
  },

  async updateTaskStatus(
    taskId: string,
    status: ScheduledTask["status"]
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === "in_progress") {
        updateData.startTime = serverTimestamp();
      } else if (status === "completed") {
        updateData.endTime = serverTimestamp();
      }

      await updateDoc(doc(db, "scheduledTasks", taskId), updateData);
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  },

  subscribeToTasksByOperator(
    operatorId: string,
    callback: (tasks: ScheduledTask[]) => void,
    date?: Date
  ): () => void {
    const constraints: QueryConstraint[] = [
      where("operatorId", "==", operatorId),
    ];

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      constraints.push(
        where("scheduledDate", ">=", Timestamp.fromDate(startOfDay)),
        where("scheduledDate", "<=", Timestamp.fromDate(endOfDay))
      );
    }

    constraints.push(orderBy("scheduledDate", "asc"));

    const q = query(collection(db, "scheduledTasks"), ...constraints);

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(
        (doc) =>
          convertTimestamps({ id: doc.id, ...doc.data() }) as ScheduledTask
      );
      callback(tasks);
    });
  },
};

// ===== ALERT SERVICE =====
export const alertService = {
  async createAlert(
    alertData: Omit<Alert, "id" | "createdAt" | "updatedAt">
  ): Promise<Alert> {
    try {
      const data = {
        ...alertData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "alerts"), data);
      await updateDoc(docRef, { id: docRef.id });

      return {
        id: docRef.id,
        ...alertData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  },

  async getActiveAlerts(operatorId?: string): Promise<Alert[]> {
    try {
      const constraints: QueryConstraint[] = [where("status", "==", "active")];

      if (operatorId) {
        constraints.push(where("operatorId", "==", operatorId));
      }

      constraints.push(orderBy("createdAt", "desc"));

      const q = query(collection(db, "alerts"), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Alert
      );
    } catch (error) {
      console.error("Error getting active alerts:", error);
      throw error;
    }
  },

  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
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

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
        status: "resolved",
        resolvedBy,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error resolving alert:", error);
      throw error;
    }
  },

  subscribeToActiveAlerts(
    callback: (alerts: Alert[]) => void,
    operatorId?: string
  ): () => void {
    const constraints: QueryConstraint[] = [where("status", "==", "active")];

    if (operatorId) {
      constraints.push(where("operatorId", "==", operatorId));
    }

    constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, "alerts"), ...constraints);

    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(
        (doc) => convertTimestamps({ id: doc.id, ...doc.data() }) as Alert
      );
      callback(alerts);
    });
  },
};
