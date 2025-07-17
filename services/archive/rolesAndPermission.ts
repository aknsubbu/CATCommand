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
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// ============================================
// INTERFACES
// ============================================

export interface Permission {
  id?: string;
  name: string; // e.g., 'machine.read', 'alerts.write'
  resource: string; // e.g., 'machine', 'alerts', 'users'
  actions: ("read" | "write" | "delete" | "execute")[];
  description: string;
  category:
    | "system"
    | "machine"
    | "user"
    | "maintenance"
    | "alert"
    | "report"
    | "custom";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id?: string;
  name: string; // e.g., 'admin', 'supervisor', 'operator'
  displayName: string; // e.g., 'System Administrator'
  description: string;
  permissions: string[]; // Array of permission names
  hierarchy: number; // 1 = highest (admin), higher numbers = lower hierarchy
  inheritFrom?: string; // Parent role to inherit permissions from
  department?: string; // Department this role belongs to
  isSystemRole: boolean; // Cannot be deleted if true
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  id?: string;
  userId: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  notes?: string;
}

export interface CreatePermissionData {
  name: string;
  resource: string;
  actions: Permission["actions"];
  description: string;
  category: Permission["category"];
}

export interface UpdatePermissionData {
  name?: string;
  resource?: string;
  actions?: Permission["actions"];
  description?: string;
  category?: Permission["category"];
  isActive?: boolean;
}

export interface CreateRoleData {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  hierarchy: number;
  inheritFrom?: string;
  department?: string;
}

export interface UpdateRoleData {
  displayName?: string;
  description?: string;
  permissions?: string[];
  hierarchy?: number;
  inheritFrom?: string;
  department?: string;
  isActive?: boolean;
}

export interface RoleFilters {
  department?: string;
  hierarchy?: number;
  isActive?: boolean;
  isSystemRole?: boolean;
}

export interface PermissionFilters {
  resource?: string;
  category?: string;
  isActive?: boolean;
}

