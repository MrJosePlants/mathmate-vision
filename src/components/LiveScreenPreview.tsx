import { useState, useCallback, useRef, useEffect } from "react";
import { Monitor, Camera, StopCircle, Play, Circle, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LiveScreenPreviewProps {
  onCapture: (imageData: string) => void;
  isLoading: boolean;
}

interface DrawingCircle {
  x: number;
  y: number;
  radius: number;
}

export const LiveScreenPreview = ({ onCapture, isLoading }: LiveScreenPreviewProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [circles, setCircles] = useState<DrawingCircle[]>([]);
  const [currentCircle, setCurrentCircle] = useState<DrawingCircle | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const drawOverlay = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !isSharing) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#00d4ff";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);

      circles.forEach((circle) => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.stroke();
      });

      if (currentCircle) {
        ctx.beginPath();
        ctx.arc(currentCircle.x, currentCircle.y, currentCircle.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    };

    drawOverlay();
  }, [circles, currentCircle, isSharing]);

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
        setCircles([]);
      };

      toast({
        title: "Screen sharing started",
        description: "Draw circles around problems, then capture",
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawMode || !isSharing) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawStart({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = (drawStart.x + x) / 2;
    const centerY = (drawStart.y + y) / 2;
    const radius = Math.sqrt(Math.pow(x - drawStart.x, 2) + Math.pow(y - drawStart.y, 2)) / 2;

    setCurrentCircle({ x: centerX, y: centerY, radius });
  };

  const handleMouseUp = () => {
    if (currentCircle && currentCircle.radius > 10) {
      setCircles((prev) => [...prev, currentCircle]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentCircle(null);
  };

  const captureScreen = useCallback(async () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      // Draw circles on the captured image
      if (circles.length > 0) {
        const scaleX = video.videoWidth / video.offsetWidth;
        const scaleY = video.videoHeight / video.offsetHeight;
        
        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 8]);
        
        circles.forEach((circle) => {
          ctx.beginPath();
          ctx.arc(
            circle.x * scaleX,
            circle.y * scaleY,
            circle.radius * Math.max(scaleX, scaleY),
            0,
            2 * Math.PI
          );
          ctx.stroke();
        });
      }
      
      const imageData = canvas.toDataURL("image/png");
      onCapture(imageData);
    }
  }, [stream, onCapture, circles]);

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsSharing(false);
    setCircles([]);
  }, [stream]);

  const clearCircles = () => {
    setCircles([]);
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div 
        className="aspect-video bg-background/50 relative"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: drawMode && isSharing ? "crosshair" : "default" }}
      >
        {isSharing ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
            />
          </>
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

        {isSharing && drawMode && (
          <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-xs font-medium text-primary-foreground">Draw Mode</span>
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
              onClick={() => setDrawMode(!drawMode)}
              variant={drawMode ? "default" : "outline"}
              size="icon"
              title="Toggle draw mode"
            >
              <Circle className="w-4 h-4" />
            </Button>
            {circles.length > 0 && (
              <Button
                onClick={clearCircles}
                variant="outline"
                size="icon"
                title="Clear circles"
              >
                <Eraser className="w-4 h-4" />
              </Button>
            )}
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
