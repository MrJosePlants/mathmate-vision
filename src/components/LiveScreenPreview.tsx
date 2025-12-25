import { useState, useCallback, useRef, useEffect } from "react";
import { Monitor, Camera, StopCircle, Play, Pencil, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LiveScreenPreviewProps {
  onCapture: (imageData: string) => void;
  isLoading: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
}

export const LiveScreenPreview = ({ onCapture, isLoading }: LiveScreenPreviewProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
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
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const drawPath = (points: Point[]) => {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      };

      paths.forEach((path) => drawPath(path.points));
      if (currentPath.length > 1) {
        drawPath(currentPath);
      }
    };

    drawOverlay();
  }, [paths, currentPath, isSharing]);

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
        setPaths([]);
      };

      toast({
        title: "Screen sharing started",
        description: "Draw freely to highlight problems, then capture",
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
    setCurrentPath([{ x, y }]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawMode) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (currentPath.length > 1) {
      setPaths((prev) => [...prev, { points: currentPath }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
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
      
      // Draw paths on the captured image
      if (paths.length > 0) {
        const scaleX = video.videoWidth / video.offsetWidth;
        const scaleY = video.videoHeight / video.offsetHeight;
        
        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        paths.forEach((path) => {
          if (path.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(path.points[0].x * scaleX, path.points[0].y * scaleY);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x * scaleX, path.points[i].y * scaleY);
          }
          ctx.stroke();
        });
      }
      
      const imageData = canvas.toDataURL("image/png");
      onCapture(imageData);
    }
  }, [stream, onCapture, paths]);

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsSharing(false);
    setPaths([]);
  }, [stream]);

  const clearDrawings = () => {
    setPaths([]);
    setCurrentPath([]);
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
              <Pencil className="w-4 h-4" />
            </Button>
            {paths.length > 0 && (
              <Button
                onClick={clearDrawings}
                variant="outline"
                size="icon"
                title="Clear drawings"
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