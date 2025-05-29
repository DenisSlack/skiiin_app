import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical, Camera, UserCheck, Save } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="app-container">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
        
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto">
            <FlaskConical className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Skiiin IQ</h1>
            <p className="text-gray-600 text-lg">Smart Cosmetic Analysis</p>
          </div>
        </div>

        {/* Features */}
        <div className="w-full space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">
            Analyze ingredients. Get personalized insights.
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Scan Ingredients</h3>
                  <p className="text-sm text-gray-600">Use your camera to analyze product ingredients instantly</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Personalized Analysis</h3>
                  <p className="text-sm text-gray-600">Get recommendations based on your unique skin profile</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Save className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Build Your Library</h3>
                  <p className="text-sm text-gray-600">Save and track your skincare products over time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full app-gradient text-white py-4 text-lg font-medium"
            size="lg"
          >
            Get Started
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Make smarter skincare choices with AI-powered analysis
          </p>
        </div>

      </div>
    </div>
  );
}
