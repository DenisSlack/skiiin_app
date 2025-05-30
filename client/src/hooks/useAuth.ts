import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Use unified authentication endpoint that handles both methods internally
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
