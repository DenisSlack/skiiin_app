import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn, UserPlus, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LoginProps {
  onSuccess: () => void;
  onSwitchToSms?: () => void;
}

export default function Login({ onSuccess, onSwitchToSms }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("/api/auth/login", "POST", credentials);
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
        title: "Ошибка входа",
        description: error.message || "Неверный логин или пароль",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("/api/auth/register", "POST", userData);
    },
    onSuccess: () => {
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в Skiiin IQ",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Не удалось создать аккаунт",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      if (!formData.username.trim() || !formData.password.trim()) {
        toast({
          title: "Ошибка",
          description: "Введите логин и пароль",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({
        username: formData.username,
        password: formData.password,
      });
    } else {
      if (!formData.username.trim() || !formData.password.trim()) {
        toast({
          title: "Ошибка",
          description: "Логин и пароль обязательны",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
    });
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Вход в Skiiin IQ' : 'Регистрация'}
          </CardTitle>
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'Введите ваши учетные данные'
              : 'Создайте новый аккаунт'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                placeholder="ваш_логин"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (необязательно)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ваш@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Имя"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Фамилия"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                "Обработка..."
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Войти
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Зарегистрироваться
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={switchMode}
                disabled={isLoading}
              >
                {mode === 'login' 
                  ? 'Нет аккаунта? Зарегистрируйтесь'
                  : 'Уже есть аккаунт? Войдите'
                }
              </Button>

              {mode === 'login' && onSwitchToSms && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={onSwitchToSms}
                  disabled={isLoading}
                >
                  Войти через SMS
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}