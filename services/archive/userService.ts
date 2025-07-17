import { db } from "@/config/firebase";
import {
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
  PaginatedResponse,
  ServiceResponse,
  ShiftSchedule,
  UserProfile,
  UserQueryOptions,
  UserRole,
} from "../../types";

export const userService = {
  // Create new user profile
  async createUser(
    userData: Omit<UserProfile, "createdAt" | "updatedAt">
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      const userProfile: Omit<UserProfile, "uid"> = {
        ...userData,
        employeeId: userData.employeeId || `EMP-${Date.now()}`,
        permissions: userData.permissions || [],
        assignedMachines: userData.assignedMachines || [],
        isActive: userData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const createdUser: UserProfile = {
        uid: userData.uid,
        ...userProfile,
      };

      return { success: true, data: createdUser };
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<ServiceResponse<UserProfile>> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));

      if (!userDoc.exists()) {
        return { success: false, error: "User not found" };
      }

      const userData = userDoc.data();
      const user: UserProfile = {
        uid: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLogin: userData.lastLogin?.toDate() || new Date(),
      } as UserProfile;

      return { success: true, data: user };
    } catch (error) {
      console.error("Error getting user:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get user by employee ID
  async getUserByEmployeeId(
    employeeId: string
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      const userQuery = query(
        collection(db, "users"),
        where("employeeId", "==", employeeId),
        limit(1)
      );

      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        return { success: false, error: "User not found" };
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const user: UserProfile = {
        uid: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLogin: userData.lastLogin?.toDate() || new Date(),
      } as UserProfile;

      return { success: true, data: user };
    } catch (error) {
      console.error("Error getting user by employee ID:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update user profile
  async updateUser(
    userId: string,
    updates: Partial<Omit<UserProfile, "uid" | "createdAt">>
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(doc(db, "users", userId), updateData);

      // Get updated user
      const updatedUser = await this.getUserById(userId);
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete user (soft delete by setting isActive to false)
  async deleteUser(
    userId: string,
    hardDelete: boolean = false
  ): Promise<ServiceResponse<boolean>> {
    try {
      if (hardDelete) {
        await deleteDoc(doc(db, "users", userId));
      } else {
        await updateDoc(doc(db, "users", userId), {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get users with filtering and pagination
  async getUsers(
    options: UserQueryOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<UserProfile>>> {
    try {
      let userQuery = query(collection(db, "users"));

      // Apply filters
      if (options.role) {
        userQuery = query(userQuery, where("role", "==", options.role));
      }
      if (options.department) {
        userQuery = query(
          userQuery,
          where("department", "==", options.department)
        );
      }
      if (options.isActive !== undefined) {
        userQuery = query(userQuery, where("isActive", "==", options.isActive));
      }

      // Apply ordering
      const orderField = options.orderBy || "createdAt";
      const orderDirection = options.orderDirection || "desc";
      userQuery = query(userQuery, orderBy(orderField, orderDirection));

      // Apply pagination
      if (options.startAfter) {
        userQuery = query(userQuery, startAfter(options.startAfter));
      }
      if (options.limit) {
        userQuery = query(userQuery, limit(options.limit));
      }

      const snapshot = await getDocs(userQuery);

      const users: UserProfile[] = snapshot.docs.map((doc) => {
        const userData = doc.data();
        return {
          uid: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
        } as UserProfile;
      });

      const hasNextPage = snapshot.docs.length === (options.limit || 50);
      const nextCursor = hasNextPage
        ? snapshot.docs[snapshot.docs.length - 1].id
        : undefined;

      return {
        success: true,
        data: {
          items: users,
          totalCount: users.length,
          hasNextPage,
          nextCursor,
        },
      };
    } catch (error) {
      console.error("Error getting users:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get users by role
  async getUsersByRole(
    role: UserRole
  ): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const result = await this.getUsers({ role });
      return {
        success: result.success,
        data: result.data?.items,
        error: result.error,
      };
    } catch (error) {
      console.error("Error getting users by role:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get users by department
  async getUsersByDepartment(
    department: string
  ): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const result = await this.getUsers({ department });
      return {
        success: result.success,
        data: result.data?.items,
        error: result.error,
      };
    } catch (error) {
      console.error("Error getting users by department:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update user last login
  async updateLastLogin(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "users", userId), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error updating last login:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Assign machine to user
  async assignMachine(
    userId: string,
    machineId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const userResult = await this.getUserById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      const assignedMachines = userResult.data.assignedMachines || [];
      if (!assignedMachines.includes(machineId)) {
        assignedMachines.push(machineId);

        await updateDoc(doc(db, "users", userId), {
          assignedMachines,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true, data: true };
    } catch (error) {
      console.error("Error assigning machine:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Unassign machine from user
  async unassignMachine(
    userId: string,
    machineId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const userResult = await this.getUserById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      const assignedMachines = userResult.data.assignedMachines || [];
      const updatedMachines = assignedMachines.filter((id) => id !== machineId);

      await updateDoc(doc(db, "users", userId), {
        assignedMachines: updatedMachines,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error unassigning machine:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update user shift schedule
  async updateShiftSchedule(
    userId: string,
    shiftSchedule: ShiftSchedule
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "users", userId), {
        shiftSchedule,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error updating shift schedule:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Bulk update user permissions
  async updateUserPermissions(
    userId: string,
    permissions: string[]
  ): Promise<ServiceResponse<boolean>> {
    try {
      await updateDoc(doc(db, "users", userId), {
        permissions,
        updatedAt: serverTimestamp(),
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("Error updating user permissions:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Subscribe to user changes
  subscribeToUser(
    userId: string,
    callback: (user: UserProfile | null) => void
  ): () => void {
    return onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const user: UserProfile = {
          uid: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
        } as UserProfile;
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  // Subscribe to users list
  subscribeToUsers(
    options: UserQueryOptions = {},
    callback: (users: UserProfile[]) => void
  ): () => void {
    let userQuery = query(collection(db, "users"));

    // Apply filters
    if (options.role) {
      userQuery = query(userQuery, where("role", "==", options.role));
    }
    if (options.department) {
      userQuery = query(
        userQuery,
        where("department", "==", options.department)
      );
    }
    if (options.isActive !== undefined) {
      userQuery = query(userQuery, where("isActive", "==", options.isActive));
    }

    // Apply ordering
    const orderField = options.orderBy || "createdAt";
    const orderDirection = options.orderDirection || "desc";
    userQuery = query(userQuery, orderBy(orderField, orderDirection));

    if (options.limit) {
      userQuery = query(userQuery, limit(options.limit));
    }

    return onSnapshot(userQuery, (snapshot) => {
      const users: UserProfile[] = snapshot.docs.map((doc) => {
        const userData = doc.data();
        return {
          uid: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
        } as UserProfile;
      });
      callback(users);
    });
  },

  // Bulk operations
  async bulkUpdateUsers(
    updates: { userId: string; data: Partial<UserProfile> }[]
  ): Promise<ServiceResponse<boolean>> {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ userId, data }) => {
        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      return { success: true, data: true };
    } catch (error) {
      console.error("Error bulk updating users:", error);
      return { success: false, error: (error as Error).message };
    }
  },
};
