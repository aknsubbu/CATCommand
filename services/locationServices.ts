import * as Device from "expo-device";
import * as Location from "expo-location";
import { Platform } from "react-native";

/**
 * Get current location coordinates
 * @returns {Promise<{lat: number, lng: number} | null>} Location object or null if failed
 */
export const getLocation = async () => {
  try {
    // Check if running on Android emulator
    if (Platform.OS === "android" && !Device.isDevice) {
      console.warn("Location not available on Android Emulator");
      return null;
    }

    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission denied");
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
};

/**
 * Get current location with full details
 * @returns {Promise<Location.LocationObject | null>} Full location object or null if failed
 */
export const getFullLocation = async () => {
  try {
    if (Platform.OS === "android" && !Device.isDevice) {
      console.warn("Location not available on Android Emulator");
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission denied");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error("Error getting full location:", error);
    return null;
  }
};

/**
 * Check if location services are available
 * @returns {Promise<boolean>} True if location services are available
 */
export const isLocationAvailable = async () => {
  try {
    if (Platform.OS === "android" && !Device.isDevice) {
      return false;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error checking location availability:", error);
    return false;
  }
};
