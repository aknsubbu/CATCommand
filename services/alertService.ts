import { generateUUID } from './asyncService';
import Papa from 'papaparse';
import trainingSuggestionService, { TrainingSuggestion } from './trainingSuggestionService';
import taskEstimationService from './taskEstimationService';
import { Readable } from 'stream';

// --- Interface Definitions ---

export interface BaseDocument {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type Timestamp = Date;

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Alert extends BaseDocument {
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

export interface CsvRow {
  Timestamp: string;
  Machine_ID: string;
  Operator_ID: string;
  Engine_Hours: number;
  Fuel_Used_L: number;
  Load_Cycles: number;
  Idling_Time_min: number;
  Seatbelt_Status: 'Fastened' | 'Unfastened';
  Safety_Alert_Triggered: 'Yes' | 'No';
  Ambient_Temp_C: number;
  Brake_Pressure_kPa: number;
  Acceleration_m_s2: number;
  Oil_Pressure_kPa: number;
}

interface MachineState {
  lastEngineHours: number;
  lastAcceleration: number;
  consecutiveAggressiveAccelerations: number;
}

const machineState: Record<string, MachineState> = {};

// --- Alert Checking Functions ---

const checkSeatbeltAlert = (row: CsvRow): Alert | null => {
  const state = machineState[row.Machine_ID] || { lastEngineHours: 0 };
  const engineRunning = row.Engine_Hours > state.lastEngineHours || row.Fuel_Used_L > 0 || Math.abs(row.Acceleration_m_s2) > 0.1;

  if (row.Seatbelt_Status === 'Unfastened' && engineRunning) {
    return {
      id: generateUUID(),
      createdAt: new Date(),
      type: 'emergency',
      title: 'Critical Safety Alert: Seatbelt Unfastened',
      message: `Operator ${row.Operator_ID}'s seatbelt is unfastened while machine ${row.Machine_ID} is active. Immediate action required.`,
      priority: 'critical',
      operatorId: row.Operator_ID,
      machineId: row.Machine_ID,
      status: 'active',
      audioPlayed: false,
    };
  }
  return null;
};

const checkExcessiveIdlingAlert = (row: CsvRow): Alert | null => {
  const state = machineState[row.Machine_ID] || { lastEngineHours: 0 };
  if (row.Idling_Time_min > 10 && row.Load_Cycles === 0 && row.Engine_Hours > state.lastEngineHours) {
    return {
      id: generateUUID(),
      createdAt: new Date(),
      type: 'warning',
      title: 'Efficiency Warning: Excessive Idling',
      message: `Machine ${row.Machine_ID} is idling excessively (${row.Idling_Time_min} min) without productive work. Consider engine shutdown.`,
      priority: 'medium',
      operatorId: row.Operator_ID,
      machineId: row.Machine_ID,
      status: 'active',
      audioPlayed: false,
    };
  }
  return null;
};

const checkLowOilPressureAlert = (row: CsvRow): Alert | null => {
    const state = machineState[row.Machine_ID] || { lastEngineHours: 0 };
    if (row.Oil_Pressure_kPa < 200 && row.Engine_Hours > state.lastEngineHours) {
    return {
      id: generateUUID(),
      createdAt: new Date(),
      type: 'emergency',
      title: 'Engine Critical: Low Oil Pressure',
      message: `Machine ${row.Machine_ID} engine oil pressure is critically low (${row.Oil_Pressure_kPa} kPa). Stop machine safely and check engine.`,
      priority: 'critical',
      machineId: row.Machine_ID,
      status: 'active',
      audioPlayed: false,
    };
  }
  return null;
};

const checkAbnormalBrakePressureAlert = (row: CsvRow): Alert | null => {
    if ((row.Brake_Pressure_kPa > 100 && Math.abs(row.Acceleration_m_s2) < 0.5) || (row.Brake_Pressure_kPa < 300 && row.Acceleration_m_s2 < -1.0)) {
    return {
      id: generateUUID(),
      createdAt: new Date(),
      type: 'warning',
      title: 'Brake System Warning: Abnormal Pressure',
      message: `Machine ${row.Machine_ID} brake system pressure is outside normal operating range (${row.Brake_Pressure_kPa} kPa). Inspect braking system.`,
      priority: 'high',
      machineId: row.Machine_ID,
      status: 'active',
      audioPlayed: false,
    };
  }
  return null;
};

const checkAggressiveOperationAlert = (row: CsvRow): Alert | null => {
  const state = machineState[row.Machine_ID] || { lastAcceleration: 0, consecutiveAggressiveAccelerations: 0 };
  if (Math.abs(row.Acceleration_m_s2) > 3.0) {
    state.consecutiveAggressiveAccelerations++;
  } else {
    state.consecutiveAggressiveAccelerations = 0;
  }

  if (state.consecutiveAggressiveAccelerations >= 2) {
    return {
      id: generateUUID(),
      createdAt: new Date(),
      type: 'info',
      title: 'Operational Feedback: Aggressive Driving',
      message: `Machine ${row.Machine_ID} experiencing aggressive acceleration/deceleration. Operator ${row.Operator_ID} should consider smoother operation.`,
      priority: 'low',
      operatorId: row.Operator_ID,
      machineId: row.Machine_ID,
      status: 'active',
      audioPlayed: false,
    };
  }
  return null;
};

const checkHighAmbientTempAlert = (row: CsvRow): Alert | null => {
    const state = machineState[row.Machine_ID] || { lastEngineHours: 0 };
    if (row.Ambient_Temp_C > 35 && row.Engine_Hours > state.lastEngineHours) {
    return {
      id: generateUUID(),
      createdAt: new Date(),
      type: 'info',
      title: 'Environmental Info: High Ambient Temperature',
      message: `Machine ${row.Machine_ID} operating in high ambient temperatures (${row.Ambient_Temp_C}°C). Monitor machine cooling systems.`,
      priority: 'low',
      machineId: row.Machine_ID,
      status: 'active',
      audioPlayed: false,
    };
  }
  return null;
};

// --- Core Logic ---

export const startMonitoring = (csvContent: string, onAlert: (alert: Alert | { message: string, machineId: string, timestamp: string } | TrainingSuggestion) => void): () => void => {
  let timeoutId: NodeJS.Timeout;
  let currentIndex = 0;
  let isMonitoringActive = true;

  const rows: CsvRow[] = Papa.parse(csvContent, { header: true, dynamicTyping: true, skipEmptyLines: true }).data as CsvRow[];

  // Process historical data for task estimation
  taskEstimationService.processHistoricalData(csvContent);

  const processRow = async () => {
    if (!isMonitoringActive || currentIndex >= rows.length) {
      onAlert({ message: "Finished processing all data.", machineId: '', timestamp: new Date().toISOString() });
      return;
    }

    const row = rows[currentIndex];
    if (!row) {
      currentIndex++;
      timeoutId = setTimeout(processRow, 5000);
      return;
    }

    const alerts: (Alert | null)[] = [
      checkSeatbeltAlert(row),
      checkExcessiveIdlingAlert(row),
      checkLowOilPressureAlert(row),
      checkAbnormalBrakePressureAlert(row),
      checkAggressiveOperationAlert(row),
      checkHighAmbientTempAlert(row),
    ];

    const triggeredAlerts = alerts.filter(alert => alert !== null) as Alert[];

    if (triggeredAlerts.length > 0) {
      for (const alert of triggeredAlerts) {
        onAlert(alert);
        const suggestion = await trainingSuggestionService.getSuggestionForAlert(alert);
        if (suggestion) {
          onAlert(suggestion);
        }
      }
    } else {
      onAlert({ message: 'No problem for machine', machineId: row.Machine_ID, timestamp: row.Timestamp });
    }

    // Update machine state
    machineState[row.Machine_ID] = {
      lastEngineHours: row.Engine_Hours,
      lastAcceleration: row.Acceleration_m_s2,
      consecutiveAggressiveAccelerations: (machineState[row.Machine_ID]?.consecutiveAggressiveAccelerations || 0)
    };

    currentIndex++;
    timeoutId = setTimeout(processRow, 5000);
  };

  processRow();

  // Return a cleanup function to stop monitoring
  return () => {
    isMonitoringActive = false;
    clearTimeout(timeoutId);
  };
};
