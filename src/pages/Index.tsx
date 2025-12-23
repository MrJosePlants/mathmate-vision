import { useState, useCallback } from "react";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { LiveScreenPreview } from "@/components/LiveScreenPreview";
import { SolutionDisplay } from "@/components/SolutionDisplay";
import { HistoryPanel } from "@/components/HistoryPanel";
import { DavidChat } from "@/components/DavidChat";
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

  const analyzeMathProblem = useCallback(async (imageData: string) => {
    setIsLoading(true);
    setSolution(null);
    setCapturedImage(imageData);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-math', {
        body: { image: imageData, type: 'capture' }
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
        title: "Answer found!",
        description: "Check out the answer below",
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
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 glow">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text">
              MathSolver AI
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Share your screen to get instant answers, or chat with David for help
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Preview */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl">Live Screen</h2>
              </div>
              
              <LiveScreenPreview 
                onCapture={analyzeMathProblem}
                isLoading={isLoading}
              />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="glass rounded-xl p-8 text-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
                <p className="font-display text-lg">Finding the answer...</p>
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
            {/* David Chat */}
            <DavidChat />
            
            {/* History */}
            <HistoryPanel 
              history={history}
              onSelect={handleHistorySelect}
              onClear={clearHistory}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Built for learning</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
