import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, Timer } from "lucide-react";

interface SmsLoginProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function SmsLogin({ onSuccess, onSwitchToLogin }: SmsLoginProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Add +7 prefix if not present
    if (digits.length > 0 && !digits.startsWith("7")) {
      return "+7" + digits;
    }
    
    if (digits.length > 0) {
      return "+" + digits;
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const sendSms = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка отправки SMS");
      }

      toast({
        title: "SMS отправлен",
        description: "Код подтверждения отправлен на ваш телефон",
      });

      setStep("code");
      
      // Start countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Ошибка",
        description: "Введите 6-значный код",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Неверный код");
      }

      toast({
        title: "Успешно",
        description: "Вход выполнен успешно",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Неверный код",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setCode("");
    setCountdown(0);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
        </div>
        <CardTitle>
          {step === "phone" ? "Вход через SMS" : "Введите код"}
        </CardTitle>
        <CardDescription>
          {step === "phone" 
            ? "Введите номер телефона для получения кода" 
            : `Код отправлен на ${phone}`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === "phone" ? (
          <>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Номер телефона
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Button 
                onClick={sendSms} 
                disabled={loading || !phone}
                className="w-full"
              >
                {loading ? "Отправка..." : "Получить код"}
              </Button>

              <Button 
                variant="outline" 
                onClick={onSwitchToLogin}
                className="w-full"
              >
                Войти по логину и паролю
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Код подтверждения
              </label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                maxLength={6}
              />
            </div>

            {countdown > 0 && (
              <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                <Timer className="h-4 w-4 mr-1" />
                Повторная отправка через {countdown} сек
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={verifyCode} 
                disabled={loading || !code || code.length !== 6}
                className="w-full"
              >
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                >
                  Назад
                </Button>

                {countdown === 0 && (
                  <Button 
                    variant="outline" 
                    onClick={sendSms}
                    disabled={loading}
                    className="flex-1"
                  >
                    Отправить снова
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}