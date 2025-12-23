import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryItem {
  id: string;
  image: string;
  solution: string;
  timestamp: Date;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryPanel = ({ history, onSelect, onClear }: HistoryPanelProps) => {
  if (history.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No history yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Solved problems will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-display">History</h3>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-64">
        <div className="p-3 space-y-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-secondary/50 transition-colors text-left"
            >
              <img
                src={item.image}
                alt="Problem thumbnail"
                className="w-12 h-12 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {item.solution.slice(0, 50)}...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
