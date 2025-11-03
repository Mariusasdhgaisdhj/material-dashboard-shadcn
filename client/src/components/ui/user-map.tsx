import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, MessageCircle, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different user roles
const createCustomIcon = (role: string, isOnline: boolean = false) => {
  const colors = {
    admin: '#dc2626', // red
    seller: '#059669', // green
    buyer: '#2563eb', // blue
  };
  
  const color = colors[role as keyof typeof colors] || '#6b7280'; // gray default
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        ${isOnline ? '<div style="position: absolute; top: -2px; right: -2px; width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; border: 1px solid white;"></div>' : ''}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface UserLocation {
  id: string;
  name: string;
  email: string;
  role: string;
  business_name?: string;
  latitude: number;
  longitude: number;
  avatar?: string;
  isOnline?: boolean;
  lastActive?: string;
  address?: string;
}

interface UserMapProps {
  users: UserLocation[];
  onUserClick?: (user: UserLocation) => void;
  selectedUserId?: string | null;
  className?: string;
}

// Geocoding function using Nominatim (free OpenStreetMap geocoding service)
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address || address.trim() === '') {
    console.log('[Geocoding] Empty address provided');
    return null;
  }
  
  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=3&addressdetails=1&countrycodes=ph`;
    console.log('[Geocoding] Geocoding address:', address);
    console.log('[Geocoding] API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AgriReady/1.0'
      }
    });
    
    console.log('[Geocoding] Response status:', response.status);
    
    if (!response.ok) {
      console.log('[Geocoding] API request failed:', response.status);
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    console.log('[Geocoding] API response:', data);
    
    if (data && data.length > 0) {
      // Look for results that are actually in the Philippines
      for (const result of data) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const displayName = result.display_name;
        
        console.log('[Geocoding] Checking result:', displayName, 'Coords:', lat, lng);
        
        // Check if coordinates are within Philippines bounds
        const isInPhilippines = lat >= 4.0 && lat <= 21.0 && lng >= 116.0 && lng <= 127.0;
        
        if (lat !== 0.0 && lng !== 0.0 && isInPhilippines) {
          console.log('[Geocoding] ✅ Valid Philippines coordinates found:', lat, lng);
          return { lat, lng };
        } else {
          console.log('[Geocoding] ❌ Coordinates not in Philippines:', lat, lng, 'isInPhilippines:', isInPhilippines);
        }
      }
    } else {
      console.log('[Geocoding] No results found for address:', address);
    }
    
    return null;
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return null;
  }
};

// Helper function to check if coordinates are in Philippines
const isInPhilippines = (lat: number, lng: number): boolean => {
  return lat >= 4.0 && lat <= 21.0 && lng >= 116.0 && lng <= 127.0;
};


// Component to fit map bounds to show all markers
const FitBounds: React.FC<{ users: UserLocation[] }> = ({ users }) => {
  const map = useMap();
  
  useEffect(() => {
    if (users.length > 0) {
      const bounds = L.latLngBounds(
        users.map(user => [user.latitude, user.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, users]);
  
  return null;
};

export const UserMap: React.FC<UserMapProps> = ({ 
  users, 
  onUserClick, 
  selectedUserId,
  className = "h-[500px] w-full"
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geocodedUsers, setGeocodedUsers] = useState<UserLocation[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);


  // Default center for Philippines
  const defaultCenter: [number, number] = [14.5995, 120.9842]; // Manila, Philippines
  const defaultZoom = 7;

  // Geocode users with addresses
  useEffect(() => {
    const geocodeUsers = async () => {
      console.log('[UserMap] Starting geocoding for users:', users.length);
      console.log('[UserMap] Users data:', users);
      
      if (users.length === 0) {
        console.log('[UserMap] No users to process');
        setGeocodedUsers([]);
        return;
      }

      setIsGeocoding(true);
      setGeocodingProgress(0);
      
      const geocodedResults: UserLocation[] = [];
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`[UserMap] Processing user ${i + 1}/${users.length}:`, user.name, 'Address:', user.address);
        
        // Geocode users based on their addresses
        if (user.address && user.address.trim() !== '') {
          console.log(`[UserMap] Geocoding address for ${user.name}:`, user.address);
          const coords = await geocodeAddress(user.address);
          if (coords) {
            console.log(`[UserMap] ✅ Geocoding successful for ${user.name}:`, coords);
            const finalUser = {
              ...user,
              latitude: coords.lat,
              longitude: coords.lng
            };
            geocodedResults.push(finalUser);
          } else {
            console.log(`[UserMap] ❌ Geocoding failed for ${user.name}`);
          }
        } else {
          console.log(`[UserMap] ⚠️ No address for ${user.name}`);
        }
        
        // Update progress
        setGeocodingProgress(Math.round(((i + 1) / users.length) * 100));
        
        // Small delay to prevent overwhelming the geocoding service
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('[UserMap] Geocoding complete. Results:', geocodedResults.length);
      console.log('[UserMap] Geocoded users:', geocodedResults);
      setGeocodedUsers(geocodedResults);
      setIsGeocoding(false);
    };

    geocodeUsers();
  }, [users]);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  if (!mapLoaded) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGeocoding) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            User Locations
            <Badge variant="secondary">{users.length} users</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-gray-600 mb-2">Geocoding addresses...</p>
            <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${geocodingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{geocodingProgress}% complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          User Locations
          <Badge variant="secondary">{geocodedUsers.length} users</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <MapContainer
            center={geocodedUsers.length > 0 ? [geocodedUsers[0].latitude, geocodedUsers[0].longitude] : defaultCenter}
            zoom={defaultZoom}
            style={{ height: '400px', width: '100%' }}
            className="rounded-b-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {geocodedUsers.map((user) => (
              <Marker
                key={user.id}
                position={[user.latitude, user.longitude]}
                icon={createCustomIcon(user.role, user.isOnline)}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-medium">
                          {user.name.slice(0,2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'seller' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        {user.isOnline && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                      
                      {user.business_name && (
                        <div className="text-sm text-gray-700">
                          <strong>Business:</strong> {user.business_name}
                        </div>
                      )}
                      
                      {user.address && (
                        <div className="text-xs text-gray-500">
                          <strong>Address:</strong> {user.address}
                        </div>
                      )}
                    </div>
                    
                    {onUserClick && (
                      <Button
                        size="sm"
                        onClick={() => onUserClick(user)}
                        className="w-full"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Chat
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <FitBounds users={geocodedUsers} />
          </MapContainer>
          
          {/* Map Legend */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
            <div className="font-medium mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Seller</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Buyer</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMap;
