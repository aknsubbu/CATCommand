import FirestoreService, { WorkOrder } from "@/services/FirestoreService";
import { getFullLocation } from "@/services/locationServices";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { spacing, typography } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

// CAT Color Scheme
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
};

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}



export default function WorkOrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const workOrderId = params.workOrderID;
  const { user } = useAuth();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation]=useState();
  const [startingWork, setStartingWork] = useState(false);
  
  // Stopwatch and location tracking state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Refs for intervals
  const stopwatchInterval = useRef<number | null>(null);
  const locationInterval = useRef<number | null>(null);

  const locPull=()=>{
getFullLocation().then((location) => {
    if (location) {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy ?? undefined      };
      setCurrentLocation(locationData);
    } else {
      console.log("Could not get location");
    }
  });
}

  useEffect(() => {

    locPull()
    loadWorkOrder();
    
    // Cleanup intervals on unmount
    return () => {
      if (stopwatchInterval.current) {
        clearInterval(stopwatchInterval.current);
      }
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, [workOrderId]);

 



  const startStopwatch = () => {
    setIsTimerRunning(true);
    setElapsedTime(0);
    
    // Start stopwatch interval (updates every second)
    stopwatchInterval.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    // Start location tracking interval (every 10 seconds)
    if (locationPermission) {
      locPull(); // Get initial location
      locationInterval.current = setInterval(() => {
        locPull ();
      }, 10000); // 10 seconds
    }
  };

  const stopStopwatch = () => {
    setIsTimerRunning(false);
    
    if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
      stopwatchInterval.current = null;
    }
    
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  const formatStopwatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      if (typeof workOrderId === 'string') {
        const order = await FirestoreService.getWorkOrder(workOrderId);
        setWorkOrder(order);
        
        // If work order is already in progress, start the timer
        if (order?.status === 'in_progress') {
          startStopwatch();
        }
      }
    } catch (error) {
      console.error('Error loading work order:', error);
      Alert.alert('Error', 'Failed to load work order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!workOrder) return;
    
    Alert.alert(
      'Start Work Order',
      'Are you sure you want to start this work order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              setStartingWork(true);
              await FirestoreService.updateWorkOrderStatus(workOrder.id, 'in_progress');
              setWorkOrder(prev => prev ? { ...prev, status: 'in_progress' } : null);
              
              // Start the stopwatch and location tracking
              startStopwatch();
              
              Alert.alert('Success', 'Work order started successfully!');
            } catch (error) {
              console.error('Error starting work order:', error);
              Alert.alert('Error', 'Failed to start work order');
            } finally {
              setStartingWork(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteWork = async () => {
    if (!workOrder) return;
    
    Alert.alert(
      'Complete Work Order',
      'Are you sure you want to mark this work order as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setStartingWork(true);
              await FirestoreService.updateWorkOrderStatus(workOrder.id, 'completed');
              setWorkOrder(prev => prev ? { ...prev, status: 'completed' } : null);
              
              // Stop the stopwatch and location tracking
              stopStopwatch();
              
              Alert.alert('Success', 'Work order completed successfully!');
            } catch (error) {
              console.error('Error completing work order:', error);
              Alert.alert('Error', 'Failed to complete work order');
            } finally {
              setStartingWork(false);
            }
          }
        }
      ]
    );
  };

  const toggleCheckpoint = async (checkpointId: string) => {
    if (!workOrder) return;
    
    try {
      const checkpoint = workOrder.checkpoints.find(cp => cp.id === checkpointId);
      if (!checkpoint) return;
      
      const newCompletedState = !checkpoint.completed;
      await FirestoreService.updateCheckpointStatus(workOrder.id, checkpointId, newCompletedState, false);
      
      // Update local state
      setWorkOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          checkpoints: prev.checkpoints.map(cp => 
            cp.id === checkpointId 
              ? { ...cp, completed: newCompletedState }
              : cp
          )
        };
      });
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      Alert.alert('Error', 'Failed to update checkpoint');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return catColors.status.urgent;
      case "high": return catColors.status.high;
      case "medium": return catColors.status.medium;
      case "low": return catColors.status.low;
      default: return catColors.status.medium;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return catColors.status.pending;
      case "in_progress": return catColors.status.inProgress;
      case "completed": return catColors.status.completed;
      case "cancelled": return catColors.status.cancelled;
      default: return catColors.status.pending;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not set';
    const date = FirestoreService.timestampToDate(timestamp);
    if (!date) return 'Invalid date';
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCompletedCheckpoints = () => {
    if (!workOrder) return 0;
    return workOrder.checkpoints.filter(cp => cp.completed).length;
  };

  const getProgressPercentage = () => {
    if (!workOrder || workOrder.checkpoints.length === 0) return 0;
    return (getCompletedCheckpoints() / workOrder.checkpoints.length) * 100;
  };

  const canStartWork = () => {
    return workOrder?.status === 'pending' && user;
  };

  const canCompleteWork = () => {
    return workOrder?.status === 'in_progress' && user;
  };

  const formatLocation = (location: any) => {
    if (!location) return 'No location specified';
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    return 'Location not available';
  };

  const formatLocationWithAccuracy = (location: LocationData) => {
    const accuracy = location.accuracy ? ` (±${location.accuracy.toFixed(0)}m)` : '';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}${accuracy}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={catColors.primary} />
        <Text style={styles.loadingText}>Loading work order...</Text>
      </View>
    );
  }

  if (!workOrder) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={catColors.status.cancelled} />
        <Text style={styles.errorTitle}>Work Order Not Found</Text>
        <Text style={styles.errorText}>The requested work order could not be found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={catColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Order Details</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workOrder.status) }]}>
            <Text style={styles.statusText}>{workOrder.status.replace("_", " ").toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Work Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
              <Text style={styles.machineId}>{workOrder.assignedMachineId || "No machine assigned"}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(workOrder.priority) }]}>
              <Text style={styles.priorityText}>{workOrder.priority.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{workOrder.description}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={catColors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Estimated Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(workOrder.estimatedDuration)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={catColors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{formatLocation(workOrder.location)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={catColors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Assigned Operator</Text>
              <Text style={styles.infoValue}>{workOrder.assignedOperatorId}</Text>
            </View>
          </View>
        </View>

        {/* Stopwatch and Location Card - Only show when work is in progress */}
        {workOrder.status === 'in_progress' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Work Session</Text>
            
            {/* Stopwatch */}
            <View style={styles.stopwatchContainer}>
              <View style={styles.stopwatchRow}>
                <Ionicons name="time" size={24} color={catColors.primary} />
                <Text style={styles.stopwatchTime}>{formatStopwatchTime(elapsedTime)}</Text>
                <View style={[styles.timerStatus, { backgroundColor: isTimerRunning ? catColors.status.completed : catColors.status.cancelled }]}>
                  <Text style={styles.timerStatusText}>{isTimerRunning ? 'RUNNING' : 'STOPPED'}</Text>
                </View>
              </View>
            </View>

            {/* Current Location */}
            <View style={styles.locationContainer}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color={catColors.primary} />
                <Text style={styles.locationTitle}>Current Location</Text>
              </View>
              
              {locationError ? (
                <Text style={styles.locationError}>{locationError}</Text>
              ) : currentLocation ? (
                <View>
                  <Text style={styles.locationCoordinates}>
                    {formatLocationWithAccuracy(currentLocation)}
                  </Text>
                  <Text style={styles.locationTimestamp}>
                    Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.locationLoading}>Getting location...</Text>
              )}
            </View>
          </View>
        )}

        {/* Schedule Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Scheduled Start:</Text>
            <Text style={styles.scheduleValue}>{formatDate(workOrder.scheduledStart)}</Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Scheduled End:</Text>
            <Text style={styles.scheduleValue}>{formatDate(workOrder.scheduledEnd)}</Text>
          </View>
          
          {workOrder.actualStart && (
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Actual Start:</Text>
              <Text style={[styles.scheduleValue, { color: catColors.status.inProgress }]}>
                {formatDate(workOrder.actualStart)}
              </Text>
            </View>
          )}
          
          {workOrder.actualEnd && (
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Actual End:</Text>
              <Text style={[styles.scheduleValue, { color: catColors.status.completed }]}>
                {formatDate(workOrder.actualEnd)}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(getProgressPercentage())}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
          </View>
          
          <Text style={styles.progressText}>
            {getCompletedCheckpoints()} of {workOrder.checkpoints.length} checkpoints completed
          </Text>
        </View>

        {/* Checkpoints Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Checkpoints</Text>
          
          {workOrder.checkpoints.map((checkpoint, index) => (
            <TouchableOpacity
              key={checkpoint.id}
              style={styles.checkpointItem}
              onPress={() => toggleCheckpoint(checkpoint.id)}
              disabled={workOrder.status !== 'in_progress'}
            >
              <View style={styles.checkpointLeft}>
                <View style={[
                  styles.checkpointIndicator,
                  checkpoint.completed && styles.checkpointCompleted
                ]}>
                  {checkpoint.completed && (
                    <Ionicons name="checkmark" size={16} color={catColors.text.light} />
                  )}
                </View>
                <View style={styles.checkpointContent}>
                  <Text style={[
                    styles.checkpointDescription,
                    checkpoint.completed && styles.checkpointDescriptionCompleted
                  ]}>
                    {checkpoint.description}
                  </Text>
                  {checkpoint.gpsTagged && (
                    <View style={styles.gpsTag}>
                      <Ionicons name="location" size={12} color={catColors.primary} />
                      <Text style={styles.gpsTagText}>GPS Tagged</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.checkpointNumber}>{index + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes Card */}
        {workOrder.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{workOrder.notes}</Text>
          </View>
        )}

        {/* Bottom spacing for fixed button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Action Button */}
      <View style={styles.actionButtonContainer}>
        {canStartWork() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartWork}
            disabled={startingWork}
          >
            {startingWork ? (
              <ActivityIndicator size="small" color={catColors.text.light} />
            ) : (
              <>
                <Ionicons name="play" size={20} color={catColors.text.light} />
                <Text style={styles.actionButtonText}>Start Work Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canCompleteWork() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteWork}
            disabled={startingWork}
          >
            {startingWork ? (
              <ActivityIndicator size="small" color={catColors.text.light} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={catColors.text.light} />
                <Text style={styles.actionButtonText}>Complete Work Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {workOrder.status === 'completed' && (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Ionicons name="checkmark-circle" size={20} color={catColors.text.light} />
            <Text style={styles.actionButtonText}>Work Order Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: catColors.background.light,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: catColors.background.light,
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    backgroundColor: catColors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  backIcon: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 6,
  },
  statusText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    padding: spacing.base,
  },
  card: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  workOrderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  machineId: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
  },
  priorityText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  description: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoContent: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    fontWeight: '500',
  },
  // Stopwatch and Location Styles
  stopwatchContainer: {
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  stopwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopwatchTime: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: catColors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  timerStatus: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  timerStatusText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  locationContainer: {
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    padding: spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: catColors.text.primary,
    marginLeft: spacing.xs,
  },
  locationCoordinates: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.primary,
    fontFamily: 'monospace',
    marginBottom: spacing.xs / 2,
  },
  locationTimestamp: {
    fontSize: typography.fontSize.xs,
    color: catColors.text.secondary,
  },
  locationError: {
    fontSize: typography.fontSize.sm,
    color: catColors.status.cancelled,
  },
  locationLoading: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scheduleLabel: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
  },
  scheduleValue: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    fontWeight: '500',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressPercentage: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: catColors.background.gray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: catColors.primary,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    textAlign: 'center',
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  checkpointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkpointIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: catColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkpointCompleted: {
    backgroundColor: catColors.status.completed,
    borderColor: catColors.status.completed,
  },
  checkpointContent: {
    flex: 1,
  },
  checkpointDescription: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  checkpointDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: catColors.text.secondary,
  },
  gpsTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsTagText: {
    fontSize: typography.fontSize.xs,
    color: catColors.primary,
    marginLeft: spacing.xs / 2,
  },
  checkpointNumber: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    fontWeight: '500',
  },
  notesText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 80,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: catColors.background.light,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: catColors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    borderRadius: 8,
    gap: spacing.sm,
  },
  startButton: {
    backgroundColor: catColors.status.inProgress,
  },
  completeButton: {
    backgroundColor: catColors.status.completed,
  },
  completedButton: {
    backgroundColor: catColors.text.secondary,
  },
  actionButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});