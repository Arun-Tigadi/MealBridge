import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'DONATION' | 'NGO' | 'EMERGENCY' | 'HUNGER' | 'VOLUNTEER';
  status?: string;
  description?: string;
  info?: string;
}

interface BelagaviMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  showRadiusKm?: number;
  radiusType?: 'MATCHING' | 'EMERGENCY';
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedCoord?: [number, number] | null;
  height?: string;
  id?: string;
}

export const BelagaviMap: React.FC<BelagaviMapProps> = ({
  markers = [],
  center = [15.8497, 74.4977], // Belagavi City Center
  zoom = 13,
  showRadiusKm,
  radiusType = 'MATCHING',
  onLocationSelect,
  selectedCoord,
  height = '420px',
  id = 'mealbridge-map',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Attribution
      L.control
        .attribution({
          prefix: '<span class="text-xs text-slate-500">© OpenStreetMap | MealBridge Belagavi</span>',
        })
        .addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Click listener for coordinate picker
      if (onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(
            Math.round(e.latlng.lat * 10000) / 10000,
            Math.round(e.latlng.lng * 10000) / 10000
          );
        });
      }
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (map && layerGroup) {
      layerGroup.clearLayers();

      // Draw Radius circle if requested
      if (showRadiusKm) {
        const isEmergency = radiusType === 'EMERGENCY';
        L.circle(center, {
          radius: showRadiusKm * 1000,
          color: isEmergency ? '#dc2626' : '#2563eb',
          fillColor: isEmergency ? '#ef4444' : '#3b82f6',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '5, 8',
        })
          .bindTooltip(
            `${isEmergency ? '🚨 SOS Alert Radius' : '📦 Matching Radius'}: ${showRadiusKm} KM from center`,
            { permanent: false, direction: 'top' }
          )
          .addTo(layerGroup);
      }

      // Add selected coordinate pin
      if (selectedCoord) {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `<div style="background-color:#1e3a8a;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;font-size:14px;font-weight:bold;">📍</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        L.marker(selectedCoord, { icon: pickerIcon })
          .bindPopup('<b>Selected Location</b><br/>Belagavi coordinates locked.')
          .addTo(layerGroup);
      }

      // Add Markers
      markers.forEach((m) => {
        let bgColor = '#2563eb';
        let emoji = '📦';

        if (m.type === 'DONATION') {
          bgColor = '#10b981';
          emoji = '🍲';
        } else if (m.type === 'NGO') {
          bgColor = '#1e3a8a';
          emoji = '🏢';
        } else if (m.type === 'EMERGENCY') {
          bgColor = '#dc2626';
          emoji = '🚨';
        } else if (m.type === 'HUNGER') {
          bgColor = '#f59e0b';
          emoji = '📍';
        } else if (m.type === 'VOLUNTEER') {
          bgColor = '#6366f1';
          emoji = '🛵';
        }

        const icon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div style="background:${bgColor};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2px solid #ffffff;box-shadow:0 3px 6px rgba(0,0,0,0.25);font-size:16px;">${emoji}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const popupContent = `
          <div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4;min-width:160px;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:2px;">${m.title}</div>
            <div style="color:#64748b;font-size:11px;margin-bottom:4px;">${m.type} ${m.status ? `• ${m.status}` : ''}</div>
            ${m.description ? `<div style="color:#334155;margin-bottom:4px;">${m.description}</div>` : ''}
            ${m.info ? `<div style="font-size:11px;background:#f1f5f9;padding:4px;border-radius:4px;color:#1e293b;">${m.info}</div>` : ''}
          </div>
        `;

        L.marker([m.lat, m.lng], { icon }).bindPopup(popupContent).addTo(layerGroup);
      });
    }
  }, [markers, center, zoom, showRadiusKm, radiusType, selectedCoord, onLocationSelect]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-900/15 shadow-sm">
      <div id={id} ref={mapContainerRef} style={{ height, width: '100%' }} />
      {onLocationSelect && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium shadow-sm pointer-events-none">
          Click map to set coordinates
        </div>
      )}
    </div>
  );
};
