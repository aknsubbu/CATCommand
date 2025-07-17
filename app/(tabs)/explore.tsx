import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Button,
  TextInput,
} from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Import the Firestore service and types
import FirestoreService, {
  Operator,
  Machine,
  WorkOrder,
  ScheduledTask,
  Inspection,
  Alert as FirestoreAlert,
  OfflineQueueItem,
  TrackingData,
  EfficiencyMetrics,
} from "@/services/FirestoreService";

interface TestButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

interface TestResult {
  operation: string;
  status: "success" | "error";
  message: string;
  timestamp: Date;
}

export default function ExploreScreen(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");

  // Helper function to add test result
  const addTestResult = (
    operation: string,
    status: "success" | "error",
    message: string
  ) => {
    const result: TestResult = {
      operation,
      status,
      message,
      timestamp: new Date(),
    };
    setTestResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // Helper function to handle async operations
  const handleAsyncOperation = async (
    operationName: string,
    operation: () => Promise<any>
  ) => {
    setLoading(true);
    try {
      const result = await operation();
      const message =
        typeof result === "string"
          ? result
          : typeof result === "object"
          ? `Success: ${JSON.stringify(result).slice(0, 100)}...`
          : "Operation completed successfully";
      addTestResult(operationName, "success", message);
      Alert.alert("Success", message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addTestResult(operationName, "error", errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ===== OPERATOR OPERATIONS =====
  const createSampleOperator = () =>
    handleAsyncOperation("Create Operator", async () => {
      const operatorData = {
        employeeId: `EMP${Date.now()}`,
        name: "John Doe",
        email: "john.doe@example.com",
        status: "active" as const,
        skills: ["excavator", "safety"],
        certifications: ["basic", "advanced"],
        contactInfo: {
          phone: "+1234567890",
          emergencyContact: "+0987654321",
        },
      };
      const id = await FirestoreService.createOperator(operatorData);
      setSelectedOperatorId(id);
      return `Operator created with ID: ${id}`;
    });

  const getOperator = () =>
    handleAsyncOperation("Get Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      const operator = await FirestoreService.getOperator(selectedOperatorId);
      return operator
        ? `Found operator: ${operator.name}`
        : "Operator not found";
    });

  const updateOperatorStatus = () =>
    handleAsyncOperation("Update Operator Status", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      await FirestoreService.updateOperatorStatus(
        selectedOperatorId,
        "on_break"
      );
      return "Operator status updated to on_break";
    });

  const getOperatorByEmployeeId = () =>
    handleAsyncOperation("Get Operator by Employee ID", async () => {
      const operator = await FirestoreService.getOperatorByEmployeeId("EMP001");
      return operator
        ? `Found operator: ${operator.name}`
        : "Operator not found";
    });

  // ===== MACHINE OPERATIONS =====
  const createSampleMachine = () =>
    handleAsyncOperation("Create Machine", async () => {
      const machineData = {
        serialNumber: `SN${Date.now()}`,
        model: "CAT 336",
        type: "excavator",
        status: "active" as const,
        fuelLevel: 75,
        maintenanceSchedule: {
          lastMaintenance: FirestoreService.dateToTimestamp(
            new Date(Date.now() - 86400000)
          ),
          nextMaintenance: FirestoreService.dateToTimestamp(
            new Date(Date.now() + 604800000)
          ),
        },
        specifications: {
          maxSpeed: 50,
          capacity: 2000,
          fuelCapacity: 400,
        },
      };
      const id = await FirestoreService.createMachine(machineData);
      setSelectedMachineId(id);
      return `Machine created with ID: ${id}`;
    });

  const getMachine = () =>
    handleAsyncOperation("Get Machine", async () => {
      if (!selectedMachineId) throw new Error("No machine selected");
      const machine = await FirestoreService.getMachine(selectedMachineId);
      return machine ? `Found machine: ${machine.model}` : "Machine not found";
    });

  const updateMachineFuelLevel = () =>
    handleAsyncOperation("Update Machine Fuel Level", async () => {
      if (!selectedMachineId) throw new Error("No machine selected");
      await FirestoreService.updateMachineFuelLevel(selectedMachineId, 85);
      return "Machine fuel level updated to 85%";
    });

  const updateMachineLocation = () =>
    handleAsyncOperation("Update Machine Location", async () => {
      if (!selectedMachineId) throw new Error("No machine selected");
      await FirestoreService.updateMachineLocation(selectedMachineId, {
        latitude: 37.7749,
        longitude: -122.4194,
      });
      return "Machine location updated";
    });

  const getMachinesByStatus = () =>
    handleAsyncOperation("Get Machines by Status", async () => {
      const machines = await FirestoreService.getMachinesByStatus("active");
      return `Found ${machines.length} active machines`;
    });

  const getAvailableMachines = () =>
    handleAsyncOperation("Get Available Machines", async () => {
      const machines = await FirestoreService.getAvailableMachines();
      return `Found ${machines.length} available machines`;
    });

  const assignMachineToOperator = () =>
    handleAsyncOperation("Assign Machine to Operator", async () => {
      if (!selectedOperatorId || !selectedMachineId) {
        throw new Error("Both operator and machine must be selected");
      }
      await FirestoreService.assignMachineToOperator(
        selectedOperatorId,
        selectedMachineId
      );
      return "Machine assigned to operator successfully";
    });

  // ===== WORK ORDER OPERATIONS =====
  const createSampleWorkOrder = () =>
    handleAsyncOperation("Create Work Order", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");

      const workOrderData = {
        title: "Site Excavation - Phase 1",
        description: "Excavate foundation area for new building construction",
        priority: "high" as const,
        status: "pending" as const,
        assignedOperatorId: selectedOperatorId,
        assignedMachineId: selectedMachineId,
        scheduledStart: FirestoreService.dateToTimestamp(
          new Date(Date.now() + 86400000)
        ),
        scheduledEnd: FirestoreService.dateToTimestamp(
          new Date(Date.now() + 115200000)
        ),
        checkpoints: [
          {
            id: "checkpoint_1",
            description: "Start Position",
            completed: false,
            gpsTagged: false,
          },
        ],
        location: {
          latitude: 37.7849,
          longitude: -122.4094,
          timestamp: FirestoreService.dateToTimestamp(new Date()),
        },
        estimatedDuration: 480,
      };

      const id = await FirestoreService.createWorkOrder(workOrderData);
      setSelectedWorkOrderId(id);
      return `Work Order created with ID: ${id}`;
    });

  const getWorkOrder = () =>
    handleAsyncOperation("Get Work Order", async () => {
      if (!selectedWorkOrderId) throw new Error("No work order selected");
      const workOrder = await FirestoreService.getWorkOrder(
        selectedWorkOrderId
      );
      return workOrder
        ? `Found work order: ${workOrder.title}`
        : "Work order not found";
    });

  const getWorkOrdersByOperator = () =>
    handleAsyncOperation("Get Work Orders by Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      const workOrders = await FirestoreService.getWorkOrdersByOperator(
        selectedOperatorId
      );
      return `Found ${workOrders.length} work orders for operator`;
    });

  const getActiveWorkOrders = () =>
    handleAsyncOperation("Get Active Work Orders", async () => {
      const workOrders = await FirestoreService.getActiveWorkOrders();
      return `Found ${workOrders.length} active work orders`;
    });

  const updateWorkOrderStatus = () =>
    handleAsyncOperation("Update Work Order Status", async () => {
      if (!selectedWorkOrderId) throw new Error("No work order selected");
      await FirestoreService.updateWorkOrderStatus(
        selectedWorkOrderId,
        "in_progress"
      );
      return "Work order status updated to in_progress";
    });

  const updateCheckpointStatus = () =>
    handleAsyncOperation("Update Checkpoint Status", async () => {
      if (!selectedWorkOrderId) throw new Error("No work order selected");
      await FirestoreService.updateCheckpointStatus(
        selectedWorkOrderId,
        "checkpoint_1",
        true,
        true
      );
      return "Checkpoint status updated";
    });

  // ===== SCHEDULED TASK OPERATIONS =====
  const createSampleScheduledTask = () =>
    handleAsyncOperation("Create Scheduled Task", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");

      const taskData = {
        title: "Morning Equipment Check",
        description: "Complete daily pre-operation inspection",
        operatorId: selectedOperatorId,
        scheduledDate: FirestoreService.dateToTimestamp(new Date()),
        status: "pending" as const,
        taskType: "inspection" as const,
        priority: "high" as const,
        estimatedDuration: 30,
      };

      const id = await FirestoreService.createScheduledTask(taskData);
      return `Scheduled Task created with ID: ${id}`;
    });

  const getTasksByOperator = () =>
    handleAsyncOperation("Get Tasks by Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      const tasks = await FirestoreService.getTasksByOperator(
        selectedOperatorId,
        new Date()
      );
      return `Found ${tasks.length} tasks for operator today`;
    });

  // ===== INSPECTION OPERATIONS =====
  const createSampleInspection = () =>
    handleAsyncOperation("Create Inspection", async () => {
      if (!selectedOperatorId || !selectedMachineId) {
        throw new Error("Both operator and machine must be selected");
      }

      const inspectionData = {
        operatorId: selectedOperatorId,
        machineId: selectedMachineId,
        type: "daily" as const,
        status: "pending" as const,
        startTime: FirestoreService.dateToTimestamp(new Date()),
        checklist: {
          safety_001: {
            id: "safety_001",
            description: "Seatbelt Check",
            status: "pending" as const,
          },
          fluid_001: {
            id: "fluid_001",
            description: "Engine Oil Level",
            status: "pending" as const,
          },
        },
      };

      const id = await FirestoreService.createInspection(inspectionData);
      return `Inspection created with ID: ${id}`;
    });

  // ===== ALERT OPERATIONS =====
  const createSampleAlert = () =>
    handleAsyncOperation("Create Alert", async () => {
      const alertData = {
        type: "warning" as const,
        title: "High Engine Temperature",
        message: "Engine temperature is above normal operating range",
        operatorId: selectedOperatorId,
        machineId: selectedMachineId,
        priority: "high" as const,
        status: "active" as const,
        audioPlayed: false,
      };

      const id = await FirestoreService.createAlert(alertData);
      return `Alert created with ID: ${id}`;
    });

  const getActiveAlerts = () =>
    handleAsyncOperation("Get Active Alerts", async () => {
      const alerts = await FirestoreService.getActiveAlerts();
      return `Found ${alerts.length} active alerts`;
    });

  const getActiveAlertsForOperator = () =>
    handleAsyncOperation("Get Active Alerts for Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      const alerts = await FirestoreService.getActiveAlerts(selectedOperatorId);
      return `Found ${alerts.length} active alerts for operator`;
    });

  // ===== OFFLINE QUEUE OPERATIONS =====
  const addToOfflineQueue = () =>
    handleAsyncOperation("Add to Offline Queue", async () => {
      const queueData = {
        action: "create" as const,
        collection: "testCollection",
        data: { test: "data" },
        priority: 1,
      };

      const id = await FirestoreService.addToOfflineQueue(queueData);
      return `Added to offline queue with ID: ${id}`;
    });

  const getPendingOfflineItems = () =>
    handleAsyncOperation("Get Pending Offline Items", async () => {
      const items = await FirestoreService.getPendingOfflineItems();
      return `Found ${items.length} pending offline items`;
    });

  // ===== BATCH OPERATIONS =====
  const testBatchCreate = () =>
    handleAsyncOperation("Batch Create Operators", async () => {
      const operators = [
        {
          employeeId: `BATCH1_${Date.now()}`,
          name: "Batch Operator 1",
          email: "batch1@example.com",
          status: "active" as const,
          skills: ["excavator"],
          certifications: ["basic"],
          contactInfo: {
            phone: "+1111111111",
            emergencyContact: "+2222222222",
          },
        },
        {
          employeeId: `BATCH2_${Date.now()}`,
          name: "Batch Operator 2",
          email: "batch2@example.com",
          status: "active" as const,
          skills: ["crane"],
          certifications: ["advanced"],
          contactInfo: {
            phone: "+3333333333",
            emergencyContact: "+4444444444",
          },
        },
      ];

      const ids = await FirestoreService.batchCreate(
        FirestoreService.collections.OPERATORS,
        operators
      );
      return `Batch created ${ids.length} operators`;
    });

  // ===== GENERIC OPERATIONS =====
  const getAllOperators = () =>
    handleAsyncOperation("Get All Operators", async () => {
      const operators = await FirestoreService.getAll<Operator>(
        FirestoreService.collections.OPERATORS,
        {
          limitCount: 10,
        }
      );
      return `Found ${operators.length} operators`;
    });

  const getAllMachines = () =>
    handleAsyncOperation("Get All Machines", async () => {
      const machines = await FirestoreService.getAll<Machine>(
        FirestoreService.collections.MACHINES,
        {
          limitCount: 10,
        }
      );
      return `Found ${machines.length} machines`;
    });

  const clearTestResults = () => {
    setTestResults([]);
    Alert.alert("Success", "Test results cleared");
  };

  const TestButton: React.FC<TestButtonProps> = ({
    title,
    onPress,
    color = "#007AFF",
    disabled = false,
  }) => (
    <TouchableOpacity
      style={[
        styles.testButton,
        { backgroundColor: disabled ? "#CCCCCC" : color },
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <ThemedText style={styles.buttonText}>
        {loading ? "Loading..." : title}
      </ThemedText>
    </TouchableOpacity>
  );

  const InputField: React.FC<{
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
  }> = ({ placeholder, value, onChangeText }) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
    />
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="hammer.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Firestore Service Test Suite</ThemedText>
      </ThemedView>

      <Collapsible title="🔧 Test Configuration">
        <ThemedText style={styles.description}>
          Set IDs for testing operations that require existing documents:
        </ThemedText>
        <ThemedView style={styles.inputContainer}>
          <InputField
            placeholder="Selected Operator ID"
            value={selectedOperatorId}
            onChangeText={setSelectedOperatorId}
          />
          <InputField
            placeholder="Selected Machine ID"
            value={selectedMachineId}
            onChangeText={setSelectedMachineId}
          />
          <InputField
            placeholder="Selected Work Order ID"
            value={selectedWorkOrderId}
            onChangeText={setSelectedWorkOrderId}
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="👥 Operator Operations">
        <ThemedText style={styles.description}>
          Test all operator-related Firestore operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Create Operator"
            onPress={createSampleOperator}
            color="#4CAF50"
          />
          <TestButton
            title="Get Operator"
            onPress={getOperator}
            color="#2196F3"
            disabled={!selectedOperatorId}
          />
          <TestButton
            title="Update Status"
            onPress={updateOperatorStatus}
            color="#FF9800"
            disabled={!selectedOperatorId}
          />
          <TestButton
            title="Get by Employee ID"
            onPress={getOperatorByEmployeeId}
            color="#9C27B0"
          />
          <TestButton
            title="Get All Operators"
            onPress={getAllOperators}
            color="#607D8B"
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="🚜 Machine Operations">
        <ThemedText style={styles.description}>
          Test all machine-related Firestore operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Create Machine"
            onPress={createSampleMachine}
            color="#4CAF50"
          />
          <TestButton
            title="Get Machine"
            onPress={getMachine}
            color="#2196F3"
            disabled={!selectedMachineId}
          />
          <TestButton
            title="Update Fuel Level"
            onPress={updateMachineFuelLevel}
            color="#FF9800"
            disabled={!selectedMachineId}
          />
          <TestButton
            title="Update Location"
            onPress={updateMachineLocation}
            color="#9C27B0"
            disabled={!selectedMachineId}
          />
          <TestButton
            title="Get by Status"
            onPress={getMachinesByStatus}
            color="#607D8B"
          />
          <TestButton
            title="Get Available"
            onPress={getAvailableMachines}
            color="#795548"
          />
          <TestButton
            title="Assign to Operator"
            onPress={assignMachineToOperator}
            color="#E91E63"
            disabled={!selectedOperatorId || !selectedMachineId}
          />
          <TestButton
            title="Get All Machines"
            onPress={getAllMachines}
            color="#00BCD4"
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="📋 Work Order Operations">
        <ThemedText style={styles.description}>
          Test all work order-related Firestore operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Create Work Order"
            onPress={createSampleWorkOrder}
            color="#4CAF50"
            disabled={!selectedOperatorId}
          />
          <TestButton
            title="Get Work Order"
            onPress={getWorkOrder}
            color="#2196F3"
            disabled={!selectedWorkOrderId}
          />
          <TestButton
            title="Get by Operator"
            onPress={getWorkOrdersByOperator}
            color="#FF9800"
            disabled={!selectedOperatorId}
          />
          <TestButton
            title="Get Active Orders"
            onPress={getActiveWorkOrders}
            color="#9C27B0"
          />
          <TestButton
            title="Update Status"
            onPress={updateWorkOrderStatus}
            color="#607D8B"
            disabled={!selectedWorkOrderId}
          />
          <TestButton
            title="Update Checkpoint"
            onPress={updateCheckpointStatus}
            color="#795548"
            disabled={!selectedWorkOrderId}
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="📅 Scheduled Task Operations">
        <ThemedText style={styles.description}>
          Test scheduled task operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Create Task"
            onPress={createSampleScheduledTask}
            color="#4CAF50"
            disabled={!selectedOperatorId}
          />
          <TestButton
            title="Get Tasks by Operator"
            onPress={getTasksByOperator}
            color="#2196F3"
            disabled={!selectedOperatorId}
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="🔍 Inspection Operations">
        <ThemedText style={styles.description}>
          Test inspection operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Create Inspection"
            onPress={createSampleInspection}
            color="#4CAF50"
            disabled={!selectedOperatorId || !selectedMachineId}
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="🚨 Alert Operations">
        <ThemedText style={styles.description}>
          Test alert-related operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Create Alert"
            onPress={createSampleAlert}
            color="#F44336"
          />
          <TestButton
            title="Get Active Alerts"
            onPress={getActiveAlerts}
            color="#FF9800"
          />
          <TestButton
            title="Get Alerts for Operator"
            onPress={getActiveAlertsForOperator}
            color="#9C27B0"
            disabled={!selectedOperatorId}
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="📱 Offline Queue Operations">
        <ThemedText style={styles.description}>
          Test offline queue operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Add to Queue"
            onPress={addToOfflineQueue}
            color="#607D8B"
          />
          <TestButton
            title="Get Pending Items"
            onPress={getPendingOfflineItems}
            color="#795548"
          />
        </ThemedView>
      </Collapsible>

      <Collapsible title="🔄 Batch Operations">
        <ThemedText style={styles.description}>
          Test batch operations:
        </ThemedText>
        <ThemedView style={styles.buttonContainer}>
          <TestButton
            title="Batch Create Operators"
            onPress={testBatchCreate}
            color="#E91E63"
          />
        </ThemedView>
      </Collapsible>

      {testResults.length > 0 && (
        <Collapsible title="📊 Test Results">
          <ThemedView style={styles.resultsHeader}>
            <ThemedText type="defaultSemiBold">Recent Test Results</ThemedText>
            <Button
              title="Clear Results"
              onPress={clearTestResults}
              color="#795548"
            />
          </ThemedView>
          <ScrollView style={styles.resultsContainer}>
            {testResults.map((result, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.resultItem,
                  {
                    borderLeftColor:
                      result.status === "success" ? "#4CAF50" : "#F44336",
                  },
                ]}
              >
                <ThemedText style={styles.resultOperation}>
                  {result.status === "success" ? "✅" : "❌"} {result.operation}
                </ThemedText>
                <ThemedText style={styles.resultMessage}>
                  {result.message}
                </ThemedText>
                <ThemedText style={styles.resultTime}>
                  {result.timestamp.toLocaleTimeString()}
                </ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </Collapsible>
      )}

      <Collapsible title="📖 Available Operations">
        <ThemedText style={styles.description}>
          This test suite covers all major Firestore operations:
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Generic CRUD:</ThemedText>{" "}
          Create, Read, Update, Delete
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Operators:</ThemedText>{" "}
          Management, status updates, assignments
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Machines:</ThemedText> Tracking,
          maintenance, location updates
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Work Orders:</ThemedText> Task
          management, checkpoint tracking
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Alerts:</ThemedText> Safety
          notifications, acknowledgments
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Batch Operations:</ThemedText>{" "}
          Bulk create and update
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          • <ThemedText type="defaultSemiBold">Offline Queue:</ThemedText> Sync
          management
        </ThemedText>
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
  inputContainer: {
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#F9F9F9",
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
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultsContainer: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
  },
  resultItem: {
    backgroundColor: "white",
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  resultOperation: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 10,
    color: "#999",
  },
  featureItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
});
