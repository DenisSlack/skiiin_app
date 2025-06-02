import { useState } from "react";
import { useLocation } from "wouter";
import { EmailForm } from "@/components/auth/email-form";
import SmsLogin from "@/components/auth/sms-login";
import { TelegramLogin } from "@/components/auth/telegram-login";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Mail, Phone, MessageCircle } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLoginSuccess = (user?: any, token?: string) => {
    // Invalidate queries to refetch user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    
    // Redirect to home page
    setLocation("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Skiiin IQ</h1>
            <p className="text-gray-600">Войдите в свой аккаунт</p>
          </div>
        </div>

        {/* Authentication Methods */}
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Telegram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <EmailForm onSuccess={handleLoginSuccess} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="mt-6">
            <SmsLogin onSuccess={handleLoginSuccess} onSwitchToLogin={() => {}} />
          </TabsContent>

          <TabsContent value="telegram" className="mt-6">
            <TelegramLogin onSuccess={handleLoginSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}