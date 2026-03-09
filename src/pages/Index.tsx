import { useDataStore } from '@/store/useDataStore';
import { DataUploader } from '@/components/DataUploader';
import { MapCanvas } from '@/components/MapCanvas';
import { FilterPanel } from '@/components/FilterPanel';
import { Timeline } from '@/components/Timeline';
import { Legend } from '@/components/Legend';
import { Database, RotateCcw } from 'lucide-react';

const Index = () => {
  const { events, setEvents } = useDataStore();
  const hasData = events.length > 0;

  if (!hasData) {
    return <DataUploader />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground tracking-tight">LILA BLACK</span>
          </div>
          <button
            onClick={() => setEvents([])}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Load new data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <FilterPanel />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <MapCanvas />
          <Legend />
        </div>
        <Timeline />
      </div>
    </div>
  );
};

export default Index;
