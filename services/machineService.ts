import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  writeBatch,
} from "firebase/firestore";

import {
  Machine,
  MachineQueryOptions,
  MachineStatus,
  MaintenanceSchedule,
  PaginatedResponse,
  ServiceResponse,
} from "../types";

export const machineService = {
  // Create new machine
  async createMachine(
    machineData: Omit<Machine, "id" | "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<Machine>> {
    try {
      const machine: Omit<Machine, "id"> = {
        ...machineData,
        status: machineData.status || "operational",
        specifications: machineData.specifications || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const machineRef = await addDoc(collection(db, "machines"), {
        ...machine,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMaintenance: machine.lastMaintenance || null,
      });

      const createdMachine: Machine = {
        id: machineRef.id,
        ...machine,
      };

      return { success: true, data: createdMachine };
    } catch (error) {
      console.error("Error creating machine:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machine by ID
  async getMachineById(machineId: string): Promise<ServiceResponse<Machine>> {
    try {
      const machineDoc = await getDoc(doc(db, "machines", machineId));

      if (!machineDoc.exists()) {
        return { success: false, error: "Machine not found" };
      }

      const machineData = machineDoc.data();
      const machine: Machine = {
        id: machineDoc.id,
        ...machineData,
        createdAt: machineData.createdAt?.toDate() || new Date(),
        updatedAt: machineData.updatedAt?.toDate() || new Date(),
        lastMaintenance: machineData.lastMaintenance?.toDate() || undefined,
        maintenanceSchedule: {
          ...machineData.maintenanceSchedule,
          lastService:
            machineData.maintenanceSchedule?.lastService?.toDate() ||
            new Date(),
          nextService:
            machineData.maintenanceSchedule?.nextService?.toDate() ||
            new Date(),
        },
      } as Machine;

      return { success: true, data: machine };
    } catch (error) {
      console.error("Error getting machine:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machine by serial number
  async getMachineBySerial(
    serialNumber: string
  ): Promise<ServiceResponse<Machine>> {
    try {
      const machineQuery = query(
        collection(db, "machines"),
        where("serialNumber", "==", serialNumber),
        limit(1)
      );

      const snapshot = await getDocs(machineQuery);

      if (snapshot.empty) {
        return { success: false, error: "Machine not found" };
      }

      const machineDoc = snapshot.docs[0];
      const machineData = machineDoc.data();
      const machine: Machine = {
        id: machineDoc.id,
        ...machineData,
        createdAt: machineData.createdAt?.toDate() || new Date(),
        updatedAt: machineData.updatedAt?.toDate() || new Date(),
        lastMaintenance: machineData.lastMaintenance?.toDate() || undefined,
        maintenanceSchedule: {
          ...machineData.maintenanceSchedule,
          lastService:
            machineData.maintenanceSchedule?.lastService?.toDate() ||
            new Date(),
          nextService:
            machineData.maintenanceSchedule?.nextService?.toDate() ||
            new Date(),
        },
      } as Machine;

      return { success: true, data: machine };
    } catch (error) {
      console.error("Error getting machine by serial:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update machine
  async updateMachine(
    machineId: string,
    updates: Partial<Omit<Machine, "id" | "createdAt">>
  ): Promise<ServiceResponse<Machine>> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Handle date fields
      if (updates.lastMaintenance) {
        updateData.lastMaintenance = updates.lastMaintenance;
      }

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(doc(db, "machines", machineId), updateData);

      // Get updated machine
      const updatedMachine = await this.getMachineById(machineId);
      return updatedMachine;
    } catch (error) {
      console.error("Error updating machine:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete machine
  async deleteMachine(machineId: string): Promise<ServiceResponse<boolean>> {
    try {
      await deleteDoc(doc(db, "machines", machineId));
      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting machine:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machines with filtering and pagination
  async getMachines(
    options: MachineQueryOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<Machine>>> {
    try {
      let machineQuery = query(collection(db, "machines"));

      // Apply filters
      if (options.status) {
        machineQuery = query(
          machineQuery,
          where("status", "==", options.status)
        );
      }
      if (options.department) {
        machineQuery = query(
          machineQuery,
          where("department", "==", options.department)
        );
      }
      if (options.operatorId) {
        machineQuery = query(
          machineQuery,
          where("operatorId", "==", options.operatorId)
        );
      }

      // Apply ordering
      const orderField = options.orderBy || "createdAt";
      const orderDirection = options.orderDirection || "desc";
      machineQuery = query(machineQuery, orderBy(orderField, orderDirection));

      // Apply pagination
      if (options.startAfter) {
        machineQuery = query(machineQuery, startAfter(options.startAfter));
      }
      if (options.limit) {
        machineQuery = query(machineQuery, limit(options.limit));
      }

      const snapshot = await getDocs(machineQuery);

      const machines: Machine[] = snapshot.docs.map((doc) => {
        const machineData = doc.data();
        return {
          id: doc.id,
          ...machineData,
          createdAt: machineData.createdAt?.toDate() || new Date(),
          updatedAt: machineData.updatedAt?.toDate() || new Date(),
          lastMaintenance: machineData.lastMaintenance?.toDate() || undefined,
          maintenanceSchedule: {
            ...machineData.maintenanceSchedule,
            lastService:
              machineData.maintenanceSchedule?.lastService?.toDate() ||
              new Date(),
            nextService:
              machineData.maintenanceSchedule?.nextService?.toDate() ||
              new Date(),
          },
        } as Machine;
      });

      const hasNextPage = snapshot.docs.length === (options.limit || 50);
      const nextCursor = hasNextPage
        ? snapshot.docs[snapshot.docs.length - 1].id
        : undefined;

      return {
        success: true,
        data: {
          items: machines,
          totalCount: machines.length,
          hasNextPage,
          nextCursor,
        },
      };
    } catch (error) {
      console.error("Error getting machines:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machines by status
  async getMachinesByStatus(
    status: MachineStatus
  ): Promise<ServiceResponse<Machine[]>> {
    try {
      const result = await this.getMachines({ status });
      return {
        success: result.success,
        data: result.data?.items,
        error: result.error,
      };
    } catch (error) {
      console.error("Error getting machines by status:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machines by operator
  async getMachinesByOperator(
    operatorId: string
  ): Promise<ServiceResponse<Machine[]>> {
    try {
      const result = await this.getMachines({ operatorId });
      return {
        success: result.success,
        data: result.data?.items,
        error: result.error,
      };
    } catch (error) {
      console.error("Error getting machines by operator:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Assign operator to machine
  async assignOperator(
    machineId: string,
    operatorId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        operatorId,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error assigning operator:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Unassign operator from machine
  async unassignOperator(machineId: string): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        operatorId: null,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error unassigning operator:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update machine status
  async updateMachineStatus(
    machineId: string,
    status: MachineStatus
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        status,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error updating machine status:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update maintenance schedule
  async updateMaintenanceSchedule(
    machineId: string,
    schedule: MaintenanceSchedule
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "machines", machineId), {
        maintenanceSchedule: schedule,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error updating maintenance schedule:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Record maintenance completion
  async recordMaintenance(
    machineId: string,
    maintenanceDate: Date
  ): Promise<ServiceResponse<boolean>> {
    try {
      const machineResult = await this.getMachineById(machineId);
      if (!machineResult.success || !machineResult.data) {
        return { success: false, error: "Machine not found" };
      }

      const machine = machineResult.data;
      const schedule = machine.maintenanceSchedule;

      // Calculate next service date
      const nextServiceDate = new Date(maintenanceDate);
      nextServiceDate.setDate(nextServiceDate.getDate() + schedule.interval);

      const updatedSchedule: MaintenanceSchedule = {
        ...schedule,
        lastService: maintenanceDate,
        nextService: nextServiceDate,
      };

      await updateDoc(doc(db, "machines", machineId), {
        lastMaintenance: maintenanceDate,
        maintenanceSchedule: updatedSchedule,
        status: "operational", // Assume machine is operational after maintenance
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error recording maintenance:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machines due for maintenance
  async getMachinesDueForMaintenance(): Promise<ServiceResponse<Machine[]>> {
    try {
      const allMachinesResult = await this.getMachines();
      if (!allMachinesResult.success || !allMachinesResult.data) {
        return { success: false, error: "Failed to get machines" };
      }

      const today = new Date();
      const dueForMaintenance = allMachinesResult.data.items.filter(
        (machine) => {
          return machine.maintenanceSchedule.nextService <= today;
        }
      );

      return { success: true, data: dueForMaintenance };
    } catch (error) {
      console.error("Error getting machines due for maintenance:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get machine utilization stats
  async getMachineStats(): Promise<
    ServiceResponse<{
      totalMachines: number;
      operationalMachines: number;
      maintenanceMachines: number;
      errorMachines: number;
      offlineMachines: number;
      utilizationRate: number;
    }>
  > {
    try {
      const allMachinesResult = await this.getMachines();
      if (!allMachinesResult.success || !allMachinesResult.data) {
        return { success: false, error: "Failed to get machines" };
      }

      const machines = allMachinesResult.data.items;
      const totalMachines = machines.length;

      const statusCounts = machines.reduce((acc, machine) => {
        acc[machine.status] = (acc[machine.status] || 0) + 1;
        return acc;
      }, {} as Record<MachineStatus, number>);

      const operationalMachines = statusCounts.operational || 0;
      const utilizationRate =
        totalMachines > 0 ? (operationalMachines / totalMachines) * 100 : 0;

      const stats = {
        totalMachines,
        operationalMachines,
        maintenanceMachines: statusCounts.maintenance || 0,
        errorMachines: statusCounts.error || 0,
        offlineMachines: statusCounts.offline || 0,
        utilizationRate,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error getting machine stats:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Subscribe to machine changes
  subscribeToMachine(
    machineId: string,
    callback: (machine: Machine | null) => void
  ): () => void {
    return onSnapshot(doc(db, "machines", machineId), (doc) => {
      if (doc.exists()) {
        const machineData = doc.data();
        const machine: Machine = {
          id: doc.id,
          ...machineData,
          createdAt: machineData.createdAt?.toDate() || new Date(),
          updatedAt: machineData.updatedAt?.toDate() || new Date(),
          lastMaintenance: machineData.lastMaintenance?.toDate() || undefined,
          maintenanceSchedule: {
            ...machineData.maintenanceSchedule,
            lastService:
              machineData.maintenanceSchedule?.lastService?.toDate() ||
              new Date(),
            nextService:
              machineData.maintenanceSchedule?.nextService?.toDate() ||
              new Date(),
          },
        } as Machine;
        callback(machine);
      } else {
        callback(null);
      }
    });
  },

  // Subscribe to machines list
  subscribeToMachines(
    options: MachineQueryOptions = {},
    callback: (machines: Machine[]) => void
  ): () => void {
    let machineQuery = query(collection(db, "machines"));

    // Apply filters
    if (options.status) {
      machineQuery = query(machineQuery, where("status", "==", options.status));
    }
    if (options.department) {
      machineQuery = query(
        machineQuery,
        where("department", "==", options.department)
      );
    }
    if (options.operatorId) {
      machineQuery = query(
        machineQuery,
        where("operatorId", "==", options.operatorId)
      );
    }

    // Apply ordering
    const orderField = options.orderBy || "createdAt";
    const orderDirection = options.orderDirection || "desc";
    machineQuery = query(machineQuery, orderBy(orderField, orderDirection));

    if (options.limit) {
      machineQuery = query(machineQuery, limit(options.limit));
    }

    return onSnapshot(machineQuery, (snapshot) => {
      const machines: Machine[] = snapshot.docs.map((doc) => {
        const machineData = doc.data();
        return {
          id: doc.id,
          ...machineData,
          createdAt: machineData.createdAt?.toDate() || new Date(),
          updatedAt: machineData.updatedAt?.toDate() || new Date(),
          lastMaintenance: machineData.lastMaintenance?.toDate() || undefined,
          maintenanceSchedule: {
            ...machineData.maintenanceSchedule,
            lastService:
              machineData.maintenanceSchedule?.lastService?.toDate() ||
              new Date(),
            nextService:
              machineData.maintenanceSchedule?.nextService?.toDate() ||
              new Date(),
          },
        } as Machine;
      });
      callback(machines);
    });
  },

  // Bulk update machines
  async bulkUpdateMachines(
    updates: { machineId: string; data: Partial<Machine> }[]
  ): Promise<ServiceResponse<boolean>> {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ machineId, data }) => {
        const machineRef = doc(db, "machines", machineId);
        batch.update(machineRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      return { success: true, data: true };
    } catch (error) {
      console.error("Error bulk updating machines:", error);
      return { success: false, error: (error as Error).message };
    }
  },
};
