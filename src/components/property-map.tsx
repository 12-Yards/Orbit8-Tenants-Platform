"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PropertyMapProps {
  address: string;
  name: string;
}

interface GeocodedLocation {
  lat: number;
  lon: number;
}

interface ParsedAddress {
  postcode: string | null;
  street: string | null;
  city: string;
}

function parseUKAddress(address: string): ParsedAddress {
  let cleaned = address
    .replace(/Royaume-Uni/gi, '')
    .replace(/United Kingdom/gi, '')
    .replace(/UK/gi, '')
    .replace(/Wales/gi, '')
    .replace(/\r\n/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i;
  const postcodeMatch = cleaned.match(postcodeRegex);
  const postcode = postcodeMatch ? postcodeMatch[1].toUpperCase().replace(/\s+/g, ' ') : null;
  
  let street: string | null = null;
  let city = 'Mumbles';
  
  if (postcode) {
    const parts = cleaned.split(postcodeRegex);
    const beforePostcode = parts[0]?.trim().replace(/,\s*$/, '');
    const afterPostcode = parts[2]?.trim().replace(/^,\s*/, '');
    
    if (beforePostcode) {
      const streetParts = beforePostcode.split(',').map(p => p.trim()).filter(Boolean);
      if (streetParts.length > 0) {
        street = streetParts[0];
        if (streetParts.length > 1) {
          const lastPart = streetParts[streetParts.length - 1];
          if (lastPart && !lastPart.match(/^\d/)) {
            city = lastPart;
          }
        }
      }
    }
    
    if (afterPostcode) {
      const cityParts = afterPostcode.split(',').map(p => p.trim()).filter(Boolean);
      if (cityParts.length > 0 && cityParts[0]) {
        city = cityParts[0].replace(/^The\s+/i, '');
      }
    }
  } else {
    const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      street = parts[0];
      if (parts.length > 1) {
        city = parts[parts.length - 1].replace(/^The\s+/i, '') || 'Mumbles';
      }
    }
  }
  
  return { postcode, street, city };
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export function PropertyMap({ address, name }: PropertyMapProps) {
  const [location, setLocation] = useState<GeocodedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function geocodeAddress() {
      setIsLoading(true);
      setError(false);

      const parsed = parseUKAddress(address);
      console.log('Parsed address:', parsed);

      const nominatimHeaders = {
        'User-Agent': 'MumblesVibe/1.0 (contact@mumblesvibe.com)'
      };

      try {
        if (parsed.postcode) {
          const params = new URLSearchParams({
            format: 'json',
            limit: '1',
            country: 'United Kingdom',
            postalcode: parsed.postcode
          });
          
          if (parsed.street) {
            params.set('street', parsed.street);
          }
          if (parsed.city) {
            params.set('city', parsed.city);
          }
          
          const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
          console.log('Structured geocoding URL:', url);
          
          try {
            const response = await axios.get(url, { headers: nominatimHeaders });
            const data = response.data;
            console.log('Structured geocoding response:', data);
            
            if (data.length > 0) {
              setLocation({
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
              });
              setIsLoading(false);
              return;
            }
          } catch {
          }
          
          console.log('Structured search failed, trying postcode only');
          await new Promise(r => setTimeout(r, 1100));
          
          const postcodeUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&country=United+Kingdom&postalcode=${encodeURIComponent(parsed.postcode)}`;
          try {
            const postcodeResponse = await axios.get(postcodeUrl, { headers: nominatimHeaders });
            const postcodeData = postcodeResponse.data;
            console.log('Postcode-only response:', postcodeData);
            
            if (postcodeData.length > 0) {
              setLocation({
                lat: parseFloat(postcodeData[0].lat),
                lon: parseFloat(postcodeData[0].lon)
              });
              setIsLoading(false);
              return;
            }
          } catch {
          }
        }
        
        console.log('Falling back to free-form search');
        await new Promise(r => setTimeout(r, 1100));
        
        const freeFormQuery = parsed.street 
          ? `${parsed.street}, ${parsed.city}, Swansea, Wales`
          : `${parsed.city}, Swansea, Wales`;
        
        const freeFormUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(freeFormQuery)}&format=json&limit=1&countrycodes=gb`;
        try {
          const freeFormResponse = await axios.get(freeFormUrl, { headers: nominatimHeaders });
          const freeFormData = freeFormResponse.data;
          console.log('Free-form response:', freeFormData);
          
          if (freeFormData.length > 0) {
            setLocation({
              lat: parseFloat(freeFormData[0].lat),
              lon: parseFloat(freeFormData[0].lon)
            });
            setIsLoading(false);
            return;
          }
        } catch {
        }
        
        console.log('All geocoding attempts failed, using Mumbles center');
        setLocation({ lat: 51.5696, lon: -3.9909 });
        setIsLoading(false);
        
      } catch (err) {
        console.error('Geocoding error:', err);
        setLocation({ lat: 51.5696, lon: -3.9909 });
        setIsLoading(false);
      }
    }

    if (address) {
      geocodeAddress();
    }
  }, [address]);

  if (isLoading) {
    return (
      <div className="w-full h-64 md:h-80 rounded-lg border bg-muted flex items-center justify-center" data-testid="property-map-loading">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="w-full h-64 md:h-80 rounded-lg border bg-muted flex items-center justify-center" data-testid="property-map-error">
        <span className="text-muted-foreground">Map unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border" data-testid="property-map">
      <MapContainer
        key={`${location.lat}-${location.lon}`}
        center={[location.lat, location.lon]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={[location.lat, location.lon]} />
        <Marker position={[location.lat, location.lon]} icon={customIcon}>
          <Popup>
            <div className="text-sm">
              <strong>{name}</strong>
              <br />
              {address}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
