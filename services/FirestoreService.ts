import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    Timestamp,
    Query,
    DocumentData,
    QuerySnapshot,
    DocumentSnapshot,
    FieldValue,
    WhereFilterOp,
    OrderByDirection,
    Unsubscribe
  } from 'firebase/firestore';
  import { db } from '../config/firebase'; // Your Firebase config
  
  // ===== TYPE DEFINITIONS =====
  
  interface BaseDocument {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  
  interface Location {
    latitude: number;
    longitude: number;
    timestamp: Timestamp;
  }
  
  interface Checkpoint {
    id: string;
    description: string;
    location?: Location;
    completed: boolean;
    completedAt?: Timestamp;
    gpsTagged: boolean;
  }
  
  interface Operator extends BaseDocument {
    employeeId: string;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'on_break' | 'off_duty';
    currentMachineId?: string;
    skills: string[];
    certifications: string[];
    contactInfo: {
      phone: string;
      emergencyContact: string;
    };
  }
  
  interface Machine extends BaseDocument {
    serialNumber: string;
    model: string;
    type: string;
    status: 'active' | 'inactive' | 'maintenance' | 'out_of_service';
    currentOperatorId?: string;
    location?: Location;
    fuelLevel: number;
    maintenanceSchedule: {
      lastMaintenance: Timestamp;
      nextMaintenance: Timestamp;
    };
    specifications: {
      maxSpeed: number;
      capacity: number;
      fuelCapacity: number;
    };
  }
  
  interface WorkOrder extends BaseDocument {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    assignedOperatorId: string;
    assignedMachineId?: string;
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    actualStart?: Timestamp;
    actualEnd?: Timestamp;
    checkpoints: Checkpoint[];
    location: Location;
    estimatedDuration: number;
    notes?: string;
  }
  
  interface ScheduledTask extends BaseDocument {
    title: string;
    description: string;
    operatorId: string;
    scheduledDate: Timestamp;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startTime?: Timestamp;
    endTime?: Timestamp;
    taskType: 'maintenance' | 'inspection' | 'operation' | 'training';
    priority: 'low' | 'medium' | 'high';
    estimatedDuration: number;
  }
  
  interface InspectionItem {
    id: string;
    description: string;
    status: 'pending' | 'pass' | 'fail' | 'na';
    notes?: string;
    timestamp?: Timestamp;
  }
  
  interface Inspection extends BaseDocument {
    operatorId: string;
    machineId: string;
    type: 'daily' | 'weekly' | 'monthly' | 'annual';
    status: 'pending' | 'in_progress' | 'completed';
    startTime: Timestamp;
    endTime?: Timestamp;
    checklist: { [key: string]: InspectionItem };
    overallResult?: 'pass' | 'fail';
    notes?: string;
    signature?: string;
  }
  
  interface Alert extends BaseDocument {
    type: 'emergency' | 'warning' | 'info' | 'maintenance';
    title: string;
    message: string;
    operatorId?: string;
    machineId?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'acknowledged' | 'resolved';
    acknowledgedBy?: string;
    acknowledgedAt?: Timestamp;
    resolvedBy?: string;
    resolvedAt?: Timestamp;
    audioPlayed: boolean;
    location?: Location;
  }
  
  interface TrackingData extends BaseDocument {
    operatorId: string;
    machineId: string;
    location: Location;
    speed: number;
    fuelLevel: number;
    engineHours: number;
    temperature: number;
    status: string;
  }
  
  interface EfficiencyMetrics extends BaseDocument {
    operatorId: string;
    machineId?: string;
    date: Timestamp;
    hoursWorked: number;
    tasksCompleted: number;
    fuelConsumed: number;
    distance: number;
    efficiency: number;
    downtime: number;
  }
  
  interface TrainingModule extends BaseDocument {
    title: string;
    description: string;
    category: string;
    duration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    requiredCertifications: string[];
    content: {
      videoUrl?: string;
      documentUrl?: string;
      quiz?: any[];
    };
    isActive: boolean;
  }
  
  interface OperatorTraining extends BaseDocument {
    operatorId: string;
    moduleId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    startDate: Timestamp;
    completionDate?: Timestamp;
    score?: number;
    attempts: number;
    certificateUrl?: string;
  }
  
  interface OfflineQueueItem extends BaseDocument {
    action: 'create' | 'update' | 'delete';
    collection: string;
    docId?: string;
    data: any;
    priority: number;
    attempts: number;
    maxAttempts: number;
    status: 'pending' | 'completed' | 'failed';
    errorMessage?: string;
  }
  
  interface SystemSettings extends BaseDocument {
    key: string;
    value: any;
    description: string;
    category: string;
    isActive: boolean;
  }
  
  interface Manual extends BaseDocument {
    title: string;
    category: string;
    version: string;
    fileUrl: string;
    machineTypes: string[];
    description: string;
    isActive: boolean;
  }
  
  interface ChatLog extends BaseDocument {
    operatorId: string;
    message: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'audio' | 'location';
    response?: string;
    isRead: boolean;
  }
  
  // ===== QUERY TYPES =====
  
  interface QueryFilter {
    field: string;
    operator: WhereFilterOp;
    value: any;
  }
  
  interface QueryOptions {
    filters?: QueryFilter[];
    orderByField?: string;
    orderDirection?: OrderByDirection;
    limitCount?: number;
    startAfterDoc?: DocumentSnapshot;
  }
  
  interface ListenerOptions {
    filters?: QueryFilter[];
    orderByField?: string;
    orderDirection?: OrderByDirection;
    limitCount?: number;
  }
  
  interface BatchUpdateItem {
    collectionName: string;
    docId: string;
    data: Partial<DocumentData>;
  }
  
  // ===== COLLECTION NAMES =====
  
  interface Collections {
    OPERATORS: string;
    MACHINES: string;
    WORK_ORDERS: string;
    SCHEDULED_TASKS: string;
    INSPECTIONS: string;
    ALERTS: string;
    TRACKING_DATA: string;
    EFFICIENCY_METRICS: string;
    TRAINING_MODULES: string;
    OPERATOR_TRAINING: string;
    OFFLINE_QUEUE: string;
    SYSTEM_SETTINGS: string;
    MANUALS: string;
    CHAT_LOGS: string;
  }
  
  class FirestoreService {
    public readonly collections: Collections;
  
    constructor() {
      this.collections = {
        OPERATORS: 'operators',
        MACHINES: 'machines',
        WORK_ORDERS: 'workOrders',
        SCHEDULED_TASKS: 'scheduledTasks',
        INSPECTIONS: 'inspections',
        ALERTS: 'alerts',
        TRACKING_DATA: 'trackingData',
        EFFICIENCY_METRICS: 'efficiencyMetrics',
        TRAINING_MODULES: 'trainingModules',
        OPERATOR_TRAINING: 'operatorTraining',
        OFFLINE_QUEUE: 'offlineQueue',
        SYSTEM_SETTINGS: 'systemSettings',
        MANUALS: 'manuals',
        CHAT_LOGS: 'chatLogs'
      };
    }
  
    // ===== GENERIC CRUD OPERATIONS =====
  
    /**
     * Create a new document
     * @param collectionName - Collection name
     * @param data - Document data
     * @returns Document ID
     */
    async create<T extends Partial<DocumentData>>(
      collectionName: string, 
      data: T
    ): Promise<string> {
      try {
        const docData = {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, collectionName), docData);
        
        // Update the document with its own ID
        await updateDoc(docRef, { id: docRef.id });
        
        return docRef.id;
      } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        throw new Error(`Failed to create document: ${(error as Error).message}`);
      }
    }
  
    /**
     * Read a single document by ID
     * @param collectionName - Collection name
     * @param docId - Document ID
     * @returns Document data or null
     */
    async read<T extends BaseDocument>(
      collectionName: string, 
      docId: string
    ): Promise<T | null> {
      try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as T;
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error reading document from ${collectionName}:`, error);
        throw new Error(`Failed to read document: ${(error as Error).message}`);
      }
    }
  
    /**
     * Update a document
     * @param collectionName - Collection name
     * @param docId - Document ID
     * @param data - Updated data
     */
    async update<T extends Partial<DocumentData>>(
      collectionName: string, 
      docId: string, 
      data: T
    ): Promise<void> {
      try {
        const docRef = doc(db, collectionName, docId);
        const updateData = {
          ...data,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(docRef, updateData);
      } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        throw new Error(`Failed to update document: ${(error as Error).message}`);
      }
    }
  
    /**
     * Delete a document
     * @param collectionName - Collection name
     * @param docId - Document ID
     */
    async delete(collectionName: string, docId: string): Promise<void> {
      try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        throw new Error(`Failed to delete document: ${(error as Error).message}`);
      }
    }
  
    /**
     * Get all documents from a collection with optional filtering
     * @param collectionName - Collection name
     * @param options - Query options
     * @returns Array of documents
     */
    async getAll<T extends BaseDocument>(
      collectionName: string, 
      options: QueryOptions = {}
    ): Promise<T[]> {
      try {
        const {
          filters = [],
          orderByField = 'createdAt',
          orderDirection = 'desc',
          limitCount = null,
          startAfterDoc = null
        } = options;
  
        let q: Query<DocumentData> = collection(db, collectionName);
  
        // Apply filters
        filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
  
        // Apply ordering
        q = query(q, orderBy(orderByField, orderDirection));
  
        // Apply limit
        if (limitCount) {
          q = query(q, limit(limitCount));
        }
  
        // Apply pagination
        if (startAfterDoc) {
          q = query(q, startAfter(startAfterDoc));
        }
  
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
      } catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw new Error(`Failed to get documents: ${(error as Error).message}`);
      }
    }
  
    /**
     * Listen to real-time updates
     * @param collectionName - Collection name
     * @param callback - Callback function
     * @param options - Query options
     * @returns Unsubscribe function
     */
    listen<T extends BaseDocument>(
      collectionName: string, 
      callback: (docs: T[] | null, error?: Error) => void, 
      options: ListenerOptions = {}
    ): Unsubscribe {
      try {
        const {
          filters = [],
          orderByField = 'createdAt',
          orderDirection = 'desc',
          limitCount = null
        } = options;
  
        let q: Query<DocumentData> = collection(db, collectionName);
  
        // Apply filters
        filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
  
        // Apply ordering
        q = query(q, orderBy(orderByField, orderDirection));
  
        // Apply limit
        if (limitCount) {
          q = query(q, limit(limitCount));
        }
  
        return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
          const docs: T[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          callback(docs);
        }, (error: Error) => {
          console.error(`Error listening to ${collectionName}:`, error);
          callback(null, error);
        });
      } catch (error) {
        console.error(`Error setting up listener for ${collectionName}:`, error);
        throw new Error(`Failed to set up listener: ${(error as Error).message}`);
      }
    }
  
    // ===== OPERATOR SPECIFIC OPERATIONS =====
  
    async createOperator(operatorData: Omit<Operator, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.OPERATORS, operatorData);
    }
  
    async getOperator(operatorId: string): Promise<Operator | null> {
      return this.read<Operator>(this.collections.OPERATORS, operatorId);
    }
  
    async updateOperator(operatorId: string, data: Partial<Operator>): Promise<void> {
      return this.update(this.collections.OPERATORS, operatorId, data);
    }
  
    async getOperatorByEmployeeId(employeeId: string): Promise<Operator | null> {
      const operators = await this.getAll<Operator>(this.collections.OPERATORS, {
        filters: [{ field: 'employeeId', operator: '==', value: employeeId }],
        limitCount: 1
      });
      return operators.length > 0 ? operators[0] : null;
    }
  
    async updateOperatorStatus(operatorId: string, status: Operator['status']): Promise<void> {
      return this.update(this.collections.OPERATORS, operatorId, { status });
    }
  
    async assignMachineToOperator(operatorId: string, machineId: string): Promise<void> {
      const batch = writeBatch(db);
      
      // Update operator
      const operatorRef = doc(db, this.collections.OPERATORS, operatorId);
      batch.update(operatorRef, { 
        currentMachineId: machineId,
        updatedAt: serverTimestamp()
      });
      
      // Update machine
      const machineRef = doc(db, this.collections.MACHINES, machineId);
      batch.update(machineRef, { 
        currentOperatorId: operatorId,
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
    }
  
    // ===== MACHINE SPECIFIC OPERATIONS =====
  
    async createMachine(machineData: Omit<Machine, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.MACHINES, machineData);
    }
  
    async getMachine(machineId: string): Promise<Machine | null> {
      return this.read<Machine>(this.collections.MACHINES, machineId);
    }
  
    async updateMachine(machineId: string, data: Partial<Machine>): Promise<void> {
      return this.update(this.collections.MACHINES, machineId, data);
    }
  
    async updateMachineLocation(machineId: string, location: Omit<Location, 'timestamp'>): Promise<void> {
      return this.update(this.collections.MACHINES, machineId, {
        location: {
          ...location,
          timestamp: serverTimestamp()
        }
      });
    }
  
    async updateMachineFuelLevel(machineId: string, fuelLevel: number): Promise<void> {
      return this.update(this.collections.MACHINES, machineId, { fuelLevel });
    }
  
    async getMachinesByStatus(status: Machine['status']): Promise<Machine[]> {
      return this.getAll<Machine>(this.collections.MACHINES, {
        filters: [{ field: 'status', operator: '==', value: status }]
      });
    }
  
    async getAvailableMachines(): Promise<Machine[]> {
      return this.getAll<Machine>(this.collections.MACHINES, {
        filters: [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'currentOperatorId', operator: '==', value: null }
        ]
      });
    }
  
    // ===== WORK ORDER SPECIFIC OPERATIONS =====
  
    async createWorkOrder(workOrderData: Omit<WorkOrder, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.WORK_ORDERS, workOrderData);
    }
  
    async getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
      return this.read<WorkOrder>(this.collections.WORK_ORDERS, workOrderId);
    }
  
    async updateWorkOrder(workOrderId: string, data: Partial<WorkOrder>): Promise<void> {
      return this.update(this.collections.WORK_ORDERS, workOrderId, data);
    }
  
    async getWorkOrdersByOperator(operatorId: string): Promise<WorkOrder[]> {
      return this.getAll<WorkOrder>(this.collections.WORK_ORDERS, {
        filters: [{ field: 'assignedOperatorId', operator: '==', value: operatorId }],
        orderByField: 'scheduledStart',
        orderDirection: 'asc'
      });
    }
  
    async getActiveWorkOrders(): Promise<WorkOrder[]> {
      return this.getAll<WorkOrder>(this.collections.WORK_ORDERS, {
        filters: [{ field: 'status', operator: '==', value: 'in_progress' }]
      });
    }
  
    async updateWorkOrderStatus(workOrderId: string, status: WorkOrder['status']): Promise<void> {
      const updateData: Partial<WorkOrder> = { status };
      
      if (status === 'in_progress') {
        updateData.actualStart = serverTimestamp() as any;
      } else if (status === 'completed') {
        updateData.actualEnd = serverTimestamp() as any;
      }
      
      return this.update(this.collections.WORK_ORDERS, workOrderId, updateData);
    }
  
    async updateCheckpointStatus(
      workOrderId: string, 
      checkpointId: string, 
      completed: boolean, 
      gpsTagged: boolean = false
    ): Promise<void> {
      const workOrder = await this.getWorkOrder(workOrderId);
      if (!workOrder) throw new Error('Work order not found');
      
      const updatedCheckpoints = workOrder.checkpoints.map(checkpoint => {
        if (checkpoint.id === checkpointId) {
          return {
            ...checkpoint,
            completed,
            completedAt: completed ? Timestamp.now() : undefined,
            gpsTagged
          };
        }
        return checkpoint;
      });
      
      return this.update(this.collections.WORK_ORDERS, workOrderId, {
        checkpoints: updatedCheckpoints
      });
    }
  
    // ===== SCHEDULED TASKS SPECIFIC OPERATIONS =====
  
    async createScheduledTask(taskData: Omit<ScheduledTask, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.SCHEDULED_TASKS, taskData);
    }
  
    async getScheduledTask(taskId: string): Promise<ScheduledTask | null> {
      return this.read<ScheduledTask>(this.collections.SCHEDULED_TASKS, taskId);
    }
  
    async getTasksByOperator(operatorId: string, date?: Date): Promise<ScheduledTask[]> {
      const filters: QueryFilter[] = [{ field: 'operatorId', operator: '==', value: operatorId }];
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        filters.push(
          { field: 'scheduledDate', operator: '>=', value: Timestamp.fromDate(startOfDay) },
          { field: 'scheduledDate', operator: '<=', value: Timestamp.fromDate(endOfDay) }
        );
      }
      
      return this.getAll<ScheduledTask>(this.collections.SCHEDULED_TASKS, {
        filters,
        orderByField: 'scheduledDate',
        orderDirection: 'asc'
      });
    }
  
    async updateTaskStatus(taskId: string, status: ScheduledTask['status']): Promise<void> {
      const updateData: Partial<ScheduledTask> = { status };
      
      if (status === 'in_progress') {
        updateData.startTime = serverTimestamp() as any;
      } else if (status === 'completed') {
        updateData.endTime = serverTimestamp() as any;
      }
      
      return this.update(this.collections.SCHEDULED_TASKS, taskId, updateData);
    }
  
    // ===== TRAINING MODULE SPECIFIC OPERATIONS =====

    async createTrainingModule(moduleData: Omit<TrainingModule, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.TRAINING_MODULES, moduleData);
    }

    // ===== INSPECTION SPECIFIC OPERATIONS =====
  
    async createInspection(inspectionData: Omit<Inspection, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.INSPECTIONS, inspectionData);
    }
  
    async updateInspectionItem(
      inspectionId: string, 
      itemId: string, 
      itemData: Partial<InspectionItem>
    ): Promise<void> {
      const inspection = await this.read<Inspection>(this.collections.INSPECTIONS, inspectionId);
      if (!inspection) throw new Error('Inspection not found');
      
      const updatedChecklist = {
        ...inspection.checklist,
        [itemId]: {
          ...inspection.checklist[itemId],
          ...itemData,
          timestamp: serverTimestamp()
        }
      };
      
      return this.update(this.collections.INSPECTIONS, inspectionId, {
        checklist: updatedChecklist
      });
    }
  
    async completeInspection(
      inspectionId: string, 
      overallResult: Inspection['overallResult'], 
      notes: string = '', 
      signature?: string
    ): Promise<void> {
      return this.update(this.collections.INSPECTIONS, inspectionId, {
        status: 'completed',
        overallResult,
        notes,
        signature,
        endTime: serverTimestamp() as any
      });
    }
  
    // ===== ALERT SPECIFIC OPERATIONS =====
  
    async createAlert(alertData: Omit<Alert, keyof BaseDocument>): Promise<string> {
      return this.create(this.collections.ALERTS, alertData);
    }
  
    async getActiveAlerts(operatorId?: string): Promise<Alert[]> {
      const filters: QueryFilter[] = [{ field: 'status', operator: '==', value: 'active' }];
      
      if (operatorId) {
        filters.push({ field: 'operatorId', operator: '==', value: operatorId });
      }
      
      return this.getAll<Alert>(this.collections.ALERTS, {
        filters,
        orderByField: 'createdAt',
        orderDirection: 'desc'
      });
    }
  
    async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
      return this.update(this.collections.ALERTS, alertId, {
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: serverTimestamp() as any
      });
    }
  
    async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
      return this.update(this.collections.ALERTS, alertId, {
        status: 'resolved',
        resolvedBy,
        resolvedAt: serverTimestamp() as any
      });
    }
  
    async markAudioPlayed(alertId: string): Promise<void> {
      return this.update(this.collections.ALERTS, alertId, {
        audioPlayed: true
      });
    }
  
    // ===== OFFLINE QUEUE OPERATIONS =====
  
    async addToOfflineQueue(data: Omit<OfflineQueueItem, keyof BaseDocument | 'attempts' | 'maxAttempts' | 'status'>): Promise<string> {
      return this.create(this.collections.OFFLINE_QUEUE, {
        ...data,
        attempts: 0,
        maxAttempts: 3,
        status: 'pending'
      });
    }
  
    async getPendingOfflineItems(): Promise<OfflineQueueItem[]> {
      return this.getAll<OfflineQueueItem>(this.collections.OFFLINE_QUEUE, {
        filters: [{ field: 'status', operator: '==', value: 'pending' }],
        orderByField: 'priority',
        orderDirection: 'desc'
      });
    }
  
    async updateOfflineItemStatus(
      queueId: string, 
      status: OfflineQueueItem['status'], 
      errorMessage?: string
    ): Promise<void> {
      const updateData: Partial<OfflineQueueItem> = { status };
      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }
      return this.update(this.collections.OFFLINE_QUEUE, queueId, updateData);
    }
  
    async incrementOfflineAttempts(queueId: string): Promise<void> {
      const item = await this.read<OfflineQueueItem>(this.collections.OFFLINE_QUEUE, queueId);
      if (!item) return;
      
      const newAttempts = item.attempts + 1;
      const status: OfflineQueueItem['status'] = newAttempts >= item.maxAttempts ? 'failed' : 'pending';
      
      return this.update(this.collections.OFFLINE_QUEUE, queueId, {
        attempts: newAttempts,
        status
      });
    }
  
    // ===== BATCH OPERATIONS =====
  
    async batchCreate<T extends Partial<DocumentData>>(
      collectionName: string, 
      documents: T[]
    ): Promise<string[]> {
      try {
        const batch = writeBatch(db);
        const docRefs: any[] = [];
        
        documents.forEach(docData => {
          const docRef = doc(collection(db, collectionName));
          const dataWithTimestamps = {
            ...docData,
            id: docRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          batch.set(docRef, dataWithTimestamps);
          docRefs.push(docRef);
        });
        
        await batch.commit();
        return docRefs.map(ref => ref.id);
      } catch (error) {
        console.error(`Error batch creating documents in ${collectionName}:`, error);
        throw new Error(`Failed to batch create documents: ${(error as Error).message}`);
      }
    }
  
    async batchUpdate(updates: BatchUpdateItem[]): Promise<void> {
      try {
        const batch = writeBatch(db);
        
        updates.forEach(({ collectionName, docId, data }) => {
          const docRef = doc(db, collectionName, docId);
          batch.update(docRef, {
            ...data,
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
      } catch (error) {
        console.error('Error batch updating documents:', error);
        throw new Error(`Failed to batch update documents: ${(error as Error).message}`);
      }
    }
  
    // ===== UTILITY METHODS =====
  
    /**
     * Convert Firestore timestamp to JavaScript Date
     * @param timestamp - Firestore timestamp
     * @returns JavaScript Date or null
     */
    timestampToDate(timestamp: Timestamp | undefined): Date | null {
      return timestamp?.toDate ? timestamp.toDate() : null;
    }
  
    /**
     * Convert JavaScript Date to Firestore timestamp
     * @param date - JavaScript Date
     * @returns Firestore timestamp
     */
    dateToTimestamp(date: Date): Timestamp {
      return Timestamp.fromDate(date);
    }
  
    /**
     * Get server timestamp
     * @returns Server timestamp
     */
    getServerTimestamp(): FieldValue {
      return serverTimestamp();
    }
  }
  
  // Export singleton instance
  export default new FirestoreService();
  
  // Export types for use in other files
  export type {
    BaseDocument,
    Location,
    Checkpoint,
    Operator,
    Machine,
    WorkOrder,
    ScheduledTask,
    Inspection,
    InspectionItem,
    Alert,
    TrackingData,
    EfficiencyMetrics,
    TrainingModule,
    OperatorTraining,
    OfflineQueueItem,
    SystemSettings,
    Manual,
    ChatLog,
    QueryFilter,
    QueryOptions,
    ListenerOptions,
    BatchUpdateItem,
    Collections
  };