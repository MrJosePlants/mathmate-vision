import { useState, useCallback, useRef, useEffect } from "react";
import { Monitor, Camera, StopCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LiveScreenPreviewProps {
  onCapture: (imageData: string) => void;
  isLoading: boolean;
}

export const LiveScreenPreview = ({ onCapture, isLoading }: LiveScreenPreviewProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
        description: "Click 'Capture' to analyze the math problem",
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
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/png");
      onCapture(imageData);
    }
  }, [stream, onCapture]);

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsSharing(false);
  }, [stream]);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="aspect-video bg-background/50 relative">
        {isSharing ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Monitor className="w-16 h-16 opacity-30" />
            <p className="text-sm">No screen shared</p>
          </div>
        )}
        
        {isSharing && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Live</span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex gap-3">
        {!isSharing ? (
          <Button
            onClick={startScreenShare}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            <Play className="w-4 h-4" />
            Start Screen Share
          </Button>
        ) : (
          <>
            <Button
              onClick={captureScreen}
              disabled={isLoading}
              className="flex-1 gap-2 glow"
            >
              <Camera className="w-4 h-4" />
              Capture
            </Button>
            <Button
              onClick={stopSharing}
              variant="destructive"
              size="icon"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
