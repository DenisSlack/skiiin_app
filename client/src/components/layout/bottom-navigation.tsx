import { useLocation } from "wouter";
import { Home, History, Camera, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Главная" },
    { path: "/library", icon: History, label: "История" },
    { path: "/scanner", icon: Camera, label: "Сканер", isFloating: true },
    { path: "/discover", icon: Sparkles, label: "Открыть" },
    { path: "/profile", icon: User, label: "Профиль" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map(({ path, icon: Icon, label, isFloating }) => (
          <Button
            key={path}
            variant="ghost"
            className={`flex flex-col items-center space-y-1 py-2 px-3 ${
              isFloating 
                ? "relative -top-6 w-14 h-14 app-gradient rounded-full shadow-lg text-white hover:text-white" 
                : location === path 
                  ? "text-primary" 
                  : "text-gray-400"
            }`}
            onClick={() => setLocation(path)}
          >
            <Icon className={isFloating ? "text-xl" : "text-lg"} />
            {!isFloating && (
              <span className="text-xs font-medium">{label}</span>
            )}
          </Button>
        ))}
      </div>
    </nav>
  );
}
