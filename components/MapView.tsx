import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { getFullLocation } from "@/services/locationServices";

interface MarkerData {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

interface MapViewWithMarkersProps {
  markers: MarkerData[];
  initialRegion?: Region;
}

export default function MapViewWithMarkers({
  markers,
  initialRegion = {
    latitude: 13.0843,
    longitude: 80.2705,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
}: MapViewWithMarkersProps) {
  const mapRef = useRef<MapView>(null);
  const [lat, setLat] = useState<number | undefined>();
  const [long, setLong] = useState<number | undefined>();

  useEffect(() => {
    getFullLocation().then((location) => {
      if (location) {
        setLat(location.coords.latitude);
        setLong(location.coords.longitude);
      } else {
        console.log("Could not get location");
      }
    });
  }, []);

  const [region, setRegion] = useState<Region>(initialRegion);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </MapView>
      {/* Coordinates overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 32,
          alignSelf: "center",
          backgroundColor: "white",
          padding: 12,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 8,
          opacity: 0.8,
        }}
      >
        <Text style={{ textAlign: "center", fontWeight: "500", fontSize: 14 }}>
          Lat: {region.latitude.toFixed(6)}
        </Text>
        <Text style={{ textAlign: "center", fontWeight: "500", fontSize: 14 }}>
          Long: {region.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
}
