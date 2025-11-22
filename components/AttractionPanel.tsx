import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Star, Loader2, History, BookOpen, Eye, Clock, Box, ExternalLink } from 'lucide-react';
import { Landmark, AttractionDetails, GeneratedImage, HistoryEvent } from '../types';
import { fetchAttractionDetails, generateAttractionImage, fetchLandmarkHistory, generateHistoricalImage } from '../services/geminiService';

interface AttractionPanelProps {
  landmark: Landmark | null;
  onClose: () => void;
}

type Tab = 'overview' | 'history';

const AttractionPanel: React.FC<AttractionPanelProps> = ({ landmark, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Data States
  const [details, setDetails] = useState<AttractionDetails | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  
  // Image States
  const [modernImage, setModernImage] = useState<GeneratedImage | null>(null);
  const [displayImage, setDisplayImage] = useState<GeneratedImage | null>(null);
  const [historicalImages, setHistoricalImages] = useState<Record<string, GeneratedImage>>({});
  
  // Loading States
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatingHistorical, setGeneratingHistorical] = useState<string | null>(null);

  useEffect(() => {
    if (landmark) {
      // Reset all states on new landmark
      setDetails(null);
      setHistory([]);
      setModernImage(null);
      setDisplayImage(null);
      setHistoricalImages({});
      setActiveTab('overview');
      
      setLoadingDetails(true);
      setLoadingImage(true);
      setLoadingHistory(true);

      // 1. Fetch Overview Details
      fetchAttractionDetails(landmark.name, landmark.country)
        .then(setDetails)
        .finally(() => setLoadingDetails(false));

      // 2. Generate Modern Image
      generateAttractionImage(landmark.name, landmark.country)
        .then((img) => {
          setModernImage(img);
          setDisplayImage(img); // Default to modern view
        })
        .finally(() => setLoadingImage(false));

      // 3. Fetch History Timeline
      fetchLandmarkHistory(landmark.name, landmark.country)
        .then(setHistory)
        .finally(() => setLoadingHistory(false));
    }
  }, [landmark]);

  const handleVisualizeHistory = async (event: HistoryEvent) => {
    const key = event.year + event.title;
    
    // If cached, show it
    if (historicalImages[key]) {
      setDisplayImage(historicalImages[key]);
      return;
    }

    setGeneratingHistorical(key);
    if (landmark) {
      const img = await generateHistoricalImage(landmark.name, landmark.country, event);
      if (img) {
        setHistoricalImages(prev => ({ ...prev, [key]: img }));
        setDisplayImage(img);
      }
    }
    setGeneratingHistorical(null);
  };

  const handleRevertToModern = () => {
    setDisplayImage(modernImage);
  };

  if (!landmark) return null;

  // Construct Google Earth Deep Link
  // @lat,lng,altitude/distance,tilt,heading
  const googleEarthUrl = `https://earth.google.com/web/@${landmark.lat},${landmark.lng},1000d,35y,0h,60t,0r`;

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-black/90 backdrop-blur-xl border-l border-white/10 text-white shadow-2xl transition-transform duration-300 z-50 overflow-y-auto flex flex-col">
      
      {/* Header Image Area */}
      <div className="relative h-72 w-full bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden group">
        {(loadingImage || generatingHistorical) ? (
          <div className="flex flex-col items-center gap-3 text-white/50 z-10">
            <Loader2 className="animate-spin w-8 h-8" />
            <span className="text-sm font-medium">
              {generatingHistorical ? 'Reconstructing history...' : 'Generating view with Gemini...'}
            </span>
          </div>
        ) : displayImage ? (
          <>
            <img 
              src={`data:${displayImage.mimeType};base64,${displayImage.base64}`} 
              alt={landmark.name}
              className="w-full h-full object-cover animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
            
            {displayImage !== modernImage && (
               <div className="absolute top-4 left-4 bg-amber-500/90 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1 z-20">
                 <Clock size={12} /> Historical View
               </div>
            )}
          </>
        ) : (
          <div className="text-white/30">Image unavailable</div>
        )}
        
        {/* Revert Button (only shows if viewing history) */}
        {displayImage !== modernImage && !loadingImage && !generatingHistorical && (
          <button 
            onClick={handleRevertToModern}
            className="absolute bottom-28 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 z-20"
          >
            <Eye size={12} /> Back to Now
          </button>
        )}

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-md z-20 border border-white/10"
        >
          <X size={20} />
        </button>
        
        {/* Header Content & Actions */}
        <div className="absolute bottom-0 left-0 w-full p-6 pt-12 flex items-end justify-between z-20">
          <div className="flex-1 mr-4">
            <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">{landmark.name}</h2>
            <div className="flex items-center gap-2 text-gray-300 mt-1.5 drop-shadow-md">
              <MapPin size={16} />
              <span className="font-medium">{landmark.country}</span>
            </div>
          </div>

          {/* 3D View Button */}
          <a 
            href={googleEarthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md border border-blue-400/30 transition-all hover:scale-105 active:scale-95 group/3d shrink-0"
            title="View in Google Earth 3D"
          >
            <Box size={16} className="group-hover/3d:animate-bounce" />
            <span>3D View</span>
            <ExternalLink size={10} className="opacity-60" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/20 sticky top-0 z-30 backdrop-blur-xl">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <BookOpen size={16} /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'text-amber-400 border-b-2 border-amber-400 bg-white/5' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <History size={16} /> Timeline
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Description */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">About</h3>
              {loadingDetails ? (
                 <div className="space-y-2 animate-pulse">
                   <div className="h-4 bg-white/10 rounded w-full"></div>
                   <div className="h-4 bg-white/10 rounded w-5/6"></div>
                   <div className="h-4 bg-white/10 rounded w-4/6"></div>
                 </div>
              ) : (
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                  {details?.description}
                </p>
              )}
            </section>

            {/* Best Time to Visit */}
            <section>
              <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Calendar size={18} /> Best Time to Visit
              </h3>
              {loadingDetails ? (
                 <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse"></div>
              ) : (
                <p className="text-gray-300 text-sm md:text-base">
                  {details?.bestTimeToVisit}
                </p>
              )}
            </section>

            {/* Things to Do */}
            <section>
              <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                 <Star size={18} /> Things to Do
              </h3>
              {loadingDetails ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 bg-white/10 rounded-lg"></div>
                  <div className="h-12 bg-white/10 rounded-lg"></div>
                  <div className="h-12 bg-white/10 rounded-lg"></div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {details?.thingsToDo.map((thing, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-gray-200 text-sm font-medium">{thing}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 bg-amber-900/20 p-4 rounded-lg border border-amber-500/20">
               <h3 className="text-base font-semibold text-amber-400 mb-1 flex items-center gap-2">
                  <History size={16} /> Historical Timeline
               </h3>
               <p className="text-xs text-gray-400">
                 Explore key events that shaped this location. Click the <span className="text-amber-300 font-bold">Eye</span> icon to reconstruct the past with AI.
               </p>
            </div>

            {loadingHistory ? (
              <div className="space-y-6 ml-2">
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-0.5 h-20 bg-white/10 relative">
                        <div className="absolute -left-1.5 top-0 w-3.5 h-3.5 rounded-full bg-white/10"></div>
                      </div>
                      <div className="flex-1 space-y-2 pt-0.5">
                         <div className="w-16 h-4 bg-white/10 rounded"></div>
                         <div className="w-3/4 h-4 bg-white/10 rounded"></div>
                         <div className="w-full h-12 bg-white/10 rounded"></div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="relative ml-2 space-y-8 border-l border-white/10 pl-6 pb-6">
                {history.map((event, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-gray-700 border-2 border-black group-hover:bg-amber-500 group-hover:scale-125 transition-all shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-amber-500 font-mono font-bold text-sm bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/30">{event.year}</span>
                        <button 
                          onClick={() => handleVisualizeHistory(event)}
                          disabled={generatingHistorical !== null}
                          className="flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider transition-all"
                        >
                          {generatingHistorical === (event.year + event.title) ? (
                            <Loader2 size={10} className="animate-spin" /> 
                          ) : (
                            <Eye size={10} />
                          )}
                          {historicalImages[event.year + event.title] ? 'Show Era' : 'Visualize'}
                        </button>
                      </div>
                      
                      <h4 className="text-gray-100 font-semibold text-base leading-snug group-hover:text-amber-100 transition-colors">{event.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AttractionPanel;