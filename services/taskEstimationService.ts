import Papa from 'papaparse';
import { CsvRow } from './alertService'; // Re-using CsvRow interface

interface TaskDataPoint {
  loadCycles: number;
  timeTakenMinutes: number;
}

class TaskEstimationService {
  private historicalData: TaskDataPoint[] = [];
  private averageTimePerLoadCycle: number | null = null;

  /**
   * Processes historical CSV content to build a model for task time estimation.
   * This should be called once with the full historical dataset.
   * @param csvContent The full CSV content as a string.
   */
  processHistoricalData(csvContent: string): void {
    const rows: CsvRow[] = Papa.parse(csvContent, { header: true, dynamicTyping: true, skipEmptyLines: true }).data as CsvRow[];

    if (rows.length < 2) {
      console.warn("Not enough historical data to build task estimation model.");
      return;
    }

    this.historicalData = [];
    let totalTimeTaken = 0;
    let totalLoadCycles = 0;

    for (let i = 1; i < rows.length; i++) {
      const prevRow = rows[i - 1];
      const currentRow = rows[i];

      // Ensure timestamps are valid Date objects
      const prevTimestamp = new Date(prevRow.Timestamp);
      const currentTimestamp = new Date(currentRow.Timestamp);

      if (isNaN(prevTimestamp.getTime()) || isNaN(currentTimestamp.getTime())) {
        console.warn(`Invalid timestamp found at row ${i}. Skipping.`);
        continue;
      }

      const timeDiffMinutes = (currentTimestamp.getTime() - prevTimestamp.getTime()) / (1000 * 60);
      const loadCyclesDiff = currentRow.Load_Cycles - prevRow.Load_Cycles;

      // Consider periods where load cycles increased and time difference is positive
      if (loadCyclesDiff > 0 && timeDiffMinutes > 0) {
        this.historicalData.push({
          loadCycles: loadCyclesDiff,
          timeTakenMinutes: timeDiffMinutes,
        });
        totalTimeTaken += timeDiffMinutes;
        totalLoadCycles += loadCyclesDiff;
      }
    }

    if (totalLoadCycles > 0) {
      this.averageTimePerLoadCycle = totalTimeTaken / totalLoadCycles;
      console.log(`TaskEstimationService: Model built. Average time per load cycle: ${this.averageTimePerLoadCycle.toFixed(2)} minutes.`);
    } else {
      console.warn("No productive load cycles found in historical data.");
      this.averageTimePerLoadCycle = null;
    }
  }

  /**
   * Estimates the time to complete a given number of additional load cycles.
   * @param targetLoadCycles The total number of load cycles to estimate for.
   * @returns Estimated time in minutes, or null if model is not built.
   */
  estimateTimeForLoadCycles(targetLoadCycles: number): number | null {
    if (this.averageTimePerLoadCycle === null) {
      console.warn("Task estimation model not built. Call processHistoricalData first.");
      return null;
    }
    if (targetLoadCycles <= 0) {
      return 0; // No time needed for zero or negative cycles
    }
    return targetLoadCycles * this.averageTimePerLoadCycle;
  }

  /**
   * Converts minutes to a human-readable string (e.g., "2 hours 30 minutes").
   * @param minutes The number of minutes.
   * @returns A formatted string.
   */
  formatMinutesToHoursAndMinutes(minutes: number): string {
    if (minutes < 0) return "N/A";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
    } else {
      return `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
    }
  }
}

export default new TaskEstimationService();
