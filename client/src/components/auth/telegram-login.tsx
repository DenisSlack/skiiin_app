import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface TelegramLoginProps {
  onSuccess: (user: any, token: string) => void;
}

export function TelegramLogin({ onSuccess }: TelegramLoginProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [messageId, setMessageId] = useState<number | null>(null);
  const { toast } = useToast();

  const sendCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch('/api/auth/telegram/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка отправки кода');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setMessageId(data.messageId);
      setStep("code");
      toast({
        title: "Код отправлен",
        description: "Проверьте Telegram или SMS для получения кода подтверждения",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить код",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const response = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка верификации кода');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Успешно",
        description: data.message || "Вход выполнен успешно",
      });
      onSuccess(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Неверный код",
        variant: "destructive",
      });
    },
  });

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите номер телефона",
        variant: "destructive",
      });
      return;
    }
    sendCodeMutation.mutate(phone);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код подтверждения",
        variant: "destructive",
      });
      return;
    }
    verifyCodeMutation.mutate({ phone, code });
  };

  const handleBack = () => {
    setStep("phone");
    setCode("");
    setMessageId(null);
  };

  if (step === "phone") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-blue-600" />
          <CardTitle>Вход через Telegram</CardTitle>
          <CardDescription>
            Введите номер телефона для получения кода в Telegram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-phone">Номер телефона</Label>
              <Input
                id="telegram-phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={sendCodeMutation.isPending}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={sendCodeMutation.isPending}
            >
              {sendCodeMutation.isPending ? (
                "Отправка..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Отправить код в Telegram
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-blue-600" />
        <CardTitle>Введите код из Telegram</CardTitle>
        <CardDescription>
          Код отправлен в Telegram на номер {phone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegram-code">Код подтверждения</Label>
            <Input
              id="telegram-code"
              type="text"
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={verifyCodeMutation.isPending}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={verifyCodeMutation.isPending}
            >
              {verifyCodeMutation.isPending ? "Проверка..." : "Войти"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleBack}
              disabled={verifyCodeMutation.isPending}
            >
              Изменить номер
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}