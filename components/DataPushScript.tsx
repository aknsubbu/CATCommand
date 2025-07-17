import { alertService } from "@/services/alterService";
import { machineService } from "@/services/machineService";
import { maintenanceService } from "@/services/maintainenceService";
import { rolePermissionService } from "@/services/rolesAndPermission";
import { sessionService } from "@/services/sessionService";
import { userService } from "@/services/userService";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const DataPushScript: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const pushSampleData = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      addResult("🚀 Starting data push to all collections...");

      // 1. Initialize Role & Permission System
      addResult("📋 Initializing roles and permissions...");
      await rolePermissionService.initializeSystem();
      addResult("✅ Roles and permissions initialized");

      // 2. Create Users
      addResult("👥 Creating sample users...");

      const users = [
        {
          uid: "user-admin-001",
          email: "admin@caterpillar.com",
          displayName: "John Smith",
          role: "admin" as const,
          department: "IT Operations",
          shiftSchedule: {
            shift: "day" as const,
            startTime: "08:00",
            endTime: "17:00",
          },
        },
        {
          uid: "user-supervisor-001",
          email: "supervisor@caterpillar.com",
          displayName: "Sarah Johnson",
          role: "supervisor" as const,
          department: "Construction",
          shiftSchedule: {
            shift: "day" as const,
            startTime: "06:00",
            endTime: "14:00",
          },
        },
        {
          uid: "user-operator-001",
          email: "operator1@caterpillar.com",
          displayName: "Mike Wilson",
          role: "operator" as const,
          department: "Operations",
          shiftSchedule: {
            shift: "day" as const,
            startTime: "06:00",
            endTime: "14:00",
          },
        },
        {
          uid: "user-operator-002",
          email: "operator2@caterpillar.com",
          displayName: "Lisa Brown",
          role: "operator" as const,
          department: "Operations",
          shiftSchedule: {
            shift: "evening" as const,
            startTime: "14:00",
            endTime: "22:00",
          },
        },
        {
          uid: "user-maintenance-001",
          email: "maintenance@caterpillar.com",
          displayName: "David Garcia",
          role: "maintenance" as const,
          department: "Maintenance",
          shiftSchedule: {
            shift: "day" as const,
            startTime: "07:00",
            endTime: "15:00",
          },
        },
      ];

      for (const userData of users) {
        await userService.createUser(userData);
        addResult(
          `✅ Created user: ${userData.displayName} (${userData.role})`
        );
      }

      // 3. Create Machines
      addResult("🚜 Creating sample machines...");

      const machines = [
        {
          machineId: "CAT320-001",
          model: "CAT 320 Excavator",
          category: "excavator" as const,
          manufacturer: "Caterpillar" as const,
          serialNumber: "CAT320001ABC",
          yearManufactured: 2023,
          location: { site: "Main Construction Site", area: "Zone A" },
          specifications: {
            enginePower: "168 HP",
            operatingWeight: "20,000 kg",
            maxDigDepth: "6.5 m",
            maxReach: "9.9 m",
            bucketCapacity: "1.2 m³",
          },
          maintenanceSchedules: [
            {
              type: "daily" as const,
              intervalHours: 24,
              nextMaintenance: new Date(Date.now() + 24 * 60 * 60 * 1000),
              description: "Daily inspection and lubrication",
            },
          ],
          purchaseDate: new Date(2023, 0, 15),
        },
        {
          machineId: "CAT950-002",
          model: "CAT 950 Wheel Loader",
          category: "loader" as const,
          manufacturer: "Caterpillar" as const,
          serialNumber: "CAT950002DEF",
          yearManufactured: 2022,
          location: { site: "Main Construction Site", area: "Zone B" },
          specifications: {
            enginePower: "274 HP",
            operatingWeight: "17,200 kg",
            bucketCapacity: "3.1 m³",
            maxSpeed: "38 km/h",
            fuelCapacity: "285 L",
          },
          maintenanceSchedules: [],
          purchaseDate: new Date(2022, 5, 10),
        },
        {
          machineId: "CAT140-003",
          model: "CAT 140 Motor Grader",
          category: "grader" as const,
          manufacturer: "Caterpillar" as const,
          serialNumber: "CAT140003GHI",
          yearManufactured: 2023,
          location: { site: "Highway Project", area: "Section 1" },
          specifications: {
            enginePower: "205 HP",
            operatingWeight: "16,900 kg",
            bladeWidth: "3.7 m",
            maxSpeed: "43 km/h",
            gradeability: "30%",
          },
          maintenanceSchedules: [],
          purchaseDate: new Date(2023, 3, 20),
        },
      ];

      let machineIds: string[] = [];
      for (const machineData of machines) {
        const machine = await machineService.createMachine(machineData);
        machineIds.push(machine.id!);
        addResult(
          `✅ Created machine: ${machineData.model} (${machineData.machineId})`
        );
      }

      // 4. Create Sessions
      addResult("📱 Creating sample sessions...");

      const sessionData = [
        {
          userId: "user-operator-001",
          deviceInfo: sessionService.generateDeviceInfo(),
          ipAddress: "192.168.1.100",
          location: { country: "USA", region: "Illinois", city: "Peoria" },
        },
        {
          userId: "user-supervisor-001",
          deviceInfo: sessionService.generateDeviceInfo(),
          ipAddress: "192.168.1.101",
          location: { country: "USA", region: "Illinois", city: "Peoria" },
        },
      ];

      let sessionIds: string[] = [];
      for (const session of sessionData) {
        const createdSession = await sessionService.createSession(session);
        sessionIds.push(createdSession.sessionId);
        addResult(`✅ Created session for user: ${session.userId}`);
      }

      // 5. Create Alerts
      addResult("🚨 Creating sample alerts...");

      const alerts = [
        {
          machineId: machineIds[0],
          userId: "user-operator-001",
          title: "High Engine Temperature",
          description: "Engine temperature has exceeded normal operating range",
          severity: "high" as const,
          category: "temperature" as const,
          type: "automatic" as const,
          priority: "high" as const,
          location: { site: "Main Construction Site", area: "Zone A" },
          source: {
            component: "Engine",
            sensor: "Temperature Sensor",
            errorCode: "TEMP_HIGH_001",
          },
          alertData: {
            reading: 105,
            threshold: 95,
            unit: "°C",
            normalRange: { min: 70, max: 95 },
          },
          estimatedResolutionTime: 30,
        },
        {
          machineId: machineIds[1],
          userId: "user-operator-002",
          title: "Low Hydraulic Fluid",
          description: "Hydraulic fluid level is below minimum threshold",
          severity: "medium" as const,
          category: "hydraulic" as const,
          type: "automatic" as const,
          priority: "medium" as const,
          location: { site: "Main Construction Site", area: "Zone B" },
          source: {
            component: "Hydraulic System",
            sensor: "Fluid Level Sensor",
            errorCode: "HYD_LOW_002",
          },
          alertData: {
            reading: 15,
            threshold: 20,
            unit: "%",
            normalRange: { min: 20, max: 100 },
          },
          estimatedResolutionTime: 15,
        },
        {
          machineId: machineIds[2],
          title: "Scheduled Maintenance Due",
          description: "Routine maintenance is scheduled for this machine",
          severity: "low" as const,
          category: "maintenance" as const,
          type: "manual" as const,
          priority: "medium" as const,
          location: { site: "Highway Project", area: "Section 1" },
          source: {
            component: "Maintenance System",
            system: "Scheduling",
          },
          estimatedResolutionTime: 120,
        },
      ];

      let alertIds: string[] = [];
      for (const alertData of alerts) {
        const alert = await alertService.createAlert(alertData);
        alertIds.push(alert.id!);
        addResult(`✅ Created alert: ${alertData.title}`);
      }

      // 6. Create Maintenance Tasks
      addResult("🔧 Creating sample maintenance tasks...");

      const maintenanceTasks = [
        {
          machineId: machineIds[0],
          title: "Engine Oil Change",
          description:
            "Replace engine oil and filter as part of routine maintenance",
          type: "preventive" as const,
          category: "lubrication" as const,
          estimatedDuration: 2,
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          assignedTo: ["user-maintenance-001"],
          createdBy: "user-supervisor-001",
          checklist: [
            {
              description: "Warm up engine to operating temperature",
              photos: [],
            },
            { description: "Drain old engine oil", photos: [] },
            { description: "Replace oil filter", photos: [] },
            {
              description: "Install drain plug and refill with new oil",
              photos: [],
            },
            { description: "Check oil level and test for leaks", photos: [] },
          ],
          parts: [
            {
              partNumber: "OIL-15W40-20L",
              partName: "Engine Oil 15W-40",
              quantity: 20,
              unitCost: 8.5,
              supplier: "CAT Parts",
            },
            {
              partNumber: "FILTER-OIL-320",
              partName: "Oil Filter",
              quantity: 1,
              unitCost: 35.0,
              supplier: "CAT Parts",
            },
          ],
        },
        {
          machineId: machineIds[1],
          title: "Hydraulic System Inspection",
          description: "Inspect hydraulic system and top up fluid",
          type: "corrective" as const,
          category: "hydraulic" as const,
          estimatedDuration: 1,
          scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          assignedTo: ["user-maintenance-001"],
          createdBy: "user-supervisor-001",
          alertId: alertIds[1],
          checklist: [
            { description: "Check hydraulic fluid level", photos: [] },
            { description: "Inspect hydraulic lines for leaks", photos: [] },
            { description: "Top up hydraulic fluid", photos: [] },
            { description: "Test hydraulic system operation", photos: [] },
          ],
          parts: [
            {
              partNumber: "HYD-FLUID-20L",
              partName: "Hydraulic Fluid",
              quantity: 5,
              unitCost: 12.0,
              supplier: "CAT Parts",
            },
          ],
        },
        {
          machineId: machineIds[2],
          title: "Weekly Safety Inspection",
          description: "Comprehensive weekly safety and operational inspection",
          type: "inspection" as const,
          category: "inspection" as const,
          estimatedDuration: 1.5,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          assignedTo: ["user-maintenance-001", "user-supervisor-001"],
          createdBy: "user-supervisor-001",
          checklist: [
            { description: "Check all lights and warning devices", photos: [] },
            { description: "Inspect blade and cutting edge", photos: [] },
            { description: "Test steering and braking systems", photos: [] },
            { description: "Check tire condition and pressure", photos: [] },
            { description: "Verify all safety equipment present", photos: [] },
          ],
          parts: [],
        },
      ];

      let taskIds: string[] = [];
      for (const taskData of maintenanceTasks) {
        const task = await maintenanceService.createMaintenanceTask(taskData);
        taskIds.push(task.id!);
        addResult(`✅ Created maintenance task: ${taskData.title}`);
      }

      // 7. Create AI Interactions
      addResult("🤖 Creating sample AI interactions...");

      const interactions = [
        {
          userId: "user-operator-001",
          machineId: machineIds[0],
          sessionId: sessionIds[0],
          initialMessage:
            "The engine temperature warning light is on. What should I do?",
          context: {
            machineStatus: "operational",
            currentTask: "excavation",
            alertLevel: "high" as const,
            location: "Zone A",
            shift: "day",
          },
          category: "troubleshooting" as const,
          authContext: {
            sessionId: sessionIds[0],
            deviceInfo: "Mobile App - Android",
            ipAddress: "192.168.1.100",
          },
        },
        {
          userId: "user-operator-002",
          machineId: machineIds[1],
          sessionId: sessionIds[1],
          initialMessage: "How do I perform the daily inspection checklist?",
          context: {
            machineStatus: "idle",
            currentTask: "daily_inspection",
            alertLevel: "low" as const,
            location: "Zone B",
            shift: "evening",
          },
          category: "training" as const,
          authContext: {
            sessionId: sessionIds[1],
            deviceInfo: "Tablet - iPad",
            ipAddress: "192.168.1.101",
          },
        },
        {
          userId: "user-maintenance-001",
          sessionId: "maintenance-session-001",
          initialMessage:
            "I need the maintenance procedure for hydraulic fluid replacement.",
          context: {
            currentTask: "maintenance",
            alertLevel: "medium" as const,
            location: "Maintenance Bay",
            shift: "day",
          },
          category: "maintenance" as const,
          authContext: {
            sessionId: "maintenance-session-001",
            deviceInfo: "Desktop - Chrome",
            ipAddress: "192.168.1.102",
          },
        },
      ];

      for (const interactionData of interactions) {
        const interaction = await aiInteractionService.createInteraction(
          interactionData
        );

        // Add some follow-up messages to make it realistic
        await aiInteractionService.addMessage(
          interaction.id!,
          "assistant",
          "I understand your concern. Let me help you with that...",
          { confidence: 0.95, processingTime: 250 }
        );

        addResult(
          `✅ Created AI interaction: ${interactionData.initialMessage.substring(
            0,
            50
          )}...`
        );
      }

      addResult("🎉 Successfully pushed sample data to all collections!");
      addResult(
        `📊 Summary: ${users.length} users, ${machines.length} machines, ${alerts.length} alerts, ${maintenanceTasks.length} tasks, ${interactions.length} AI interactions`
      );

      Alert.alert(
        "Success!",
        "Sample data has been successfully pushed to all collections. Check your Firestore console to see the data."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      addResult(`❌ Error: ${errorMessage}`);
      Alert.alert("Error", `Failed to push data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Data Push Script</Text>
        <Text style={styles.subtitle}>
          Add sample data to all Firestore collections
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.pushButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={pushSampleData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "⏳ Pushing Data..." : "🚀 Push Sample Data"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dataInfo}>
        <Text style={styles.infoTitle}>📋 Data to be created:</Text>
        <Text style={styles.infoItem}>
          • 5 Users (Admin, Supervisor, 2 Operators, Maintenance)
        </Text>
        <Text style={styles.infoItem}>
          • 3 Machines (Excavator, Loader, Grader)
        </Text>
        <Text style={styles.infoItem}>
          • 3 Alerts (Temperature, Hydraulic, Maintenance)
        </Text>
        <Text style={styles.infoItem}>
          • 3 Maintenance Tasks (Oil change, Inspection, Safety)
        </Text>
        <Text style={styles.infoItem}>
          • 3 AI Interactions (Troubleshooting, Training, Maintenance)
        </Text>
        <Text style={styles.infoItem}>• 2 User Sessions</Text>
        <Text style={styles.infoItem}>
          • Complete Roles & Permissions setup
        </Text>
      </View>

      {results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>📊 Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    margin: 8,
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  pushButton: {
    backgroundColor: "#4CAF50",
  },
  clearButton: {
    backgroundColor: "#FF5722",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  dataInfo: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  infoItem: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
    marginLeft: 8,
  },
  resultsContainer: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  resultItem: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
    paddingLeft: 8,
    fontFamily: "monospace",
  },
});
