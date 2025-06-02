import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { FlaskConical, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const [, setLocation] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  return (
    <header className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <div 
          className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center cursor-pointer"
          onClick={() => setLocation("/home")}
        >
          <FlaskConical className="text-white text-sm" />
        </div>
        <h1 
          className="text-lg font-semibold cursor-pointer" 
          onClick={() => setLocation("/home")}
        >
          Skiiin IQ
        </h1>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 rounded-full p-0"
        onClick={() => setLocation("/profile")}
      >
        {user?.profileImageUrl ? (
          <img 
            src={user.profileImageUrl} 
            alt="Profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </Button>
    </header>
  );
}
