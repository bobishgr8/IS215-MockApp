'use client';

import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationPickerProps {
  label?: string;
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  required?: boolean;
}

export function LocationPicker({
  label = 'Location',
  value,
  onChange,
  placeholder = 'Search for a location in Singapore',
  required = false,
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: 'sg' }, // Restrict to Singapore
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['establishment', 'geocode'],
    };

    const autocompleteInstance = new places.Autocomplete(inputRef.current, options);

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (place.geometry?.location) {
        const address = place.formatted_address || place.name || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setInputValue(address);
        onChange(address, lat, lng);
      }
    });

    setAutocomplete(autocompleteInstance);

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [places, onChange]);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      <p className="text-xs text-gray-500">
        Start typing to search for Singapore locations
      </p>
    </div>
  );
}
