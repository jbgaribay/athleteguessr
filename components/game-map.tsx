'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  onGuess: (lat: number, lng: number) => void;
  guessLocation: [number, number] | null;
  actualLocation: [number, number] | null;
  showResult: boolean;
}

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onGuess, disabled }: { onGuess: (lat: number, lng: number) => void; disabled: boolean }) {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        onGuess(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function FitBoundsOnReveal({ guessLocation, actualLocation, showResult }: { guessLocation: [number, number] | null; actualLocation: [number, number] | null; showResult: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (showResult && guessLocation && actualLocation) {
      // Fit map to show both markers with animation
      const bounds = L.latLngBounds([guessLocation, actualLocation]);
      map.fitBounds(bounds, { 
        padding: [100, 100],
        animate: true,
        duration: 1
      });
    }
  }, [showResult, guessLocation, actualLocation, map]);

  return null;
}

export default function GameMap({ onGuess, guessLocation, actualLocation, showResult }: GameMapProps) {
  const [mounted, setMounted] = useState(false);
  const [animatedLine, setAnimatedLine] = useState<[number, number][]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate line drawing
  useEffect(() => {
    if (showResult && guessLocation && actualLocation) {
      // Reset line
      setAnimatedLine([]);
      
      // Animate line over 1 second
      const steps = 30;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        const lat = guessLocation[0] + (actualLocation[0] - guessLocation[0]) * progress;
        const lng = guessLocation[1] + (actualLocation[1] - guessLocation[1]) * progress;
        
        setAnimatedLine([[guessLocation[0], guessLocation[1]], [lat, lng]]);

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedLine([guessLocation, actualLocation]);
        }
      }, 1000 / steps);

      return () => clearInterval(interval);
    } else {
      setAnimatedLine([]);
    }
  }, [showResult, guessLocation, actualLocation]);

  if (!mounted) {
    return <div className="w-full h-full bg-gray-200 animate-pulse" />;
  }

  // Custom icons
  const guessIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const actualIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <MapContainer
      center={[39.8283, -98.5795]} // Center of USA
      zoom={4}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapClickHandler onGuess={onGuess} disabled={showResult} />
      <FitBoundsOnReveal guessLocation={guessLocation} actualLocation={actualLocation} showResult={showResult} />
      
      {guessLocation && (
        <Marker position={guessLocation} icon={guessIcon} />
      )}
      
      {showResult && actualLocation && (
        <>
          <Marker position={actualLocation} icon={actualIcon} />
          {animatedLine.length === 2 && (
            <Polyline
              positions={animatedLine}
              color="blue"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
        </>
      )}
    </MapContainer>
  );
}