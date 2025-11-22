import React, { useEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LANDMARKS } from '../data/landmarks';
import { Landmark } from '../types';

interface GlobeMapProps {
  onSelectLandmark: (landmark: Landmark) => void;
  onZoomLevelChange?: (isZoomedIn: boolean) => void;
}

const GlobeMap: React.FC<GlobeMapProps> = ({ onSelectLandmark, onZoomLevelChange }) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [visibleLandmarks, setVisibleLandmarks] = useState<Landmark[]>([]);
  const [countries, setCountries] = useState({ features: [] });
  const [currentTier, setCurrentTier] = useState<number>(0);

  // Adjust globe on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Country Borders (GeoJSON)
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // Zoom & Interaction Listener
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableZoom = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;

      const handleChange = () => {
        if (!globeEl.current) return;
        
        // Get camera altitude
        const altitude = globeEl.current.pointOfView().altitude;
        
        let newVisible: Landmark[] = [];
        let tier = 0;

        // Progressive Loading Logic
        // > 1.6: Space (Show nothing or maybe just very few top icons, keeping it clean for now)
        // < 1.6: Tier 1 (Global Icons)
        // < 0.8: Tier 2 (Cities)
        // < 0.4: Tier 3 (Local Attractions)
        
        if (altitude > 1.6) {
           newVisible = []; 
           tier = 0;
        } else if (altitude > 0.8) {
           newVisible = LANDMARKS.filter(l => l.tier === 1);
           tier = 1;
        } else if (altitude > 0.4) {
           newVisible = LANDMARKS.filter(l => l.tier <= 2);
           tier = 2;
        } else {
           newVisible = LANDMARKS;
           tier = 3;
        }

        setVisibleLandmarks(prev => {
            if (prev.length !== newVisible.length) return newVisible;
            return prev;
        });

        if (tier !== currentTier) {
            setCurrentTier(tier);
        }

        const isExploring = tier > 0;
        if (onZoomLevelChange) onZoomLevelChange(isExploring);

        // Stop auto-rotate when user finds something
        if (isExploring && globeEl.current) {
            globeEl.current.controls().autoRotate = false;
        }
      };

      controls.addEventListener('change', handleChange);
      return () => controls.removeEventListener('change', handleChange);
    }
  }, [onZoomLevelChange, currentTier]);

  const handlePointClick = (landmark: Landmark) => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      globeEl.current.pointOfView({
        lat: landmark.lat,
        lng: landmark.lng,
        altitude: 0.3 // Zoom in close on click
      }, 1500);
    }
    onSelectLandmark(landmark);
  };

  const createMarker = (d: any) => {
    const landmark = d as Landmark;
    const el = document.createElement('div');
    
    el.style.width = '0';
    el.style.height = '0';
    el.style.position = 'relative';
    el.style.pointerEvents = 'none'; 
    
    // Color logic
    let color = '#F59E0B'; // Amber
    if (d.type === 'natural') { color = '#10B981'; }
    if (d.type === 'modern') { color = '#3B82F6'; }

    // Size Logic based on Tier
    let scale = 1;
    if (landmark.tier === 2) scale = 0.8;
    if (landmark.tier === 3) scale = 0.6;

    const inner = document.createElement('div');
    inner.style.position = 'absolute';
    inner.style.left = '0';
    inner.style.top = '0';
    inner.style.transform = `translate(-50%, -100%) scale(${scale})`;
    inner.style.pointerEvents = 'auto'; 
    inner.style.cursor = 'pointer';
    
    // HTML Content
    inner.innerHTML = `
      <div class="group relative flex flex-col items-center animate-pop-in">
        <!-- Tooltip -->
        <div class="absolute bottom-[110%] mb-1 px-3 py-1.5 bg-black/90 backdrop-blur-md border border-white/10 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-20 shadow-xl transform translate-y-2 group-hover:translate-y-0">
          ${d.name}
          <div class="text-[10px] text-gray-400 font-light uppercase tracking-wider mt-0.5">${d.country}</div>
        </div>

        <!-- Pin Visuals -->
        <div class="relative transition-transform duration-300 group-hover:-translate-y-2">
            <div class="absolute inset-0 bg-${d.type === 'modern' ? 'blue' : d.type === 'natural' ? 'emerald' : 'amber'}-500 blur-lg opacity-20 group-hover:opacity-60 transition-opacity"></div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg relative z-10">
              <path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0Z"/>
              <circle cx="12" cy="10" r="3" fill="white" />
            </svg>
        </div>
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-2 bg-black/40 blur-sm rounded-[100%] group-hover:scale-150 group-hover:bg-${d.type === 'modern' ? 'blue' : d.type === 'natural' ? 'emerald' : 'amber'}-500/30 transition-all duration-300"></div>
      </div>
    `;

    el.onclick = (e) => {
        e.stopPropagation();
        handlePointClick(d);
    };
    
    el.appendChild(inner);
    return el;
  };

  return (
    <div className="cursor-move bg-black">
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          60% { transform: scale(1.2) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Country Vector Layer
        polygonsData={countries.features}
        polygonCapColor={() => 'transparent'} // Clear fill
        polygonSideColor={() => 'transparent'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.2)'} // Subtle white border
        polygonAltitude={0.005} // Slightly above surface to prevent z-fighting
        polygonLabel={({ properties: d }: any) => `
            <div class="bg-gray-900/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 shadow-xl font-medium tracking-wide">
              ${d.ADMIN}
            </div>
        `}
        onPolygonHover={(d) => {
            // Optional
        }}

        // Markers
        htmlElementsData={visibleLandmarks}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0}
        htmlElement={createMarker}
        
        atmosphereColor="#60a5fa"
        atmosphereAltitude={0.15}
        showAtmosphere={true}
      />
    </div>
  );
};

export default GlobeMap;