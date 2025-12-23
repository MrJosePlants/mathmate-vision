import { useState, useCallback } from "react";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { ScreenCapture } from "@/components/ScreenCapture";
import { SolutionDisplay } from "@/components/SolutionDisplay";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HistoryItem {
  id: string;
  image: string;
  solution: string;
  timestamp: Date;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();

  const analyzeMathProblem = useCallback(async (imageData: string, type: 'upload' | 'capture') => {
    setIsLoading(true);
    setSolution(null);
    setCapturedImage(imageData);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-math', {
        body: { image: imageData, type }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSolution(data.solution);
      
      // Add to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        image: imageData,
        solution: data.solution,
        timestamp: new Date(),
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));

      toast({
        title: "Problem solved!",
        description: "Check out the step-by-step solution below",
      });
    } catch (error: any) {
      console.error("Error analyzing math problem:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the math problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setCapturedImage(item.image);
    setSolution(item.solution);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    toast({
      title: "History cleared",
      description: "All previous solutions have been removed",
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 glow">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text">
              MathSolver AI
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upload an image or share your screen to get instant step-by-step solutions 
            to any math problem
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main input area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input methods */}
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl">Capture Problem</h2>
              </div>
              
              <ImageUpload 
                onImageSelect={(img) => analyzeMathProblem(img, 'upload')}
                isLoading={isLoading}
              />
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground font-display">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <ScreenCapture 
                onCapture={(img) => analyzeMathProblem(img, 'capture')}
                isLoading={isLoading}
              />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="glass rounded-xl p-8 text-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
                <p className="font-display text-lg">Analyzing your math problem...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Our AI is working on a step-by-step solution
                </p>
              </div>
            )}

            {/* Solution display */}
            {solution && !isLoading && (
              <SolutionDisplay 
                solution={solution}
                capturedImage={capturedImage || undefined}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <HistoryPanel 
              history={history}
              onSelect={handleHistorySelect}
              onClear={clearHistory}
            />
            
            {/* Tips card */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Take clear photos with good lighting</li>
                <li>• Make sure all numbers are visible</li>
                <li>• Works with handwritten & printed math</li>
                <li>• Supports algebra, calculus, geometry & more</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Built for learning</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
