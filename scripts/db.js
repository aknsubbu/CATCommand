// Enhanced User Management System for Caterpillar Smart Assistant

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged 
  } from 'firebase/auth';
  import { 
    doc, 
    getDoc, 
    setDoc, 
    query, 
    where, 
    collection, 
    getDocs 
  } from 'firebase/firestore';
  
  // ============================================
  // ENHANCED USER SCHEMA
  // ============================================
  
  /*
  Enhanced Firestore Collections Structure:
  
  /users/{userId} (Firebase Auth UID)
    - uid: string (Firebase Auth UID)
    - email: string
    - displayName: string
    - role: string (admin, supervisor, operator, maintenance)
    - permissions: array
    - employeeId: string (legacy support)
    - department: string
    - shiftSchedule: object
    - lastLogin: timestamp
    - isActive: boolean
    - createdAt: timestamp
    - updatedAt: timestamp
  
  /users/{userId}/sessions/{sessionId}
    - deviceInfo: object
    - ipAddress: string
    - loginTime: timestamp
    - logoutTime: timestamp
    - isActive: boolean
  
  /userRoles/{roleId}
    - name: string
    - permissions: array
    - description: string
    - createdAt: timestamp
  
  /userPermissions/{permissionId}
    - name: string
    - resource: string
    - actions: array (read, write, delete, execute)
    - description: string
  */
  
  // ============================================
  // USER MANAGEMENT CLASS
  // ============================================
  
  export class UserManager {
    constructor(auth, db) {
      this.auth = auth;
      this.db = db;
      this.currentUser = null;
      this.userProfile = null;
      
      // Listen for authentication state changes
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.currentUser = user;
          this.loadUserProfile(user.uid);
        } else {
          this.currentUser = null;
          this.userProfile = null;
        }
      });
    }
  
    // ============================================
    // AUTHENTICATION METHODS
    // ============================================
  
    async signIn(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        
        // Create/update user session
        await this.createSession(user.uid);
        
        // Update last login
        await this.updateLastLogin(user.uid);
        
        return { success: true, user };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  
    async signOut() {
      try {
        if (this.currentUser) {
          await this.endSession(this.currentUser.uid);
        }
        await signOut(this.auth);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // USER PROFILE METHODS
    // ============================================
  
    async loadUserProfile(userId) {
      try {
        const userDoc = await getDoc(doc(this.db, 'users', userId));
        if (userDoc.exists()) {
          this.userProfile = userDoc.data();
          return this.userProfile;
        }
        return null;
      } catch (error) {
        console.error('Error loading user profile:', error);
        return null;
      }
    }
  
    async createUserProfile(userId, profileData) {
      const userProfile = {
        uid: userId,
        email: profileData.email,
        displayName: profileData.displayName || '',
        role: profileData.role || 'operator',
        permissions: await this.getRolePermissions(profileData.role || 'operator'),
        employeeId: profileData.employeeId || `EMP-${Date.now()}`,
        department: profileData.department || 'Operations',
        shiftSchedule: profileData.shiftSchedule || {
          shift: 'day',
          startTime: '06:00',
          endTime: '14:00'
        },
        lastLogin: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      try {
        await setDoc(doc(this.db, 'users', userId), userProfile);
        this.userProfile = userProfile;
        return { success: true, profile: userProfile };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  
    async updateUserProfile(userId, updates) {
      try {
        const userRef = doc(this.db, 'users', userId);
        const updateData = {
          ...updates,
          updatedAt: new Date()
        };
        
        await setDoc(userRef, updateData, { merge: true });
        
        if (this.currentUser?.uid === userId) {
          this.userProfile = { ...this.userProfile, ...updateData };
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  
    // ============================================
    // PERMISSION METHODS
    // ============================================
  
    async getRolePermissions(roleName) {
      const rolePermissions = {
        admin: [
          'machine.read', 'machine.write', 'machine.delete',
          'user.read', 'user.write', 'user.delete',
          'maintenance.read', 'maintenance.write', 'maintenance.approve',
          'alerts.read', 'alerts.write', 'alerts.resolve',
          'reports.read', 'reports.generate'
        ],
        supervisor: [
          'machine.read', 'machine.write',
          'user.read',
          'maintenance.read', 'maintenance.write', 'maintenance.approve',
          'alerts.read', 'alerts.resolve',
          'reports.read', 'reports.generate'
        ],
        operator: [
          'machine.read',
          'maintenance.read',
          'alerts.read',
          'tasks.read', 'tasks.write'
        ],
        maintenance: [
          'machine.read',
          'maintenance.read', 'maintenance.write',
          'alerts.read', 'alerts.resolve',
          'tasks.read', 'tasks.write'
        ]
      };
  
      return rolePermissions[roleName] || rolePermissions.operator;
    }
  
    hasPermission(permission) {
      if (!this.userProfile) return false;
      return this.userProfile.permissions.includes(permission);
    }
  
    canAccessMachine(machineId) {
      if (!this.userProfile) return false;
      
      // Admins and supervisors can access all machines
      if (['admin', 'supervisor'].includes(this.userProfile.role)) {
        return true;
      }
      
      // Operators can only access their assigned machines
      // This would need to be checked against machine assignments
      return this.hasPermission('machine.read');
    }
  
    // ============================================
    // SESSION MANAGEMENT
    // ============================================
  
    async createSession(userId) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionData = {
        deviceInfo: this.getDeviceInfo(),
        ipAddress: await this.getClientIP(),
        loginTime: new Date(),
        logoutTime: null,
        isActive: true
      };
  
      try {
        await setDoc(doc(this.db, 'users', userId, 'sessions', sessionId), sessionData);
        return sessionId;
      } catch (error) {
        console.error('Error creating session:', error);
        return null;
      }
    }
  
    async endSession(userId) {
      try {
        // Get active sessions
        const sessionsQuery = query(
          collection(this.db, 'users', userId, 'sessions'),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(sessionsQuery);
        
        // End all active sessions
        const promises = snapshot.docs.map(sessionDoc => 
          setDoc(doc(this.db, 'users', userId, 'sessions', sessionDoc.id), {
            logoutTime: new Date(),
            isActive: false
          }, { merge: true })
        );
        
        await Promise.all(promises);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  
    async updateLastLogin(userId) {
      try {
        await setDoc(doc(this.db, 'users', userId), {
          lastLogin: new Date(),
          updatedAt: new Date()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating last login:', error);
      }
    }
  
    // ============================================
    // UTILITY METHODS
    // ============================================
  
    getDeviceInfo() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  
    async getClientIP() {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        return 'unknown';
      }
    }
  
    getCurrentUser() {
      return this.currentUser;
    }
  
    getCurrentUserProfile() {
      return this.userProfile;
    }
  
    isAuthenticated() {
      return this.currentUser !== null;
    }
  
    // ============================================
    // MACHINE ASSIGNMENT METHODS
    // ============================================
  
    async assignMachineToUser(userId, machineId) {
      if (!this.hasPermission('machine.write')) {
        throw new Error('Insufficient permissions');
      }
  
      try {
        // Update machine with operator assignment
        await setDoc(doc(this.db, 'machines', machineId), {
          operatorId: userId,
          updatedAt: new Date()
        }, { merge: true });
  
        // Update user's assigned machines
        const userDoc = await getDoc(doc(this.db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const assignedMachines = userData.assignedMachines || [];
          
          if (!assignedMachines.includes(machineId)) {
            assignedMachines.push(machineId);
            await setDoc(doc(this.db, 'users', userId), {
              assignedMachines,
              updatedAt: new Date()
            }, { merge: true });
          }
        }
  
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  
    async getUserMachines(userId) {
      try {
        const machinesQuery = query(
          collection(this.db, 'machines'),
          where('operatorId', '==', userId)
        );
        
        const snapshot = await getDocs(machinesQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching user machines:', error);
        return [];
      }
    }
  }
  
  // ============================================
  // ENHANCED SYNTHETIC DATA GENERATOR
  // ============================================
  
  export class EnhancedSyntheticDataGenerator extends SyntheticDataGenerator {
    generateEnhancedOperator() {
      const roles = ['admin', 'supervisor', 'operator', 'maintenance'];
      const departments = ['Operations', 'Maintenance', 'Safety', 'Logistics'];
      const shifts = [
        { shift: 'day', startTime: '06:00', endTime: '14:00' },
        { shift: 'evening', startTime: '14:00', endTime: '22:00' },
        { shift: 'night', startTime: '22:00', endTime: '06:00' }
      ];
  
      const role = faker.helpers.arrayElement(roles);
      const uid = faker.string.uuid();
      
      return {
        uid: uid,
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
        role: role,
        permissions: [], // Will be populated by UserManager
        employeeId: `EMP-${faker.string.alphanumeric(6).toUpperCase()}`,
        department: faker.helpers.arrayElement(departments),
        shiftSchedule: faker.helpers.arrayElement(shifts),
        lastLogin: faker.date.recent({ days: 7 }),
        isActive: faker.datatype.boolean(0.9),
        assignedMachines: [],
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent({ days: 30 })
      };
    }
  
    generateAIInteractionWithAuth(machineId, userId) {
      const interaction = super.generateAIInteraction(machineId, userId);
      
      // Add authentication context
      return {
        ...interaction,
        userId: userId, // Use Firebase Auth UID
        operatorId: userId, // Keep legacy field for compatibility
        authContext: {
          sessionId: `session_${faker.string.alphanumeric(10)}`,
          deviceInfo: faker.helpers.arrayElement([
            'Mobile App - iOS',
            'Mobile App - Android',
            'Desktop - Chrome',
            'Tablet - Safari'
          ]),
          ipAddress: faker.internet.ip()
        }
      };
    }
  }
  
  // ============================================
  // USAGE EXAMPLE
  // ============================================
  
  /*
  // Initialize user management
  const auth = getAuth();
  const userManager = new UserManager(auth, db);
  
  // Sign in user
  const loginResult = await userManager.signIn('operator@caterpillar.com', 'password123');
  
  if (loginResult.success) {
    // Check permissions
    if (userManager.hasPermission('machine.read')) {
      // Get user's assigned machines
      const machines = await userManager.getUserMachines(loginResult.user.uid);
      console.log('User machines:', machines);
    }
  }
  
  // Assign machine to user (admin only)
  if (userManager.hasPermission('machine.write')) {
    await userManager.assignMachineToUser('user123', 'CAT320-ABC123');
  }
  */