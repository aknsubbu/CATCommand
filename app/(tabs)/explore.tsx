import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import FirestoreService, {
  Machine,
  Operator
} from "@/services/FirestoreService";
import { spacing, typography } from "../../constants/theme";

// CAT Color Scheme (matching other screens)
const catColors = {
  primary: "#FFCD11", // CAT Yellow
  secondary: "#000000", // CAT Black
  background: {
    light: "#FFFFFF",
    gray: "#F5F5F5",
    dark: "#1A1A1A",
  },
  text: {
    primary: "#000000",
    secondary: "#666666",
    light: "#FFFFFF",
  },
  status: {
    pending: "#FFA500",
    inProgress: "#007ACC",
    completed: "#28A745",
    cancelled: "#DC3545",
    urgent: "#DC3545",
    high: "#FF6B35",
    medium: "#FFA500",
    low: "#28A745",
  },
  border: "#E0E0E0",
  actions: {
    create: "#28A745",
    read: "#007ACC",
    update: "#FF9800",
    delete: "#DC3545",
    batch: "#9C27B0",
  }
};

interface TestResult {
  operation: string;
  status: "success" | "error";
  message: string;
  timestamp: Date;
  fullData?: any;
}

interface AdminAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  requiresId?: string;
  hasForm?: boolean;
}

interface OperatorFormData {
  employeeId: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'on_break';
  skills: string;
  certifications: string;
  phone: string;
  emergencyContact: string;
}

interface MachineFormData {
  serialNumber: string;
  model: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  fuelLevel: string;
  maxSpeed: string;
  capacity: string;
  fuelCapacity: string;
}

interface WorkOrderFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedOperatorId: string;
  assignedMachineId: string;
  estimatedDuration: string;
  latitude: string;
  longitude: string;
}

