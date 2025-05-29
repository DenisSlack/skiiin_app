import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SkinProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkinProfileModal({ isOpen, onClose }: SkinProfileModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [skinType, setSkinType] = useState("");
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("PUT", "/api/profile/skin", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your skin profile has been saved successfully!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const skinTypes = [
    { value: "oily", label: "Oily", description: "Shiny, enlarged pores, prone to acne" },
    { value: "dry", label: "Dry", description: "Tight, flaky, rough texture" },
    { value: "combination", label: "Combination", description: "Oily T-zone, dry or normal cheeks" },
    { value: "sensitive", label: "Sensitive", description: "Easily irritated, reactive to products" },
    { value: "normal", label: "Normal", description: "Balanced, rarely problematic" },
  ];

  const concernOptions = [
    "Acne", "Aging", "Dark spots", "Sensitivity", "Dryness", "Oiliness", 
    "Large pores", "Dullness", "Wrinkles", "Redness"
  ];

  const allergyOptions = [
    "Fragrances", "Sulfates", "Parabens", "Alcohol", "Essential oils",
    "Retinoids", "Alpha hydroxy acids", "Beta hydroxy acids"
  ];

  const preferenceOptions = [
    "Cruelty-free", "Vegan", "Natural ingredients", "Organic", 
    "Fragrance-free", "Paraben-free", "Sulfate-free"
  ];

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit profile
      updateProfileMutation.mutate({
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
      case 1: return skinType !== "";
      case 2: return true; // Concerns are optional
      case 3: return true; // Allergies are optional
      case 4: return true; // Preferences are optional
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Skin Profile Setup</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
          
          {/* Step Content */}
          <div className="space-y-4">
            {currentStep === 1 && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">What's your skin type?</h4>
                  <p className="text-sm text-gray-600 mb-4">This helps us understand your skin's characteristics</p>
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
                  <h4 className="font-semibold mb-2">What are your main skin concerns?</h4>
                  <p className="text-sm text-gray-600 mb-4">Select all that apply (optional)</p>
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
                  <h4 className="font-semibold mb-2">Do you have any known allergies?</h4>
                  <p className="text-sm text-gray-600 mb-4">Select any ingredients you're allergic to (optional)</p>
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
                  <h4 className="font-semibold mb-2">Any product preferences?</h4>
                  <p className="text-sm text-gray-600 mb-4">Select your preferences (optional)</p>
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
              Back
            </Button>
            <Button
              className="flex-1 app-gradient text-white font-medium"
              onClick={handleNext}
              disabled={!canProceed() || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                "Saving..."
              ) : currentStep === totalSteps ? (
                "Complete"
              ) : (
                <>
                  Next
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
