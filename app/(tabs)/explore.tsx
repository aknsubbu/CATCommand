import { useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Import the TypeScript Firestore service and types
import FirestoreService, {
  CreateAlertData,
  CreateInspectionData,
  CreateMachineData,
  CreateOperatorData,
  CreateScheduledTaskData,
  CreateWorkOrderData,
  Machine,
  Operator
} from "@/services/FirestoreService";

import type { Alert as FirestoreAlert } from "@/services/FirestoreService";

interface TestButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
}

export default function TabTwoScreen(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<string>("");

  // Sample data creation functions with proper typing
  const createSampleOperator = async (): Promise<void> => {
    setLoading(true);
    try {
      const operatorData: CreateOperatorData = {
        name: "John Doe",
        employeeId: "EMP001",
        certifications: ["excavator", "safety"],
        trainingLevel: "intermediate",
        phoneNumber: "+1234567890",
        email: "john.doe@caterpillar.com",
        shift: "morning",
        status: "active",
        currentMachineId: null,
        lastLogin: FirestoreService.dateToTimestamp(new Date()),
        totalHours: 2400,
        safetyScore: 95,
        efficiencyRating: 87
      };

      const operatorId = await FirestoreService.createOperator(operatorData);
      setTestResults(`✅ Operator created with ID: ${operatorId}`);
      Alert.alert("Success", `Operator created with ID: ${operatorId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error creating operator: ${errorMessage}`);
      Alert.alert("Error", `Failed to create operator: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createSampleMachine = async (): Promise<void> => {
    setLoading(true);
    try {
      const machineData: CreateMachineData = {
        model: "CAT 336",
        serialNumber: "SN123456789",
        type: "excavator",
        currentOperatorId: null,
        status: "active",
        location: {
          lat: 37.7749,
          lng: -122.4194,
          timestamp: FirestoreService.dateToTimestamp(new Date())
        },
        engineHours: 1524.5,
        fuelLevel: 75,
        lastMaintenance: FirestoreService.dateToTimestamp(new Date(Date.now() - 86400000)), // Yesterday
        nextMaintenanceDue: FirestoreService.dateToTimestamp(new Date(Date.now() + 604800000)), // Next week
        specifications: {
          maxLoad: 2000,
          fuelCapacity: 400,
          operatingWeight: 36000
        },
        sensors: {
          temperature: 85,
          pressure: 45,
          vibration: 2.1
        }
      };

      const machineId = await FirestoreService.createMachine(machineData);
      setTestResults(`✅ Machine created with ID: ${machineId}`);
      Alert.alert("Success", `Machine created with ID: ${machineId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error creating machine: ${errorMessage}`);
      Alert.alert("Error", `Failed to create machine: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createSampleWorkOrder = async (): Promise<void> => {
    setLoading(true);
    try {
      const workOrderData: CreateWorkOrderData = {
        title: "Site Excavation - Phase 1",
        description: "Excavate foundation area for new building construction",
        priority: "high",
        status: "pending",
        assignedOperatorId: "temp_operator",
        assignedMachineId: "temp_machine",
        estimatedDuration: 480, // 8 hours
        actualDuration: null,
        location: {
          lat: 37.7849,
          lng: -122.4094,
          address: "Construction Site A, San Francisco, CA",
          geofenceRadius: 50
        },
        checkpoints: [
          {
            id: "checkpoint_1",
            name: "Start Position",
            location: { lat: 37.7849, lng: -122.4094 },
            completed: false,
            completedAt: null,
            gpsTagged: false
          },
          {
            id: "checkpoint_2",
            name: "Excavation Area",
            location: { lat: 37.7850, lng: -122.4095 },
            completed: false,
            completedAt: null,
            gpsTagged: false
          }
        ],
        scheduledStart: FirestoreService.dateToTimestamp(new Date(Date.now() + 86400000)), // Tomorrow
        scheduledEnd: FirestoreService.dateToTimestamp(new Date(Date.now() + 115200000)), // Tomorrow + 8 hours
        actualStart: null,
        actualEnd: null,
        createdBy: "supervisor_001"
      };

      const workOrderId = await FirestoreService.createWorkOrder(workOrderData);
      setTestResults(`✅ Work Order created with ID: ${workOrderId}`);
      Alert.alert("Success", `Work Order created with ID: ${workOrderId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error creating work order: ${errorMessage}`);
      Alert.alert("Error", `Failed to create work order: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createSampleAlert = async (): Promise<void> => {
    setLoading(true);
    try {
      const alertData: CreateAlertData = {
        type: "safety",
        severity: "warning",
        title: "High Engine Temperature",
        message: "Engine temperature is above normal operating range",
        machineId: "temp_machine",
        operatorId: "temp_operator",
        workOrderId: null,
        status: "active",
        location: {
          lat: 37.7749,
          lng: -122.4194
        },
        triggerData: {
          metric: "engine_temperature",
          value: 95,
          threshold: 90,
          unit: "celsius"
        },
        audioPlayed: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null
      };

      const alertId = await FirestoreService.createAlert(alertData);
      setTestResults(`✅ Alert created with ID: ${alertId}`);
      Alert.alert("Success", `Alert created with ID: ${alertId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error creating alert: ${errorMessage}`);
      Alert.alert("Error", `Failed to create alert: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createSampleInspection = async (): Promise<void> => {
    setLoading(true);
    try {
      const inspectionData: CreateInspectionData = {
        machineId: "temp_machine",
        operatorId: "temp_operator",
        type: "daily",
        status: "pending",
        checklist: {
          "safety_001": {
            name: "Seatbelt Check",
            category: "safety",
            required: true,
            status: "pending",
            notes: null,
            photo: null,
            timestamp: null
          },
          "mechanical_001": {
            name: "Hydraulic Fluid Level",
            category: "mechanical",
            required: true,
            status: "pending",
            notes: null,
            photo: null,
            timestamp: null
          },
          "fluid_001": {
            name: "Engine Oil Level",
            category: "fluid",
            required: true,
            status: "pending",
            notes: null,
            photo: null,
            timestamp: null
          }
        },
        overallResult: "pass",
        startTime: FirestoreService.dateToTimestamp(new Date()),
        endTime: null,
        notes: "",
        photos: [],
        signature: null
      };

      const inspectionId = await FirestoreService.createInspection(inspectionData);
      setTestResults(`✅ Inspection created with ID: ${inspectionId}`);
      Alert.alert("Success", `Inspection created with ID: ${inspectionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error creating inspection: ${errorMessage}`);
      Alert.alert("Error", `Failed to create inspection: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createSampleScheduledTask = async (): Promise<void> => {
    setLoading(true);
    try {
      const taskData: CreateScheduledTaskData = {
        operatorId: "temp_operator",
        machineId: "temp_machine",
        workOrderId: null,
        title: "Morning Equipment Check",
        description: "Complete daily pre-operation inspection",
        type: "inspection",
        priority: "high",
        status: "scheduled",
        estimatedDuration: 30,
        actualDuration: null,
        scheduledDate: FirestoreService.dateToTimestamp(new Date()),
        startTime: null,
        endTime: null,
        location: {
          lat: 37.7749,
          lng: -122.4194,
          address: "Equipment Yard A"
        },
        requirements: {
          seatbeltCheck: true,
          preInspection: true,
          specialCertification: null
        }
      };

      const taskId = await FirestoreService.createScheduledTask(taskData);
      setTestResults(`✅ Scheduled Task created with ID: ${taskId}`);
      Alert.alert("Success", `Scheduled Task created with ID: ${taskId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error creating scheduled task: ${errorMessage}`);
      Alert.alert("Error", `Failed to create scheduled task: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testReadOperations = async (): Promise<void> => {
    setLoading(true);
    try {
      let results = "📊 READ OPERATIONS TEST RESULTS:\n\n";
      
      // Test getting all operators
      const operators: Operator[] = await FirestoreService.getAll<Operator>('operators', { limitCount: 5 });
      results += `✅ Found ${operators.length} operators\n`;
      
      // Test getting all machines
      const machines: Machine[] = await FirestoreService.getAll<Machine>('machines', { limitCount: 5 });
      results += `✅ Found ${machines.length} machines\n`;
      
      // Test getting active alerts
      const alerts: Alert[] = await FirestoreService.getAll<Alert>('alerts', { limitCount: 5 });
      results += `✅ Found ${alerts.length} Alerts\n`;

      // const alerts: FirestoreAlert[] = await FirestoreService.getActiveAlerts();
      // results += `✅ Found ${alerts.length} active alerts\n`;
      
      setTestResults(results);
      Alert.alert("Read Operations Complete", results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error in read operations: ${errorMessage}`);
      Alert.alert("Error", `Failed read operations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateOperations = async (): Promise<void> => {
    setLoading(true);
    try {
      let results = "✏️ UPDATE OPERATIONS TEST RESULTS:\n\n";
      
      // Get first operator to test update
      const operators: Operator[] = await FirestoreService.getAll<Operator>('operators', { limitCount: 1 });
      if (operators.length > 0) {
        const operatorId = operators[0].id;
        await FirestoreService.updateOperatorStatus(operatorId, 'on_break');
        results += `✅ Updated operator ${operatorId} status to 'on_break'\n`;
      }
      
      // Get first machine to test update
      const machines: Machine[] = await FirestoreService.getAll<Machine>('machines', { limitCount: 1 });
      if (machines.length > 0) {
        const machineId = machines[0].id;
        await FirestoreService.updateMachineFuelLevel(machineId, 85);
        results += `✅ Updated machine ${machineId} fuel level to 85%\n`;
      }
      
      // Get first alert to test acknowledgment
      const alerts: FirestoreAlert[] = await FirestoreService.getActiveAlerts();
      if (alerts.length > 0) {
        const alertId = alerts[0].id;
        await FirestoreService.acknowledgeAlert(alertId, 'supervisor_001');
        results += `✅ Acknowledged alert ${alertId}\n`;
      }
      
      setTestResults(results);
      Alert.alert("Update Operations Complete", results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(`❌ Error in update operations: ${errorMessage}`);
      Alert.alert("Error", `Failed update operations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTestResults = (): void => {
    setTestResults("");
  };

  const TestButton: React.FC<TestButtonProps> = ({ title, onPress, color = "#007AFF" }) => (
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
    >
      <ThemedText style={styles.buttonText}>
        {loading ? "Loading..." : title}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">CAT Command - Test Suite</ThemedText>
      </ThemedView>

      <Collapsible title="🚀 Create Sample Data">
        <ThemedText style={styles.description}>
          Click the buttons below to create sample data in Firestore collections.
          This will test the CREATE operations of your CAT Command services.
        </ThemedText>
        
        <ThemedView style={styles.buttonContainer}>
          <TestButton title="Create Operator" onPress={createSampleOperator} color="#4CAF50" />
          <TestButton title="Create Machine" onPress={createSampleMachine} color="#2196F3" />
          <TestButton title="Create Work Order" onPress={createSampleWorkOrder} color="#FF9800" />
          <TestButton title="Create Alert" onPress={createSampleAlert} color="#F44336" />
          <TestButton title="Create Inspection" onPress={createSampleInspection} color="#9C27B0" />
          <TestButton title="Create Scheduled Task" onPress={createSampleScheduledTask} color="#607D8B" />
        </ThemedView>
      </Collapsible>

      <Collapsible title="📊 Test CRUD Operations">
        <ThemedText style={styles.description}>
          Test various READ and UPDATE operations on your Firestore data.
        </ThemedText>
        
        <ThemedView style={styles.buttonContainer}>
          <TestButton title="Test Read Operations" onPress={testReadOperations} color="#00BCD4" />
          <TestButton title="Test Update Operations" onPress={testUpdateOperations} color="#8BC34A" />
          <TestButton title="Clear Results" onPress={clearTestResults} color="#795548" />
        </ThemedView>
      </Collapsible>

      {testResults !== "" && (
        <Collapsible title="📋 Test Results">
          <ScrollView style={styles.resultsContainer}>
            <ThemedText style={styles.resultsText}>{testResults}</ThemedText>
          </ScrollView>
        </Collapsible>
      )}

      <Collapsible title="🔧 TypeScript Features">
        <ThemedText style={styles.description}>
          This implementation includes full TypeScript support:
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          ✅ <ThemedText type="defaultSemiBold">Strongly Typed:</ThemedText>{" "}
          All data models have proper TypeScript interfaces
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          📖 <ThemedText type="defaultSemiBold">Type Safety:</ThemedText>{" "}
          Compile-time error checking for all operations
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          ✏️ <ThemedText type="defaultSemiBold">IntelliSense:</ThemedText>{" "}
          Full IDE autocompletion and error detection
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          🎯 <ThemedText type="defaultSemiBold">Generic Methods:</ThemedText>{" "}
          Reusable CRUD operations with type inference
        </ThemedText>
      </Collapsible>

      <Collapsible title="🔧 Test Async Storage">
        <ThemedText>
          Press the button below to add a sample item to the offline queue and log all items to the console.
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <Button title="Run Async Storage Test" onPress={handleTestAsyncStorage} />
          <Button title="Clear Queue" onPress={handleClearQueue} color="red" />
        </ThemedView>
        
        {offlineQueue.length > 0 && (
          <ThemedView style={styles.queueContainer}>
            <ThemedText type="defaultSemiBold">Queue Items ({offlineQueue.length}):</ThemedText>
            {offlineQueue.map((item, index) => (
              <ThemedView key={item.id} style={styles.queueItem}>
                <ThemedText style={styles.queueItemText}>
                  {index + 1}. {item.type} - {item.priority} - {item.status}
                </ThemedText>
                <ThemedText style={styles.queueItemText}>
                  ID: {item.id}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </Collapsible>

      <Collapsible title="📊 Available Services">
        <ThemedText>
          The following TypeScript services are available:
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Operator Service:</ThemedText> Typed
          user management with status tracking
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Machine Service:</ThemedText>{" "}
          Equipment tracking with sensor data types
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Work Order Service:</ThemedText>{" "}
          Task management with checkpoint typing
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Alert Service:</ThemedText> Typed
          safety alerts with severity levels
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Inspection Service:</ThemedText>{" "}
          Strongly typed checklist management
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Offline Queue Service:</ThemedText>{" "}
          Typed offline synchronization
        </ThemedText>
      </Collapsible>

      <Collapsible title="🗄️ TypeScript Schema">
        <ThemedText>
          All Firestore collections have TypeScript interfaces:
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">Operator:</ThemedText> Interface with
          status unions and certification arrays
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">Machine:</ThemedText> Typed equipment
          with sensor data and location interfaces
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">WorkOrder:</ThemedText> Checkpoint
          arrays with GPS location typing
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">Alert:</ThemedText> Typed severity
          levels and trigger data interfaces
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">aiInteractions:</ThemedText> AI
          conversation history and feedback
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">roles:</ThemedText> Role
          definitions and permissions
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">permissions:</ThemedText> System
          permissions and access control
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold"></ThemedText> User session
          tracking
        </ThemedText>
      </Collapsible>

      <Collapsible title="📱 Original App Features">
        <ThemedText>
          This app includes example code to help you get started.
        </ThemedText>
        <ThemedText>
          This app has two screens:{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          and{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  queueContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  queueItem: {
    marginVertical: 4,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 4,
  },
  queueItemText: {
    fontSize: 12,
    opacity: 0.8,
  },
  serviceItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
  featureItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
  schemaItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  resultsContainer: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  resultsText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 16,
  },
});