import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    state?: string;
    province?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use Nominatim API with Philippines country code
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=ph&` +
        `limit=5&` +
        `addressdetails=1&` +
        `extratags=1`
      );
      
      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="address-input">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.lat}-${suggestion.lon}`}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.address.road && suggestion.address.house_number
                      ? `${suggestion.address.house_number} ${suggestion.address.road}`
                      : suggestion.address.road || suggestion.address.suburb}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {[
                      suggestion.address.suburb, // Barangay
                      suggestion.address.city || suggestion.address.municipality, // City/Municipality
                      suggestion.address.province, // Province
                      suggestion.address.region // Region
                    ].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
