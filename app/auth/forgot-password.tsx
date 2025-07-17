import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, shadows, spacing, typography } from "../../constants/theme";
import { authService } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setEmailSent(true);
    } catch (error: any) {
      let errorMessage = "Failed to send reset email";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="mail" size={80} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to {email}
          </Text>
          <Text style={styles.successSubMessage}>
            Please check your email and follow the instructions to reset your password.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => {
              setEmailSent(false);
              setEmail("");
            }}
          >
            <Text style={styles.resendButtonText}>Send Another Email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity style={styles.backIconButton} onPress={handleBackToLogin}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="lock-closed" size={60} color={colors.primary} />
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Don't worry! It happens. Please enter the email address associated with your account.
              </Text>
            </View>

            {/* Reset Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.text.secondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.text.secondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.resetButton, loading && styles.disabledButton]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Text>
              </TouchableOpacity>

              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  Remember your password?{" "}
                </Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={styles.helpLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  backIconButton: {
    position: "absolute",
    top: spacing.base,
    left: spacing.xl,
    zIndex: 1,
    padding: spacing.sm,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
    marginTop: spacing["2xl"],
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: "bold",
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.base,
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    ...shadows.base,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
    color: colors.text.light,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  helpLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  successIconContainer: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.base,
    textAlign: "center",
  },
  successMessage: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.base,
    fontWeight: "600",
  },
  successSubMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing["2xl"],
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: spacing.base,
    ...shadows.base,
  },
  backButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
    color: colors.text.light,
  },
  resendButton: {
    padding: spacing.base,
  },
  resendButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: "600",
  },
});