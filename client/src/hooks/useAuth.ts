import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check if user is authenticated via email session
  const { data: sessionUser, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  // Prefer Replit auth if available, fallback to email auth
  const currentUser = user || sessionUser;
  const loading = isLoading || sessionLoading;

  return {
    user: currentUser,
    isLoading: loading,
    isAuthenticated: !!currentUser,
  };
}