export default function AdminDashboard(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  // Modal and Form States
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<'operator' | 'machine' | 'workorder' | 'update' | null>(null);
  const [updateType, setUpdateType] = useState<'operator' | 'machine' | 'workorder' | null>(null);

  // Form Data States
  const [operatorForm, setOperatorForm] = useState<OperatorFormData>({
    employeeId: '',
    name: '',
    email: '',
    status: 'active',
    skills: '',
    certifications: '',
    phone: '',
    emergencyContact: '',
  });

  const [machineForm, setMachineForm] = useState<MachineFormData>({
    serialNumber: '',
    model: '',
    type: '',
    status: 'active',
    fuelLevel: '100',
    maxSpeed: '50',
    capacity: '2000',
    fuelCapacity: '400',
  });

  const [workOrderForm, setWorkOrderForm] = useState<WorkOrderFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignedOperatorId: '',
    assignedMachineId: '',
    estimatedDuration: '480',
    latitude: '37.7849',
    longitude: '-122.4094',
  });

  // Helper function to reset forms
  const resetForms = () => {
    setOperatorForm({
      employeeId: '',
      name: '',
      email: '',
      status: 'active',
      skills: '',
      certifications: '',
      phone: '',
      emergencyContact: '',
    });
    setMachineForm({
      serialNumber: '',
      model: '',
      type: '',
      status: 'active',
      fuelLevel: '100',
      maxSpeed: '50',
      capacity: '2000',
      fuelCapacity: '400',
    });
    setWorkOrderForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      assignedOperatorId: '',
      assignedMachineId: '',
      estimatedDuration: '480',
      latitude: '37.7849',
      longitude: '-122.4094',
    });
  };

  // Helper function to open form modal
  const openFormModal = (formType: 'operator' | 'machine' | 'workorder', isUpdate: boolean = false) => {
    setCurrentForm(isUpdate ? 'update' : formType);
    if (isUpdate) {
      setUpdateType(formType);
    }
    setModalVisible(true);
  };

  // Helper function to close modal
  const closeModal = () => {
    setModalVisible(false);
    setCurrentForm(null);
    setUpdateType(null);
    resetForms();
  };

  // Helper function to format data for display
  const formatDataForDisplay = (data: any): string => {
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  // Helper function to add test result
  const addTestResult = (
    operation: string,
    status: "success" | "error",
    message: string,
    fullData?: any
  ) => {
    const result: TestResult = {
      operation,
      status,
      message,
      timestamp: new Date(),
      fullData
    };
    setTestResults((prev) => [result, ...prev.slice(0, 19)]);
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
      
      addTestResult(operationName, "success", message, result);
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

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // ===== OPERATOR OPERATIONS =====
  const createSampleOperator = () => {
    setOperatorForm({
      employeeId: `EMP${Date.now()}`,
      name: "John Doe",
      email: "john.doe@example.com",
      status: "active",
      skills: "excavator,safety",
      certifications: "basic,advanced",
      phone: "+1234567890",
      emergencyContact: "+0987654321",
    });
    openFormModal('operator');
  };

  const createOperatorFromForm = () =>
    handleAsyncOperation("Create Operator", async () => {
      const operatorData = {
        employeeId: operatorForm.employeeId || `EMP${Date.now()}`,
        name: operatorForm.name,
        email: operatorForm.email,
        status: operatorForm.status,
        skills: operatorForm.skills.split(',').map(s => s.trim()).filter(s => s),
        certifications: operatorForm.certifications.split(',').map(s => s.trim()).filter(s => s),
        contactInfo: {
          phone: operatorForm.phone,
          emergencyContact: operatorForm.emergencyContact,
        },
      };
      const id = await FirestoreService.createOperator(operatorData);
      setSelectedOperatorId(id);
      closeModal();
      return `Operator created with ID: ${id}`;
    });

  const getOperator = () =>
    handleAsyncOperation("Get Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      const operator = await FirestoreService.getOperator(selectedOperatorId);
      if (!operator) {
        return "Operator not found";
      }
      return operator;
    });

  const updateOperatorStatus = () => {
    setOperatorForm({
      ...operatorForm,
      status: 'on_break'
    });
    openFormModal('operator', true);
  };

  const updateOperatorFromForm = () =>
    handleAsyncOperation("Update Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      
      await FirestoreService.updateOperatorStatus(
        selectedOperatorId,
        operatorForm.status
      );
      closeModal();
      return `Operator status updated to ${operatorForm.status}`;
    });

  const getAllOperators = () =>
    handleAsyncOperation("Get All Operators", async () => {
      const operators = await FirestoreService.getAll<Operator>(
        FirestoreService.collections.OPERATORS,
        {
          limitCount: 10,
        }
      );
      return operators;
    });

  // ===== MACHINE OPERATIONS =====
  const createSampleMachine = () => {
    setMachineForm({
      serialNumber: `SN${Date.now()}`,
      model: "CAT 336",
      type: "excavator",
      status: "active",
      fuelLevel: "75",
      maxSpeed: "50",
      capacity: "2000",
      fuelCapacity: "400",
    });
    openFormModal('machine');
  };

  const createMachineFromForm = () =>
    handleAsyncOperation("Create Machine", async () => {
      const machineData = {
        serialNumber: machineForm.serialNumber || `SN${Date.now()}`,
        model: machineForm.model,
        type: machineForm.type,
        status: machineForm.status,
        fuelLevel: parseInt(machineForm.fuelLevel),
        maintenanceSchedule: {
          lastMaintenance: FirestoreService.dateToTimestamp(
            new Date(Date.now() - 86400000)
          ),
          nextMaintenance: FirestoreService.dateToTimestamp(
            new Date(Date.now() + 604800000)
          ),
        },
        specifications: {
          maxSpeed: parseInt(machineForm.maxSpeed),
          capacity: parseInt(machineForm.capacity),
          fuelCapacity: parseInt(machineForm.fuelCapacity),
        },
      };
      const id = await FirestoreService.createMachine(machineData);
      setSelectedMachineId(id);
      closeModal();
      return `Machine created with ID: ${id}`;
    });

  const getMachine = () =>
    handleAsyncOperation("Get Machine", async () => {
      if (!selectedMachineId) throw new Error("No machine selected");
      const machine = await FirestoreService.getMachine(selectedMachineId);
      if (!machine) {
        return "Machine not found";
      }
      return machine;
    });

  const updateMachineFuelLevel = () => {
    setMachineForm({
      ...machineForm,
      fuelLevel: '85'
    });
    openFormModal('machine', true);
  };

  const updateMachineFromForm = () =>
    handleAsyncOperation("Update Machine", async () => {
      if (!selectedMachineId) throw new Error("No machine selected");
      
      await FirestoreService.updateMachineFuelLevel(
        selectedMachineId, 
        parseInt(machineForm.fuelLevel)
      );
      closeModal();
      return `Machine fuel level updated to ${machineForm.fuelLevel}%`;
    });

  const getAllMachines = () =>
    handleAsyncOperation("Get All Machines", async () => {
      const machines = await FirestoreService.getAll<Machine>(
        FirestoreService.collections.MACHINES,
        {
          limitCount: 10,
        }
      );
      return machines;
    });

  // ===== WORK ORDER OPERATIONS =====
  const createSampleWorkOrder = () => {
    setWorkOrderForm({
      title: "Site Excavation - Phase 1",
      description: "Excavate foundation area for new building construction",
      priority: "high",
      status: "pending",
      assignedOperatorId: selectedOperatorId,
      assignedMachineId: selectedMachineId,
      estimatedDuration: "480",
      latitude: "37.7849",
      longitude: "-122.4094",
    });
    openFormModal('workorder');
  };

  const createWorkOrderFromForm = () =>
    handleAsyncOperation("Create Work Order", async () => {
      if (!workOrderForm.assignedOperatorId) throw new Error("Operator ID required");

      const workOrderData = {
        title: workOrderForm.title,
        description: workOrderForm.description,
        priority: workOrderForm.priority,
        status: workOrderForm.status,
        assignedOperatorId: workOrderForm.assignedOperatorId,
        assignedMachineId: workOrderForm.assignedMachineId,
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
          latitude: parseFloat(workOrderForm.latitude),
          longitude: parseFloat(workOrderForm.longitude),
          timestamp: FirestoreService.dateToTimestamp(new Date()),
        },
        estimatedDuration: parseInt(workOrderForm.estimatedDuration),
      };

      const id = await FirestoreService.createWorkOrder(workOrderData);
      setSelectedWorkOrderId(id);
      closeModal();
      return `Work Order created with ID: ${id}`;
    });

  const getWorkOrder = () =>
    handleAsyncOperation("Get Work Order", async () => {
      if (!selectedWorkOrderId) throw new Error("No work order selected");
      const workOrder = await FirestoreService.getWorkOrder(
        selectedWorkOrderId
      );
      if (!workOrder) {
        return "Work order not found";
      }
      return workOrder;
    });

  const updateWorkOrderStatus = () => {
    setWorkOrderForm({
      ...workOrderForm,
      status: 'in_progress'
    });
    openFormModal('workorder', true);
  };

  const updateWorkOrderFromForm = () =>
    handleAsyncOperation("Update Work Order", async () => {
      if (!selectedWorkOrderId) throw new Error("No work order selected");
      
      await FirestoreService.updateWorkOrderStatus(
        selectedWorkOrderId,
        workOrderForm.status
      );
      closeModal();
      return `Work order status updated to ${workOrderForm.status}`;
    });

  const clearTestResults = () => {
    setTestResults([]);
    setExpandedResult(null);
    Alert.alert("Success", "Activity log cleared");
  };

  const getStats = () => {
    const stats = {
      total: testResults.length,
      success: testResults.filter(r => r.status === 'success').length,
      errors: testResults.filter(r => r.status === 'error').length,
      recent: testResults.slice(0, 5).length,
    };
    return stats;
  };

  const adminSections = [
    {
      id: "operators",
      title: "Operators",
      icon: "people",
      description: "Manage operator records and assignments",
      actions: [
        {
          title: "Create Operator",
          description: "Add new operator to system",
          icon: "person-add",
          color: catColors.actions.create,
          onPress: createSampleOperator,
          hasForm: true,
        },
        {
          title: "View Operator",
          description: "Get operator details",
          icon: "person-outline",
          color: catColors.actions.read,
          onPress: getOperator,
          disabled: !selectedOperatorId,
          requiresId: "operator",
        },
        {
          title: "Update Status",
          description: "Change operator status",
          icon: "person-circle",
          color: catColors.actions.update,
          onPress: updateOperatorStatus,
          disabled: !selectedOperatorId,
          requiresId: "operator",
          hasForm: true,
        },
        {
          title: "List All",
          description: "Get all operators",
          icon: "list",
          color: catColors.actions.read,
          onPress: getAllOperators,
        },
      ] as AdminAction[]
    },
    {
      id: "machines",
      title: "Machines",
      icon: "construct",
      description: "Manage machine inventory and status",
      actions: [
        {
          title: "Create Machine",
          description: "Add new machine to fleet",
          icon: "add-circle",
          color: catColors.actions.create,
          onPress: createSampleMachine,
          hasForm: true,
        },
        {
          title: "View Machine",
          description: "Get machine details",
          icon: "hardware-chip",
          color: catColors.actions.read,
          onPress: getMachine,
          disabled: !selectedMachineId,
          requiresId: "machine",
        },
        {
          title: "Update Fuel",
          description: "Update fuel level",
          icon: "speedometer",
          color: catColors.actions.update,
          onPress: updateMachineFuelLevel,
          disabled: !selectedMachineId,
          requiresId: "machine",
          hasForm: true,
        },
        {
          title: "List All",
          description: "Get all machines",
          icon: "list",
          color: catColors.actions.read,
          onPress: getAllMachines,
        },
      ] as AdminAction[]
    },
    {
      id: "workorders",
      title: "Work Orders",
      icon: "clipboard",
      description: "Manage work orders and tasks",
      actions: [
        {
          title: "Create Order",
          description: "Create new work order",
          icon: "add-circle",
          color: catColors.actions.create,
          onPress: createSampleWorkOrder,
          disabled: !selectedOperatorId,
          requiresId: "operator",
          hasForm: true,
        },
        {
          title: "View Order",
          description: "Get work order details",
          icon: "document-text",
          color: catColors.actions.read,
          onPress: getWorkOrder,
          disabled: !selectedWorkOrderId,
          requiresId: "workorder",
        },
        {
          title: "Update Status",
          description: "Change order status",
          icon: "checkmark-circle",
          color: catColors.actions.update,
          onPress: updateWorkOrderStatus,
          disabled: !selectedWorkOrderId,
          requiresId: "workorder",
          hasForm: true,
        },
      ] as AdminAction[]
    },
  ];

  const renderInputField = (placeholder: string, value: string, onChangeText: (text: string) => void, icon: string) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon as any} size={20} color={catColors.text.secondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={catColors.text.secondary}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={20} color={catColors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActionCard = (action: AdminAction) => (
    <TouchableOpacity
      key={action.title}
      style={[
        styles.actionCard,
        action.disabled && styles.actionCardDisabled
      ]}
      onPress={action.onPress}
      disabled={loading || action.disabled}
    >
      <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
        <Ionicons name={action.icon as any} size={24} color={action.color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
        {action.requiresId && action.disabled && (
          <Text style={styles.actionRequirement}>Requires {action.requiresId} ID</Text>
        )}
        {action.hasForm && (
          <Text style={styles.actionFormIndicator}>📝 Opens Form</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={catColors.text.secondary} />
    </TouchableOpacity>
  );

  // Form Input Components
  const renderFormInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    multiline?: boolean,
    keyboardType?: 'default' | 'numeric' | 'email-address'
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={catColors.text.secondary}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderFormPicker = (
    label: string,
    value: string,
    onValueChange: (value: string) => void,
    options: { label: string; value: string }[]
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              value === option.value && styles.pickerOptionSelected
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text style={[
              styles.pickerOptionText,
              value === option.value && styles.pickerOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Form Content Renderers
  const renderOperatorForm = () => (
    <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>
        {currentForm === 'update' ? 'Update Operator' : 'Create New Operator'}
      </Text>
      
      {renderFormInput(
        "Employee ID",
        operatorForm.employeeId,
        (text) => setOperatorForm({...operatorForm, employeeId: text}),
        "e.g., EMP001"
      )}
      
      {renderFormInput(
        "Full Name",
        operatorForm.name,
        (text) => setOperatorForm({...operatorForm, name: text}),
        "e.g., John Doe"
      )}
      
      {renderFormInput(
        "Email",
        operatorForm.email,
        (text) => setOperatorForm({...operatorForm, email: text}),
        "e.g., john@company.com",
        false,
        'email-address'
      )}

      {renderFormPicker(
        "Status",
        operatorForm.status,
        (value) => setOperatorForm({...operatorForm, status: value as any}),
        [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "On Break", value: "on_break" },
        ]
      )}
      
      {renderFormInput(
        "Skills (comma separated)",
        operatorForm.skills,
        (text) => setOperatorForm({...operatorForm, skills: text}),
        "e.g., excavator, safety, crane"
      )}
      
      {renderFormInput(
        "Certifications (comma separated)",
        operatorForm.certifications,
        (text) => setOperatorForm({...operatorForm, certifications: text}),
        "e.g., basic, advanced, safety"
      )}
      
      {renderFormInput(
        "Phone Number",
        operatorForm.phone,
        (text) => setOperatorForm({...operatorForm, phone: text}),
        "e.g., +1234567890"
      )}
      
      {renderFormInput(
        "Emergency Contact",
        operatorForm.emergencyContact,
        (text) => setOperatorForm({...operatorForm, emergencyContact: text}),
        "e.g., +0987654321"
      )}
    </ScrollView>
  );

  const renderMachineForm = () => (
    <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>
        {currentForm === 'update' ? 'Update Machine' : 'Create New Machine'}
      </Text>
      
      {renderFormInput(
        "Serial Number",
        machineForm.serialNumber,
        (text) => setMachineForm({...machineForm, serialNumber: text}),
        "e.g., SN123456"
      )}
      
      {renderFormInput(
        "Model",
        machineForm.model,
        (text) => setMachineForm({...machineForm, model: text}),
        "e.g., CAT 336"
      )}
      
      {renderFormInput(
        "Type",
        machineForm.type,
        (text) => setMachineForm({...machineForm, type: text}),
        "e.g., excavator, bulldozer"
      )}

      {renderFormPicker(
        "Status",
        machineForm.status,
        (value) => setMachineForm({...machineForm, status: value as any}),
        [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "Maintenance", value: "maintenance" },
        ]
      )}
      
      {renderFormInput(
        "Fuel Level (%)",
        machineForm.fuelLevel,
        (text) => setMachineForm({...machineForm, fuelLevel: text}),
        "0-100",
        false,
        'numeric'
      )}
      
      {renderFormInput(
        "Max Speed (km/h)",
        machineForm.maxSpeed,
        (text) => setMachineForm({...machineForm, maxSpeed: text}),
        "e.g., 50",
        false,
        'numeric'
      )}
      
      {renderFormInput(
        "Capacity (kg)",
        machineForm.capacity,
        (text) => setMachineForm({...machineForm, capacity: text}),
        "e.g., 2000",
        false,
        'numeric'
      )}
      
      {renderFormInput(
        "Fuel Capacity (L)",
        machineForm.fuelCapacity,
        (text) => setMachineForm({...machineForm, fuelCapacity: text}),
        "e.g., 400",
        false,
        'numeric'
      )}
    </ScrollView>
  );

  const renderWorkOrderForm = () => (
    <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>
        {currentForm === 'update' ? 'Update Work Order' : 'Create New Work Order'}
      </Text>
      
      {renderFormInput(
        "Title",
        workOrderForm.title,
        (text) => setWorkOrderForm({...workOrderForm, title: text}),
        "e.g., Site Excavation - Phase 1"
      )}
      
      {renderFormInput(
        "Description",
        workOrderForm.description,
        (text) => setWorkOrderForm({...workOrderForm, description: text}),
        "Detailed description of the work...",
        true
      )}

      {renderFormPicker(
        "Priority",
        workOrderForm.priority,
        (value) => setWorkOrderForm({...workOrderForm, priority: value as any}),
        [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Urgent", value: "urgent" },
        ]
      )}

      {renderFormPicker(
        "Status",
        workOrderForm.status,
        (value) => setWorkOrderForm({...workOrderForm, status: value as any}),
        [
          { label: "Pending", value: "pending" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ]
      )}
      
      {renderFormInput(
        "Assigned Operator ID",
        workOrderForm.assignedOperatorId,
        (text) => setWorkOrderForm({...workOrderForm, assignedOperatorId: text}),
        selectedOperatorId || "Enter operator ID"
      )}
      
      {renderFormInput(
        "Assigned Machine ID",
        workOrderForm.assignedMachineId,
        (text) => setWorkOrderForm({...workOrderForm, assignedMachineId: text}),
        selectedMachineId || "Enter machine ID (optional)"
      )}
      
      {renderFormInput(
        "Estimated Duration (minutes)",
        workOrderForm.estimatedDuration,
        (text) => setWorkOrderForm({...workOrderForm, estimatedDuration: text}),
        "e.g., 480",
        false,
        'numeric'
      )}
      
      {renderFormInput(
        "Latitude",
        workOrderForm.latitude,
        (text) => setWorkOrderForm({...workOrderForm, latitude: text}),
        "e.g., 37.7849",
        false,
        'numeric'
      )}
      
      {renderFormInput(
        "Longitude",
        workOrderForm.longitude,
        (text) => setWorkOrderForm({...workOrderForm, longitude: text}),
        "e.g., -122.4094",
        false,
        'numeric'
      )}
    </ScrollView>
  );

  const handleFormSubmit = () => {
    if (currentForm === 'update') {
      if (updateType === 'operator') {
        updateOperatorFromForm();
      } else if (updateType === 'machine') {
        updateMachineFromForm();
      } else if (updateType === 'workorder') {
        updateWorkOrderFromForm();
      }
    } else {
      if (currentForm === 'operator') {
        createOperatorFromForm();
      } else if (currentForm === 'machine') {
        createMachineFromForm();
      } else if (currentForm === 'workorder') {
        createWorkOrderFromForm();
      }
    }
  };

  const isFormValid = () => {
    if (currentForm === 'operator' || updateType === 'operator') {
      return operatorForm.name.trim() && operatorForm.email.trim();
    } else if (currentForm === 'machine' || updateType === 'machine') {
      return machineForm.model.trim() && machineForm.type.trim();
    } else if (currentForm === 'workorder' || updateType === 'workorder') {
      return workOrderForm.title.trim() && workOrderForm.assignedOperatorId.trim();
    }
    return false;
  };

  const renderActivityItem = (result: TestResult, index: number) => {
    const isExpanded = expandedResult === index;
    const hasFullData = result.fullData && typeof result.fullData === 'object';
    
    return (
      <View key={index} style={styles.activityItem}>
        <View style={[
          styles.activityStatus,
          { backgroundColor: result.status === 'success' ? catColors.status.completed : catColors.status.cancelled }
        ]}>
          <Ionicons 
            name={result.status === 'success' ? "checkmark" : "close"} 
            size={12} 
            color={catColors.text.light} 
          />
        </View>
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityOperation}>{result.operation}</Text>
            {hasFullData && (
              <TouchableOpacity 
                onPress={() => setExpandedResult(isExpanded ? null : index)}
                style={styles.expandButton}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={catColors.actions.read} 
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.activityMessage} numberOfLines={isExpanded ? undefined : 2}>
            {result.message}
          </Text>
          {hasFullData && isExpanded && (
            <View style={styles.fullDataContainer}>
              <Text style={styles.fullDataLabel}>Full Data:</Text>
              <ScrollView 
                style={styles.fullDataScroll} 
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.fullDataText}>
                  {formatDataForDisplay(result.fullData)}
                </Text>
              </ScrollView>
            </View>
          )}
          <Text style={styles.activityTime}>{result.timestamp.toLocaleTimeString()}</Text>
        </View>
      </View>
    );
  };

  const stats = getStats();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[catColors.primary]}
          tintColor={catColors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Administration Portal</Text>
          <Text style={styles.title}>Database Management</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={24} color={catColors.primary} />
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Actions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.completed }]}>{stats.success}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.cancelled }]}>{stats.errors}</Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.inProgress }]}>{stats.recent}</Text>
          <Text style={styles.statLabel}>Recent</Text>
        </View>
      </View>

      {/* Configuration Section */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <Text style={styles.sectionDescription}>
          Set record IDs for operations that require existing documents
        </Text>
        <View style={styles.configInputs}>
          {renderInputField("Operator ID", selectedOperatorId, setSelectedOperatorId, "person")}
          {renderInputField("Machine ID", selectedMachineId, setSelectedMachineId, "hardware-chip")}
          {renderInputField("Work Order ID", selectedWorkOrderId, setSelectedWorkOrderId, "clipboard")}
        </View>
      </View>

      {/* Admin Sections */}
      {adminSections.map((section) => (
        <View key={section.id} style={styles.adminSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name={section.icon as any} size={24} color={catColors.primary} />
              <View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
            </View>
          </View>
          <View style={styles.actionsGrid}>
            {section.actions.map(renderActionCard)}
          </View>
        </View>
      ))}

      {/* Activity Log */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {testResults.length > 0 && (
            <TouchableOpacity onPress={clearTestResults} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Log</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={24} color={catColors.primary} />
            <Text style={styles.loadingText}>Processing operation...</Text>
          </View>
        )}

        {testResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={catColors.text.secondary} />
            <Text style={styles.emptyStateTitle}>No Activity</Text>
            <Text style={styles.emptyStateText}>
              Perform database operations to see activity logs here.
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {testResults.slice(0, 10).map(renderActivityItem)}
            {testResults.length > 10 && (
              <Text style={styles.moreActivities}>
                And {testResults.length - 10} more activities...
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />

      {/* Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={catColors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {currentForm === 'update' 
                ? `Update ${updateType?.charAt(0).toUpperCase()}${updateType?.slice(1)}` 
                : `Create ${currentForm?.charAt(0).toUpperCase()}${currentForm?.slice(1)}`
              }
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <View style={styles.modalBody}>
            {(currentForm === 'operator' || updateType === 'operator') && renderOperatorForm()}
            {(currentForm === 'machine' || updateType === 'machine') && renderMachineForm()}
            {(currentForm === 'workorder' || updateType === 'workorder') && renderWorkOrderForm()}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={closeModal}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalSubmitButton,
                (!isFormValid() || loading) && styles.modalSubmitButtonDisabled
              ]}
              onPress={handleFormSubmit}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <Text style={styles.modalSubmitText}>Processing...</Text>
              ) : (
                <Text style={styles.modalSubmitText}>
                  {currentForm === 'update' ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.light,
    paddingTop:spacing.xl
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: catColors.text.primary,
  },
  headerIcon: {
    padding: spacing.sm,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: "row",
    padding: spacing.base,
    backgroundColor: catColors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: catColors.border,
  },
  configSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  configInputs: {
    gap: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: catColors.border,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    paddingVertical: spacing.xs,
  },
  adminSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  sectionHeader: {
    marginBottom: spacing.base,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionsGrid: {
    gap: spacing.sm,
  },
  actionCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    lineHeight: 18,
  },
  actionRequirement: {
    fontSize: typography.fontSize.xs,
    color: catColors.status.cancelled,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionFormIndicator: {
    fontSize: typography.fontSize.xs,
    color: catColors.actions.create,
    fontStyle: 'italic',
    marginTop: 2,
  },
  activitySection: {
    padding: spacing.base,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: catColors.status.cancelled,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  activityStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityOperation: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: catColors.text.primary,
    flex: 1,
  },
  expandButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  activityMessage: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    color: catColors.text.secondary,
  },
  fullDataContainer: {
    marginTop: spacing.sm,
    backgroundColor: catColors.background.light,
    borderRadius: 6,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: catColors.border,
  },
  fullDataLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  fullDataScroll: {
    maxHeight: 200,
    backgroundColor: catColors.background.dark,
    borderRadius: 4,
    padding: spacing.xs,
  },
  fullDataText: {
    fontSize: typography.fontSize.xs,
    color: catColors.text.light,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  moreActivities: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.sm,
  },
  bottomPadding: {
    height: spacing["5xl"],
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: catColors.background.light,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
    backgroundColor: catColors.background.light,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalHeaderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalBody: {
    flex: 1,
    padding: spacing.base,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.base,
    paddingBottom: spacing["2xl"],
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: catColors.border,
    backgroundColor: catColors.background.light,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: catColors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    fontWeight: '500',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: catColors.primary,
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    backgroundColor: catColors.text.secondary,
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: typography.fontSize.base,
    color: catColors.secondary,
    fontWeight: '600',
  },
  // Form Styles
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.base,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: catColors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    backgroundColor: catColors.background.light,
  },
  formInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pickerOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: catColors.border,
    backgroundColor: catColors.background.light,
  },
  pickerOptionSelected: {
    backgroundColor: catColors.primary,
    borderColor: catColors.primary,
  },
  pickerOptionText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.primary,
  },
  pickerOptionTextSelected: {
    color: catColors.secondary,
    fontWeight: '600',
  },
});