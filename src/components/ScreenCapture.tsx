import { useState, useCallback } from "react";
import { Monitor, Camera, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ScreenCaptureProps {
  onCapture: (imageData: string) => void;
  isLoading: boolean;
}

export const ScreenCapture = ({ onCapture, isLoading }: ScreenCaptureProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const startScreenShare = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
        audio: false,
      });
      
      setStream(mediaStream);
      setIsSharing(true);

      mediaStream.getVideoTracks()[0].onended = () => {
        setIsSharing(false);
        setStream(null);
      };

      toast({
        title: "Screen sharing started",
        description: "Click 'Capture' to analyze the math problem on screen",
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        title: "Screen sharing failed",
        description: "Please allow screen sharing permission",
        variant: "destructive",
      });
    }
  }, [toast]);

  const captureScreen = useCallback(async () => {
    if (!stream) return;

    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/png");
      onCapture(imageData);
      
      toast({
        title: "Screen captured!",
        description: "Analyzing the math problem...",
      });
    }

    video.pause();
    video.srcObject = null;
  }, [stream, onCapture, toast]);

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsSharing(false);
  }, [stream]);

  return (
    <div className="flex flex-col gap-4">
      {!isSharing ? (
        <Button
          onClick={startScreenShare}
          disabled={isLoading}
          variant="secondary"
          className="w-full h-16 gap-3 font-display text-base hover:shadow-glow hover:border-primary/50 transition-all"
        >
          <Monitor className="w-5 h-5" />
          Share Screen
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={captureScreen}
            disabled={isLoading}
            className="flex-1 h-16 gap-3 font-display text-base glow"
          >
            <Camera className="w-5 h-5" />
            Capture
          </Button>
          <Button
            onClick={stopSharing}
            variant="destructive"
            className="h-16 px-6"
          >
            <StopCircle className="w-5 h-5" />
          </Button>
        </div>
      )}
      
      {isSharing && (
        <p className="text-sm text-muted-foreground text-center animate-pulse">
          Screen sharing active • Position the math problem on screen
        </p>
      )}
    </div>
  );
};