export interface PaginationOptions {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

// ============================================
// PERMISSION SERVICE
// ============================================

export const permissionService = {
  // Create new permission
  async createPermission(
    permissionData: CreatePermissionData
  ): Promise<Permission> {
    try {
      // Check if permission already exists
      const existingPermission = await this.getPermissionByName(
        permissionData.name
      );
      if (existingPermission) {
        throw new Error("Permission with this name already exists");
      }

      const newPermission = {
        ...permissionData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "permissions"), newPermission);

      return {
        id: docRef.id,
        ...newPermission,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Permission;
    } catch (error) {
      console.error("Error creating permission:", error);
      throw error;
    }
  },

  // Get permission by ID
  async getPermission(id: string): Promise<Permission | null> {
    try {
      const permissionDoc = await getDoc(doc(db, "permissions", id));

      if (!permissionDoc.exists()) {
        return null;
      }

      const permissionData = permissionDoc.data();
      return {
        id: permissionDoc.id,
        ...permissionData,
        createdAt: permissionData.createdAt
          ? permissionData.createdAt.toDate()
          : new Date(),
        updatedAt: permissionData.updatedAt
          ? permissionData.updatedAt.toDate()
          : new Date(),
      } as Permission;
    } catch (error) {
      console.error("Error getting permission:", error);
      throw error;
    }
  },

  // Get permission by name
  async getPermissionByName(name: string): Promise<Permission | null> {
    try {
      const permissionQuery = query(
        collection(db, "permissions"),
        where("name", "==", name),
        limit(1)
      );

      const snapshot = await getDocs(permissionQuery);

      if (snapshot.empty) {
        return null;
      }

      const permissionDoc = snapshot.docs[0];
      const permissionData = permissionDoc.data();

      return {
        id: permissionDoc.id,
        ...permissionData,
        createdAt: permissionData.createdAt
          ? permissionData.createdAt.toDate()
          : new Date(),
        updatedAt: permissionData.updatedAt
          ? permissionData.updatedAt.toDate()
          : new Date(),
      } as Permission;
    } catch (error) {
      console.error("Error getting permission by name:", error);
      throw error;
    }
  },

  // Update permission
  async updatePermission(
    id: string,
    updates: UpdatePermissionData
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "permissions", id), updateData);
    } catch (error) {
      console.error("Error updating permission:", error);
      throw error;
    }
  },

  // Delete permission
  async deletePermission(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "permissions", id));
    } catch (error) {
      console.error("Error deleting permission:", error);
      throw error;
    }
  },

  // Get all permissions with filters
  async getPermissions(filters: PermissionFilters = {}): Promise<Permission[]> {
    try {
      let permissionQuery = query(collection(db, "permissions"));

      // Apply filters
      if (filters.resource) {
        permissionQuery = query(
          permissionQuery,
          where("resource", "==", filters.resource)
        );
      }
      if (filters.category) {
        permissionQuery = query(
          permissionQuery,
          where("category", "==", filters.category)
        );
      }
      if (filters.isActive !== undefined) {
        permissionQuery = query(
          permissionQuery,
          where("isActive", "==", filters.isActive)
        );
      }

      // Add ordering
      permissionQuery = query(permissionQuery, orderBy("name"));

      const snapshot = await getDocs(permissionQuery);

      return snapshot.docs.map((doc) => {
        const permissionData = doc.data();
        return {
          id: doc.id,
          ...permissionData,
          createdAt: permissionData.createdAt
            ? permissionData.createdAt.toDate()
            : new Date(),
          updatedAt: permissionData.updatedAt
            ? permissionData.updatedAt.toDate()
            : new Date(),
        } as Permission;
      });
    } catch (error) {
      console.error("Error getting permissions:", error);
      throw error;
    }
  },

  // Get permissions by resource
  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    try {
      const permissionQuery = query(
        collection(db, "permissions"),
        where("resource", "==", resource),
        where("isActive", "==", true),
        orderBy("name")
      );

      const snapshot = await getDocs(permissionQuery);

      return snapshot.docs.map((doc) => {
        const permissionData = doc.data();
        return {
          id: doc.id,
          ...permissionData,
          createdAt: permissionData.createdAt
            ? permissionData.createdAt.toDate()
            : new Date(),
          updatedAt: permissionData.updatedAt
            ? permissionData.updatedAt.toDate()
            : new Date(),
        } as Permission;
      });
    } catch (error) {
      console.error("Error getting permissions by resource:", error);
      throw error;
    }
  },

  // Initialize default permissions
  async initializeDefaultPermissions(): Promise<void> {
    const defaultPermissions: CreatePermissionData[] = [
      // Machine permissions
      {
        name: "machine.read",
        resource: "machine",
        actions: ["read"],
        description: "View machine information",
        category: "machine",
      },
      {
        name: "machine.write",
        resource: "machine",
        actions: ["write"],
        description: "Edit machine information",
        category: "machine",
      },
      {
        name: "machine.delete",
        resource: "machine",
        actions: ["delete"],
        description: "Delete machines",
        category: "machine",
      },
      {
        name: "machine.operate",
        resource: "machine",
        actions: ["execute"],
        description: "Operate machines",
        category: "machine",
      },

      // User permissions
      {
        name: "user.read",
        resource: "user",
        actions: ["read"],
        description: "View user information",
        category: "user",
      },
      {
        name: "user.write",
        resource: "user",
        actions: ["write"],
        description: "Edit user information",
        category: "user",
      },
      {
        name: "user.delete",
        resource: "user",
        actions: ["delete"],
        description: "Delete users",
        category: "user",
      },

      // Maintenance permissions
      {
        name: "maintenance.read",
        resource: "maintenance",
        actions: ["read"],
        description: "View maintenance tasks",
        category: "maintenance",
      },
      {
        name: "maintenance.write",
        resource: "maintenance",
        actions: ["write"],
        description: "Create and edit maintenance tasks",
        category: "maintenance",
      },
      {
        name: "maintenance.approve",
        resource: "maintenance",
        actions: ["execute"],
        description: "Approve maintenance tasks",
        category: "maintenance",
      },

      // Alert permissions
      {
        name: "alerts.read",
        resource: "alerts",
        actions: ["read"],
        description: "View alerts",
        category: "alert",
      },
      {
        name: "alerts.write",
        resource: "alerts",
        actions: ["write"],
        description: "Create and edit alerts",
        category: "alert",
      },
      {
        name: "alerts.resolve",
        resource: "alerts",
        actions: ["execute"],
        description: "Resolve alerts",
        category: "alert",
      },

      // Report permissions
      {
        name: "reports.read",
        resource: "reports",
        actions: ["read"],
        description: "View reports",
        category: "report",
      },
      {
        name: "reports.generate",
        resource: "reports",
        actions: ["execute"],
        description: "Generate reports",
        category: "report",
      },

      // Task permissions
      {
        name: "tasks.read",
        resource: "tasks",
        actions: ["read"],
        description: "View tasks",
        category: "system",
      },
      {
        name: "tasks.write",
        resource: "tasks",
        actions: ["write"],
        description: "Create and edit tasks",
        category: "system",
      },

      // System permissions
      {
        name: "system.admin",
        resource: "system",
        actions: ["read", "write", "delete", "execute"],
        description: "Full system administration",
        category: "system",
      },
    ];

    try {
      for (const permission of defaultPermissions) {
        const existing = await this.getPermissionByName(permission.name);
        if (!existing) {
          await this.createPermission(permission);
        }
      }
    } catch (error) {
      console.error("Error initializing default permissions:", error);
      throw error;
    }
  },
};

