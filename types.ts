// Types and Interfaces for Caterpillar Smart Assistant

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: string[];
  employeeId: string;
  department: string;
  shiftSchedule: ShiftSchedule;
  assignedMachines?: string[];
  lastLogin: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftSchedule {
  shift: "day" | "evening" | "night";
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export type UserRole = "admin" | "supervisor" | "operator" | "maintenance";

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  loginTime: Date;
  logoutTime: Date | null;
  isActive: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: PermissionAction[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PermissionAction =
  | "read"
  | "write"
  | "delete"
  | "execute"
  | "approve";

export interface Machine {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  operatorId?: string;
  department: string;
  location: string;
  status: MachineStatus;
  specifications: Record<string, string>;
  maintenanceSchedule: MaintenanceSchedule;
  lastMaintenance?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MachineStatus = "operational" | "maintenance" | "error" | "offline";

export interface MaintenanceSchedule {
  interval: number; // days
  lastService: Date;
  nextService: Date;
  type: "preventive" | "reactive" | "predictive";
}

export interface AIInteraction {
  id: string;
  userId: string;
  machineId: string;
  query: string;
  response: string;
  confidence: number;
  category: InteractionCategory;
  authContext: AuthContext;
  timestamp: Date;
  resolved: boolean;
  feedback?: InteractionFeedback;
}

export type InteractionCategory =
  | "troubleshooting"
  | "maintenance"
  | "operation"
  | "safety"
  | "general";

export interface AuthContext {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
}

export interface InteractionFeedback {
  rating: number; // 1-5
  helpful: boolean;
  comments?: string;
  submittedAt: Date;
}

export interface Alert {
  id: string;
  machineId: string;
  userId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type AlertType =
  | "maintenance"
  | "error"
  | "warning"
  | "safety"
  | "performance";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "open" | "in_progress" | "resolved" | "dismissed";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  machineId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string;
}

// Query Options
export interface QueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  startAfter?: any;
}

export interface UserQueryOptions extends QueryOptions {
  role?: UserRole;
  department?: string;
  isActive?: boolean;
}

export interface MachineQueryOptions extends QueryOptions {
  status?: MachineStatus;
  department?: string;
  operatorId?: string;
}

export interface AlertQueryOptions extends QueryOptions {
  machineId?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
}

export interface TaskQueryOptions extends QueryOptions {
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  machineId?: string;
}
