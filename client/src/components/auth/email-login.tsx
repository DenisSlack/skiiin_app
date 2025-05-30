import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailLoginProps {
  onSuccess: () => void;
}

export default function EmailLogin({ onSuccess }: EmailLoginProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const sendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/auth/send-code", "POST", { email });
    },
    onSuccess: () => {
      setStep('code');
      toast({
        title: "Код отправлен",
        description: "Проверьте вашу почту и введите код подтверждения",
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
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      return await apiRequest("/api/auth/verify-code", "POST", { email, code });
    },
    onSuccess: () => {
      toast({
        title: "Добро пожаловать!",
        description: "Вход выполнен успешно",
      });
      onSuccess();
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
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }
    sendCodeMutation.mutate(email);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      toast({
        title: "Ошибка",
        description: "Введите 6-значный код",
        variant: "destructive",
      });
      return;
    }
    verifyCodeMutation.mutate({ email, code });
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'email' ? 'Вход в Skiiin IQ' : 'Подтверждение'}
          </CardTitle>
          <p className="text-gray-600">
            {step === 'email' 
              ? 'Введите ваш email для получения кода входа'
              : `Введите код, отправленный на ${email}`
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email адрес</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ваш@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={sendCodeMutation.isPending}
              >
                {sendCodeMutation.isPending ? (
                  "Отправляем..."
                ) : (
                  <>
                    Отправить код
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Код подтверждения</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
                <p className="text-sm text-gray-500">
                  Код действителен 10 минут
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? (
                  "Проверяем..."
                ) : (
                  <>
                    Войти
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={handleBackToEmail}
              >
                Изменить email
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => sendCodeMutation.mutate(email)}
                disabled={sendCodeMutation.isPending}
              >
                Отправить код повторно
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}