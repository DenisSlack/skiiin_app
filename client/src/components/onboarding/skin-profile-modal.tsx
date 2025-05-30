import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SkinProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkinProfileModal({ isOpen, onClose }: SkinProfileModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [gender, setGender] = useState("");
  const [age, setAge] = useState(25);
  const [skinType, setSkinType] = useState("");
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest("/api/profile/skin", "PUT", profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль кожи успешно сохранен!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить профиль. Попробуйте еще раз.",
        variant: "destructive",
      });
    },
  });

  const skinTypes = [
    { value: "oily", label: "Жирная", description: "Блестящая, расширенные поры, склонность к акне" },
    { value: "dry", label: "Сухая", description: "Стянутость, шелушение, грубая текстура" },
    { value: "combination", label: "Комбинированная", description: "Жирная T-зона, сухие или нормальные щеки" },
    { value: "sensitive", label: "Чувствительная", description: "Легко раздражается, реагирует на продукты" },
    { value: "normal", label: "Нормальная", description: "Сбалансированная, редко проблемная" },
  ];

  const concernOptions = [
    "Акне", "Старение", "Темные пятна", "Чувствительность", "Сухость", "Жирность", 
    "Расширенные поры", "Тусклость", "Морщины", "Покраснения"
  ];

  const allergyOptions = [
    "Ароматизаторы", "Сульфаты", "Парабены", "Спирт", "Эфирные масла",
    "Ретиноиды", "Альфа-гидроксикислоты", "Бета-гидроксикислоты"
  ];

  const preferenceOptions = [
    "Не тестируется на животных", "Веганские продукты", "Натуральные ингредиенты", "Органические", 
    "Без ароматизаторов", "Без парабенов", "Без сульфатов"
  ];

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit profile
      updateProfileMutation.mutate({
        gender,
        age,
        skinType,
        skinConcerns,
        allergies,
        preferences,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return gender !== "";
      case 2: return age >= 13 && age <= 100;
      case 3: return skinType !== "";
      case 4: return true; // Concerns are optional
      case 5: return true; // Allergies are optional
      case 6: return true; // Preferences are optional
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Профиль кожи</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Шаг {currentStep} из {totalSteps}</span>
              <span>{Math.round(progress)}% завершено</span>
            </div>
          </div>
          
          {/* Step Content */}
          <div className="space-y-4">
            {currentStep === 1 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Укажите ваш пол</h4>
                  <p className="text-sm text-gray-600 mb-4">Это поможет нам предложить подходящие продукты</p>
                </div>
                
                <RadioGroup value={gender} onValueChange={setGender} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Женский</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Мужской</Label>
                  </div>
                </RadioGroup>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Укажите ваш возраст</h4>
                  <p className="text-sm text-gray-600 mb-4">Возраст важен для подбора подходящих средств ухода</p>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-blue-600">{age} лет</span>
                  </div>
                  <Slider
                    value={[age]}
                    onValueChange={(value) => setAge(value[0])}
                    max={80}
                    min={13}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>13 лет</span>
                    <span>80 лет</span>
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Какой у вас тип кожи?</h4>
                  <p className="text-sm text-gray-600 mb-4">Это поможет нам понять особенности вашей кожи</p>
                </div>
                
                <div className="space-y-3">
                  {skinTypes.map(({ value, label, description }) => (
                    <Label
                      key={value}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="skinType"
                        value={value}
                        checked={skinType === value}
                        onChange={(e) => setSkinType(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-gray-600">{description}</p>
                      </div>
                    </Label>
                  ))}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Какие у вас основные проблемы с кожей?</h4>
                  <p className="text-sm text-gray-600 mb-4">Выберите все подходящие варианты (необязательно)</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {concernOptions.map((concern) => (
                    <Label
                      key={concern}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={skinConcerns.includes(concern)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSkinConcerns([...skinConcerns, concern]);
                          } else {
                            setSkinConcerns(skinConcerns.filter(c => c !== concern));
                          }
                        }}
                      />
                      <span className="text-sm">{concern}</span>
                    </Label>
                  ))}
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Есть ли у вас известные аллергии?</h4>
                  <p className="text-sm text-gray-600 mb-4">Выберите ингредиенты, на которые у вас аллергия (необязательно)</p>
                </div>
                
                <div className="space-y-2">
                  {allergyOptions.map((allergy) => (
                    <Label
                      key={allergy}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={allergies.includes(allergy)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAllergies([...allergies, allergy]);
                          } else {
                            setAllergies(allergies.filter(a => a !== allergy));
                          }
                        }}
                      />
                      <span className="text-sm">{allergy}</span>
                    </Label>
                  ))}
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Какие у вас предпочтения к продуктам?</h4>
                  <p className="text-sm text-gray-600 mb-4">Выберите ваши предпочтения (необязательно)</p>
                </div>
                
                <div className="space-y-2">
                  {preferenceOptions.map((preference) => (
                    <Label
                      key={preference}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={preferences.includes(preference)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreferences([...preferences, preference]);
                          } else {
                            setPreferences(preferences.filter(p => p !== preference));
                          }
                        }}
                      />
                      <span className="text-sm">{preference}</span>
                    </Label>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Назад
            </Button>
            <Button
              className="flex-1 app-gradient text-white font-medium"
              onClick={handleNext}
              disabled={!canProceed() || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                "Сохранение..."
              ) : currentStep === totalSteps ? (
                "Завершить"
              ) : (
                <>
                  Далее
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
