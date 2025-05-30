import { useLocation } from "wouter";
import Login from "@/components/auth/email-login";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLoginSuccess = () => {
    // Invalidate queries to refetch user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    // Redirect to home page
    setLocation("/");
  };

  return (
    <Login onSuccess={handleLoginSuccess} />
  );
}