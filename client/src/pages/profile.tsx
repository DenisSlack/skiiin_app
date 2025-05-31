import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import SkinProfileModal from "@/components/onboarding/skin-profile-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Edit, LogOut, Settings, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLogout } from "@/hooks/useLogout";

export default function Profile() {
  const [showSkinProfile, setShowSkinProfile] = useState(false);
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getSkinTypeDisplay = (skinType: string) => {
    const types: Record<string, { label: string; color: string }> = {
      oily: { label: "Oily", color: "bg-blue-100 text-blue-800" },
      dry: { label: "Dry", color: "bg-orange-100 text-orange-800" },
      combination: { label: "Combination", color: "bg-purple-100 text-purple-800" },
      sensitive: { label: "Sensitive", color: "bg-red-100 text-red-800" },
      normal: { label: "Normal", color: "bg-green-100 text-green-800" },
    };
    return types[skinType] || { label: skinType, color: "bg-gray-100 text-gray-800" };
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 animate-spin mx-auto border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="app-container">
      <AppHeader />
      
      <main className="pb-20 px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">
              {user?.firstName || user?.lastName 
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "User"
              }
            </h2>
            {user?.email && (
              <p className="text-gray-600 text-sm">{user.email}</p>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Your Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats?.analyzedProducts || 0}</div>
                <div className="text-xs text-gray-600">Products Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.compatibility || 0}%</div>
                <div className="text-xs text-gray-600">Compatibility</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${stats?.savedMoney || 0}</div>
                <div className="text-xs text-gray-600">Money Saved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skin Profile */}
        <Card className="border-gray-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Skin Profile</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSkinProfile(true)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>

            {user?.profileCompleted ? (
              <div className="space-y-3">
                {user.skinType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skin Type</span>
                    <Badge className={getSkinTypeDisplay(user.skinType).color}>
                      {getSkinTypeDisplay(user.skinType).label}
                    </Badge>
                  </div>
                )}

                {user.skinConcerns && Array.isArray(user.skinConcerns) && user.skinConcerns.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Skin Concerns</span>
                    <div className="flex flex-wrap gap-2">
                      {user.skinConcerns.map((concern: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {concern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.allergies && Array.isArray(user.allergies) && user.allergies.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Allergies</span>
                    <div className="flex flex-wrap gap-2">
                      {user.allergies.map((allergy: string, index: number) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.preferences && Array.isArray(user.preferences) && user.preferences.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Preferences</span>
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.map((preference: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {preference}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 text-sm mb-3">Complete your skin profile for personalized recommendations</p>
                <Button
                  onClick={() => setShowSkinProfile(true)}
                  className="app-gradient text-white"
                >
                  Complete Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-gray-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Settings</h3>
            
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-3" />
                App Settings
              </Button>
              
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-3" />
                Help & Support
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />

      <SkinProfileModal 
        isOpen={showSkinProfile}
        onClose={() => setShowSkinProfile(false)}
      />
    </div>
  );
}
