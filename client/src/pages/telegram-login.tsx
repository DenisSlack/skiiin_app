import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const phoneSchema = z.object({
  phone: z.string().min(10, "Введите корректный номер телефона"),
});

const codeSchema = z.object({
  code: z.string().min(4, "Код должен содержать минимум 4 цифры").max(8, "Код должен содержать максимум 8 цифр"),
});

const smsCodeSchema = z.object({
  code: z.string().length(6, "SMS код должен содержать 6 цифр"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type CodeForm = z.infer<typeof codeSchema>;
type SmsCodeForm = z.infer<typeof smsCodeSchema>;

export default function TelegramLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("telegram");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramMessageId, setTelegramMessageId] = useState<number | null>(null);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const telegramCodeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const smsCodeForm = useForm<SmsCodeForm>({
    resolver: zodResolver(smsCodeSchema),
    defaultValues: { code: "" },
  });

  const sendTelegramCode = useMutation({
    mutationFn: async (data: PhoneForm) => {
      return await apiRequest("/api/auth/telegram/send", "POST", data);
    },
    onSuccess: (response) => {
      setPhoneNumber(phoneForm.getValues("phone"));
      if (response.telegramMessageId) {
        setTelegramMessageId(response.telegramMessageId);
      }
      setStep("code");
      toast({
        title: "Код отправлен",
        description: response.message,
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

  const sendSmsCode = useMutation({
    mutationFn: async (data: PhoneForm) => {
      return await apiRequest("/api/auth/sms/send", "POST", data);
    },
    onSuccess: (response) => {
      setPhoneNumber(phoneForm.getValues("phone"));
      setStep("code");
      toast({
        title: "SMS отправлен",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить SMS",
        variant: "destructive",
      });
    },
  });

  const verifyTelegramCode = useMutation({
    mutationFn: async (data: CodeForm) => {
      return await apiRequest("/api/auth/telegram/verify", "POST", {
        phone: phoneNumber,
        code: data.code,
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Успешно",
        description: response.message,
      });
      // Redirect to home page
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Неверный код",
        variant: "destructive",
      });
    },
  });

  const verifySmsCode = useMutation({
    mutationFn: async (data: SmsCodeForm) => {
      return await apiRequest("/api/auth/sms/verify", "POST", {
        phone: phoneNumber,
        code: data.code,
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Успешно",
        description: response.message,
      });
      // Redirect to home page
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Неверный код",
        variant: "destructive",
      });
    },
  });

  const onPhoneSubmit = (data: PhoneForm) => {
    if (activeTab === "telegram") {
      sendTelegramCode.mutate(data);
    } else {
      sendSmsCode.mutate(data);
    }
  };

  const onTelegramCodeSubmit = (data: CodeForm) => {
    verifyTelegramCode.mutate(data);
  };

  const onSmsCodeSubmit = (data: SmsCodeForm) => {
    verifySmsCode.mutate(data);
  };

  const resetForm = () => {
    setStep("phone");
    setPhoneNumber("");
    setTelegramMessageId(null);
    phoneForm.reset();
    telegramCodeForm.reset();
    smsCodeForm.reset();
  };

  if (step === "code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Введите код
            </CardTitle>
            <CardDescription>
              Код отправлен на номер: {phoneNumber}
              {activeTab === "telegram" ? " через Telegram" : " по SMS"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === "telegram" ? (
              <Form {...telegramCodeForm}>
                <form onSubmit={telegramCodeForm.handleSubmit(onTelegramCodeSubmit)} className="space-y-4">
                  <FormField
                    control={telegramCodeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Код из Telegram</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите код (4-8 цифр)"
                            {...field}
                            className="text-center text-lg"
                            maxLength={8}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={verifyTelegramCode.isPending}
                  >
                    {verifyTelegramCode.isPending ? "Проверка..." : "Войти"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...smsCodeForm}>
                <form onSubmit={smsCodeForm.handleSubmit(onSmsCodeSubmit)} className="space-y-4">
                  <FormField
                    control={smsCodeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS код</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите 6-значный код"
                            {...field}
                            className="text-center text-lg"
                            maxLength={6}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={verifySmsCode.isPending}
                  >
                    {verifySmsCode.isPending ? "Проверка..." : "Войти"}
                  </Button>
                </form>
              </Form>
            )}
            
            <Button
              variant="outline"
              onClick={resetForm}
              className="w-full"
            >
              Изменить номер
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Вход в Skiiin IQ
          </CardTitle>
          <CardDescription>
            Выберите способ получения кода подтверждения
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="telegram" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Telegram
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                SMS
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер телефона</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+7 (999) 123-45-67"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <TabsContent value="telegram" className="mt-0">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      disabled={sendTelegramCode.isPending}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {sendTelegramCode.isPending ? "Отправка..." : "Получить код в Telegram"}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="sms" className="mt-0">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      disabled={sendSmsCode.isPending}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      {sendSmsCode.isPending ? "Отправка..." : "Получить SMS код"}
                    </Button>
                  </TabsContent>
                </form>
              </Form>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}