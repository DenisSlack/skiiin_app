import { useLocation } from "wouter";
import EmailLogin from "@/components/auth/email-login";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLoginSuccess = () => {
    // Invalidate queries to refetch user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    // Redirect to home page
    setLocation("/");
  };

  return (
    <EmailLogin onSuccess={handleLoginSuccess} />
  );
}