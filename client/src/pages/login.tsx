import { useState } from "react";
import { useLocation } from "wouter";
import Login from "@/components/auth/email-login";
import SmsLogin from "@/components/auth/sms-login";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<"login" | "sms">("login");
  const queryClient = useQueryClient();

  const handleLoginSuccess = () => {
    // Invalidate queries to refetch user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    // Redirect to home page
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {authMode === "login" ? (
        <Login 
          onSuccess={handleLoginSuccess}
          onSwitchToSms={() => setAuthMode("sms")}
        />
      ) : (
        <SmsLogin 
          onSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      )}
    </div>
  );
}