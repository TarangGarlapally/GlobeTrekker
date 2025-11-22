import React, { useState } from 'react';
import GlobeMap from './components/GlobeMap';
import AttractionPanel from './components/AttractionPanel';
import { Landmark } from './types';
import { Compass } from 'lucide-react';

const App: React.FC = () => {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [isExploring, setIsExploring] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* UI Overlay: Title */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Compass className="text-white w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Globe Trekker AI</h1>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider opacity-80">
              Powered by Gemini
            </p>
          </div>
        </div>
      </div>

      {/* UI Overlay: Legend - Only visible when exploring (zoomed in) */}
      <div className={`absolute bottom-6 left-6 z-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 pointer-events-none select-none transition-all duration-500 transform ${isExploring ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Map Key</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow shadow-amber-500/50"></span>
            <span className="text-gray-300 text-xs">Cultural</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
            <span className="text-gray-300 text-xs">Natural</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow shadow-blue-500/50"></span>
            <span className="text-gray-300 text-xs">Modern</span>
          </div>
        </div>
      </div>
      
      {/* Main 3D Globe */}
      <GlobeMap 
        onSelectLandmark={setSelectedLandmark} 
        onZoomLevelChange={setIsExploring}
      />

      {/* Detail Panel */}
      {selectedLandmark && (
        <AttractionPanel 
          landmark={selectedLandmark} 
          onClose={() => setSelectedLandmark(null)} 
        />
      )}
    </div>
  );
};

export default App;