import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export function useLogout() {
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      // Call logout API to clear server session
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        // Ignore API errors during logout
        console.warn('Logout API call failed:', error);
      }
    },
    onSuccess: () => {
      // Clear all React Query cache
      queryClient.clear();
      
      // Redirect to login page
      setLocation('/login');
    },
  });
}