import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: "Sign In",
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{
          title: "Create Account",
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          title: "Reset Password",
        }} 
      />
    </Stack>
  );
}