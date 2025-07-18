import Papa from 'papaparse';
import { generateUUID, OfflineQueueService } from './asyncService';
import taskEstimationService from './taskEstimationService';
import trainingSuggestionService, { TrainingSuggestion } from './trainingSuggestionService';

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

export interface StatusMessage {
  id: string;
  message: string;
  machineId?: string;
  timestamp: string;
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
  Oil_Pressure_kPa: number; // Added this property
}

interface MachineState {
  lastEngineHours: number;
  lastAcceleration: number;
  consecutiveAggressiveAccelerations: number;
}

const machineState: Record<string, MachineState> = {};

// --- Helper function to safely serialize data ---
const safeSerializeRow = (row: CsvRow): any => {
  try {
    // Create a clean copy of the row with only serializable data
    return {
      Timestamp: row.Timestamp,
      Machine_ID: row.Machine_ID,
      Operator_ID: row.Operator_ID,
      Engine_Hours: row.Engine_Hours,
      Fuel_Used_L: row.Fuel_Used_L,
      Load_Cycles: row.Load_Cycles,
      Idling_Time_min: row.Idling_Time_min,
      Seatbelt_Status: row.Seatbelt_Status,
      Safety_Alert_Triggered: row.Safety_Alert_Triggered,
      Ambient_Temp_C: row.Ambient_Temp_C,
      Brake_Pressure_kPa: row.Brake_Pressure_kPa,
      Acceleration_m_s2: row.Acceleration_m_s2
    };
  } catch (error) {
    // If serialization fails, return a minimal representation
    return {
      Machine_ID: row?.Machine_ID || 'unknown',
      Operator_ID: row?.Operator_ID || 'unknown',
      Timestamp: row?.Timestamp || new Date().toISOString(),
      error: 'Failed to serialize row data'
    };
  }
};

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

export const startMonitoring = (csvContent: string, onAlert: (alert: Alert | StatusMessage | TrainingSuggestion) => void): () => void => {
  let timeoutId: number;
  let currentIndex = 0;
  let isMonitoringActive = true;

  let rows: CsvRow[];
  try {
    rows = Papa.parse(csvContent, { header: true, dynamicTyping: true, skipEmptyLines: true }).data as CsvRow[];
  } catch (error) {
    console.error("Error parsing CSV content in alertService:", error);
    onAlert({
      id: generateUUID(),
      message: `Error parsing CSV: ${(error as Error).message}`,
      machineId: '',
      timestamp: new Date().toISOString()
    });
    
    // Queue the CSV parsing error
    OfflineQueueService.addItem({
      operatorId: 'system',
      type: "alert_error",
      priority: "critical",
      data: {
        error: (error as Error).message,
        context: "CSV Parsing",
        timestamp: new Date().toISOString()
      },
      timestamp: new Date(),
    }).catch(queueError => {
      console.error("Failed to queue CSV parsing error:", queueError);
    });
    
    return () => {}; // Stop monitoring if CSV parsing fails
  }

  // Process historical data for task estimation
  taskEstimationService.processHistoricalData(csvContent);

  const processRow = async () => {
    try {
      if (!isMonitoringActive || currentIndex >= rows.length) {
        onAlert({
          id: generateUUID(),
          message: "Finished processing all data.",
          machineId: '',
          timestamp: new Date().toISOString()
        });
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
        onAlert({
          id: generateUUID(),
          message: 'No problem for machine',
          machineId: row.Machine_ID,
          timestamp: row.Timestamp
        });
      }

      // Update machine state
      machineState[row.Machine_ID] = {
        lastEngineHours: row.Engine_Hours,
        lastAcceleration: row.Acceleration_m_s2,
        consecutiveAggressiveAccelerations: (machineState[row.Machine_ID]?.consecutiveAggressiveAccelerations || 0)
      };

      currentIndex++;
      timeoutId = setTimeout(processRow, 5000);
    } catch (error) {
      console.error(`Caught error processing row ${currentIndex} in alertService:`, error);
      console.log("Attempting to queue row processing error...");
      
      onAlert({
        id: generateUUID(),
        message: `Error processing data: ${(error as Error).message}`,
        machineId: rows[currentIndex]?.Machine_ID || '',
        timestamp: new Date().toISOString()
      });
      
      // Properly queue the error with await and error handling
      try {
        await OfflineQueueService.addItem({
          operatorId: rows[currentIndex]?.Operator_ID || 'unknown',
          type: "alert_error",
          priority: "critical",
          data: {
            error: (error as Error).message,
            errorStack: (error as Error).stack,
            row: safeSerializeRow(rows[currentIndex]),
            context: "Alert Processing",
            rowIndex: currentIndex,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date(),
        });
        console.log("Successfully queued row processing error");
      } catch (queueError) {
        console.error("Failed to queue row processing error:", queueError);
        // Optionally, you could try a simpler error format
        try {
          await OfflineQueueService.addItem({
            operatorId: 'unknown',
            type: "alert_error",
            priority: "critical",
            data: {
              error: (error as Error).message,
              context: "Alert Processing - Simplified",
              timestamp: new Date().toISOString()
            },
            timestamp: new Date(),
          });
          console.log("Successfully queued simplified error");
        } catch (simplifiedQueueError) {
          console.error("Failed to queue even simplified error:", simplifiedQueueError);
        }
      }
      
      // Continue to next row
      currentIndex++;
      timeoutId = setTimeout(processRow, 5000);
    }
  };

  processRow();

  // Return a cleanup function to stop monitoring
  return () => {
    isMonitoringActive = false;
    clearTimeout(timeoutId);
  };
};