// ============================================
// ROLE SERVICE
// ============================================

export const roleService = {
  // Create new role
  async createRole(roleData: CreateRoleData): Promise<Role> {
    try {
      // Check if role already exists
      const existingRole = await this.getRoleByName(roleData.name);
      if (existingRole) {
        throw new Error("Role with this name already exists");
      }

      // Validate permissions exist
      for (const permissionName of roleData.permissions) {
        const permission = await permissionService.getPermissionByName(
          permissionName
        );
        if (!permission) {
          throw new Error(`Permission '${permissionName}' does not exist`);
        }
      }

      let finalPermissions = [...roleData.permissions];

      // Inherit permissions from parent role if specified
      if (roleData.inheritFrom) {
        const parentRole = await this.getRoleByName(roleData.inheritFrom);
        if (parentRole) {
          // Merge permissions, avoiding duplicates
          const inheritedPermissions = parentRole.permissions.filter(
            (p) => !finalPermissions.includes(p)
          );
          finalPermissions = [...finalPermissions, ...inheritedPermissions];
        }
      }

      const newRole = {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: finalPermissions,
        hierarchy: roleData.hierarchy,
        inheritFrom: roleData.inheritFrom || null,
        department: roleData.department || null,
        isSystemRole: false,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "roles"), newRole);

      return {
        id: docRef.id,
        ...newRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    }
  },

  // Get role by ID
  async getRole(id: string): Promise<Role | null> {
    try {
      const roleDoc = await getDoc(doc(db, "roles", id));

      if (!roleDoc.exists()) {
        return null;
      }

      const roleData = roleDoc.data();
      return {
        id: roleDoc.id,
        ...roleData,
        createdAt: roleData.createdAt
          ? roleData.createdAt.toDate()
          : new Date(),
        updatedAt: roleData.updatedAt
          ? roleData.updatedAt.toDate()
          : new Date(),
      } as Role;
    } catch (error) {
      console.error("Error getting role:", error);
      throw error;
    }
  },

  // Get role by name
  async getRoleByName(name: string): Promise<Role | null> {
    try {
      const roleQuery = query(
        collection(db, "roles"),
        where("name", "==", name),
        limit(1)
      );

      const snapshot = await getDocs(roleQuery);

      if (snapshot.empty) {
        return null;
      }

      const roleDoc = snapshot.docs[0];
      const roleData = roleDoc.data();

      return {
        id: roleDoc.id,
        ...roleData,
        createdAt: roleData.createdAt
          ? roleData.createdAt.toDate()
          : new Date(),
        updatedAt: roleData.updatedAt
          ? roleData.updatedAt.toDate()
          : new Date(),
      } as Role;
    } catch (error) {
      console.error("Error getting role by name:", error);
      throw error;
    }
  },

  // Update role
  async updateRole(id: string, updates: UpdateRoleData): Promise<void> {
    try {
      const role = await this.getRole(id);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.isSystemRole && updates.permissions) {
        throw new Error("Cannot modify permissions of system roles");
      }

      // Validate permissions exist if being updated
      if (updates.permissions) {
        for (const permissionName of updates.permissions) {
          const permission = await permissionService.getPermissionByName(
            permissionName
          );
          if (!permission) {
            throw new Error(`Permission '${permissionName}' does not exist`);
          }
        }
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "roles", id), updateData);
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  },

  // Delete role
  async deleteRole(id: string): Promise<void> {
    try {
      const role = await this.getRole(id);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.isSystemRole) {
        throw new Error("Cannot delete system roles");
      }

      // Check if any users are assigned to this role
      const assignments = await this.getUserRoleAssignments({ roleId: id });
      if (assignments.length > 0) {
        throw new Error("Cannot delete role that is assigned to users");
      }

      await deleteDoc(doc(db, "roles", id));
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  },

  // Get all roles with filters
  async getRoles(filters: RoleFilters = {}): Promise<Role[]> {
    try {
      let roleQuery = query(collection(db, "roles"));

      // Apply filters
      if (filters.department) {
        roleQuery = query(
          roleQuery,
          where("department", "==", filters.department)
        );
      }
      if (filters.isActive !== undefined) {
        roleQuery = query(roleQuery, where("isActive", "==", filters.isActive));
      }
      if (filters.isSystemRole !== undefined) {
        roleQuery = query(
          roleQuery,
          where("isSystemRole", "==", filters.isSystemRole)
        );
      }

      // Add ordering
      roleQuery = query(roleQuery, orderBy("hierarchy"), orderBy("name"));

      const snapshot = await getDocs(roleQuery);

      return snapshot.docs.map((doc) => {
        const roleData = doc.data();
        return {
          id: doc.id,
          ...roleData,
          createdAt: roleData.createdAt
            ? roleData.createdAt.toDate()
            : new Date(),
          updatedAt: roleData.updatedAt
            ? roleData.updatedAt.toDate()
            : new Date(),
        } as Role;
      });
    } catch (error) {
      console.error("Error getting roles:", error);
      throw error;
    }
  },

  // Get effective permissions for a role (including inherited)
  async getEffectivePermissions(roleId: string): Promise<string[]> {
    try {
      const role = await this.getRole(roleId);
      if (!role) {
        return [];
      }

      let permissions = [...role.permissions];

      // If role inherits from another role, get those permissions too
      if (role.inheritFrom) {
        const parentRole = await this.getRoleByName(role.inheritFrom);
        if (parentRole) {
          const parentPermissions = await this.getEffectivePermissions(
            parentRole.id!
          );
          // Merge without duplicates
          permissions = [...new Set([...permissions, ...parentPermissions])];
        }
      }

      return permissions;
    } catch (error) {
      console.error("Error getting effective permissions:", error);
      throw error;
    }
  },

  // Assign role to user
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date,
    notes?: string
  ): Promise<UserRoleAssignment> {
    try {
      const role = await this.getRole(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      // Check if user already has this role
      const existingAssignment = await this.getUserRoleAssignment(
        userId,
        roleId
      );
      if (existingAssignment && existingAssignment.isActive) {
        throw new Error("User already has this role assigned");
      }

      const assignment = {
        userId,
        roleId,
        roleName: role.name,
        assignedBy,
        assignedAt: serverTimestamp(),
        expiresAt: expiresAt || null,
        isActive: true,
        notes: notes || "",
      };

      const docRef = await addDoc(
        collection(db, "userRoleAssignments"),
        assignment
      );

      return {
        id: docRef.id,
        ...assignment,
        assignedAt: new Date(),
      } as UserRoleAssignment;
    } catch (error) {
      console.error("Error assigning role to user:", error);
      throw error;
    }
  },

  // Remove role from user
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      const assignment = await this.getUserRoleAssignment(userId, roleId);
      if (!assignment) {
        throw new Error("Role assignment not found");
      }

      await updateDoc(doc(db, "userRoleAssignments", assignment.id!), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing role from user:", error);
      throw error;
    }
  },

  // Get user role assignment
  async getUserRoleAssignment(
    userId: string,
    roleId: string
  ): Promise<UserRoleAssignment | null> {
    try {
      const assignmentQuery = query(
        collection(db, "userRoleAssignments"),
        where("userId", "==", userId),
        where("roleId", "==", roleId),
        where("isActive", "==", true),
        limit(1)
      );

      const snapshot = await getDocs(assignmentQuery);

      if (snapshot.empty) {
        return null;
      }

      const assignmentDoc = snapshot.docs[0];
      const assignmentData = assignmentDoc.data();

      return {
        id: assignmentDoc.id,
        ...assignmentData,
        assignedAt: assignmentData.assignedAt
          ? assignmentData.assignedAt.toDate()
          : new Date(),
        expiresAt: assignmentData.expiresAt
          ? assignmentData.expiresAt.toDate()
          : undefined,
      } as UserRoleAssignment;
    } catch (error) {
      console.error("Error getting user role assignment:", error);
      throw error;
    }
  },

  // Get user role assignments
  async getUserRoleAssignments(
    filters: { userId?: string; roleId?: string } = {}
  ): Promise<UserRoleAssignment[]> {
    try {
      let assignmentQuery = query(collection(db, "userRoleAssignments"));

      if (filters.userId) {
        assignmentQuery = query(
          assignmentQuery,
          where("userId", "==", filters.userId)
        );
      }
      if (filters.roleId) {
        assignmentQuery = query(
          assignmentQuery,
          where("roleId", "==", filters.roleId)
        );
      }

      assignmentQuery = query(
        assignmentQuery,
        where("isActive", "==", true),
        orderBy("assignedAt", "desc")
      );

      const snapshot = await getDocs(assignmentQuery);

      return snapshot.docs.map((doc) => {
        const assignmentData = doc.data();
        return {
          id: doc.id,
          ...assignmentData,
          assignedAt: assignmentData.assignedAt
            ? assignmentData.assignedAt.toDate()
            : new Date(),
          expiresAt: assignmentData.expiresAt
            ? assignmentData.expiresAt.toDate()
            : undefined,
        } as UserRoleAssignment;
      });
    } catch (error) {
      console.error("Error getting user role assignments:", error);
      throw error;
    }
  },

  // Get user permissions (from all assigned roles)
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const assignments = await this.getUserRoleAssignments({ userId });
      const allPermissions: string[] = [];

      for (const assignment of assignments) {
        // Check if assignment has expired
        if (assignment.expiresAt && assignment.expiresAt < new Date()) {
          continue;
        }

        const permissions = await this.getEffectivePermissions(
          assignment.roleId
        );
        allPermissions.push(...permissions);
      }

      // Remove duplicates and return
      return [...new Set(allPermissions)];
    } catch (error) {
      console.error("Error getting user permissions:", error);
      throw error;
    }
  },

  // Check if user has permission
  async userHasPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.includes(permissionName);
    } catch (error) {
      console.error("Error checking user permission:", error);
      return false;
    }
  },

  // Initialize default roles
  async initializeDefaultRoles(): Promise<void> {
    const defaultRoles: CreateRoleData[] = [
      {
        name: "admin",
        displayName: "System Administrator",
        description: "Full system access and administration capabilities",
        permissions: [
          "machine.read",
          "machine.write",
          "machine.delete",
          "machine.operate",
          "user.read",
          "user.write",
          "user.delete",
          "maintenance.read",
          "maintenance.write",
          "maintenance.approve",
          "alerts.read",
          "alerts.write",
          "alerts.resolve",
          "reports.read",
          "reports.generate",
          "tasks.read",
          "tasks.write",
          "system.admin",
        ],
        hierarchy: 1,
      },
      {
        name: "supervisor",
        displayName: "Supervisor",
        description: "Supervisory access with approval capabilities",
        permissions: [
          "machine.read",
          "machine.write",
          "machine.operate",
          "user.read",
          "maintenance.read",
          "maintenance.write",
          "maintenance.approve",
          "alerts.read",
          "alerts.write",
          "alerts.resolve",
          "reports.read",
          "reports.generate",
          "tasks.read",
          "tasks.write",
        ],
        hierarchy: 2,
      },
      {
        name: "operator",
        displayName: "Machine Operator",
        description: "Basic machine operation and monitoring",
        permissions: [
          "machine.read",
          "machine.operate",
          "maintenance.read",
          "alerts.read",
          "tasks.read",
          "tasks.write",
        ],
        hierarchy: 3,
      },
      {
        name: "maintenance",
        displayName: "Maintenance Technician",
        description: "Maintenance and repair capabilities",
        permissions: [
          "machine.read",
          "maintenance.read",
          "maintenance.write",
          "alerts.read",
          "alerts.resolve",
          "tasks.read",
          "tasks.write",
        ],
        hierarchy: 3,
      },
    ];

    try {
      for (const role of defaultRoles) {
        const existing = await this.getRoleByName(role.name);
        if (!existing) {
          const createdRole = await this.createRole(role);

          // Mark system roles
          await updateDoc(doc(db, "roles", createdRole.id!), {
            isSystemRole: true,
          });
        }
      }
    } catch (error) {
      console.error("Error initializing default roles:", error);
      throw error;
    }
  },

  // Clean up expired role assignments
  async cleanupExpiredAssignments(): Promise<number> {
    try {
      const now = new Date();
      const assignmentQuery = query(
        collection(db, "userRoleAssignments"),
        where("isActive", "==", true),
        where("expiresAt", "<=", now)
      );

      const snapshot = await getDocs(assignmentQuery);
      let cleanedCount = 0;

      for (const assignmentDoc of snapshot.docs) {
        await updateDoc(doc(db, "userRoleAssignments", assignmentDoc.id), {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
        cleanedCount++;
      }

      return cleanedCount;
    } catch (error) {
      console.error("Error cleaning up expired assignments:", error);
      throw error;
    }
  },
};

// ============================================
// COMBINED EXPORT
// ============================================

export const rolePermissionService = {
  permissions: permissionService,
  roles: roleService,

  // Initialize the entire role-permission system
  async initializeSystem(): Promise<void> {
    try {
      console.log("Initializing role-permission system...");

      // First initialize permissions
      await permissionService.initializeDefaultPermissions();
      console.log("Default permissions initialized");

      // Then initialize roles (which depend on permissions)
      await roleService.initializeDefaultRoles();
      console.log("Default roles initialized");

      console.log("Role-permission system initialization complete");
    } catch (error) {
      console.error("Error initializing role-permission system:", error);
      throw error;
    }
  },

  // Get comprehensive user access information
  async getUserAccessInfo(userId: string): Promise<{
    roles: Role[];
    permissions: string[];
    assignments: UserRoleAssignment[];
  }> {
    try {
      const assignments = await roleService.getUserRoleAssignments({ userId });
      const permissions = await roleService.getUserPermissions(userId);

      const roles: Role[] = [];
      for (const assignment of assignments) {
        const role = await roleService.getRole(assignment.roleId);
        if (role) {
          roles.push(role);
        }
      }

      return {
        roles,
        permissions,
        assignments,
      };
    } catch (error) {
      console.error("Error getting user access info:", error);
      throw error;
    }
  },
};
