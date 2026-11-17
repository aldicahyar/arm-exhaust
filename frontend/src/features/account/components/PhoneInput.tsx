'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LabelInput } from '../../auth/LabelInput';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  parsePhoneNumber,
  formatFullPhoneNumber,
  type CountryDialInfo,
} from '../data/countries';

export interface PhoneInputProps {
  readonly value: string;
  readonly onChange: (fullNumber: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  className = '',
}: Readonly<PhoneInputProps>) {
  // Parse initial state from incoming value
  const initialParsed = useMemo(() => parsePhoneNumber(value), [value]);

  const [selectedCountry, setSelectedCountry] = useState<CountryDialInfo>(
    initialParsed.matchedCountry
  );
  const [nationalNumber, setNationalNumber] = useState<string>(
    initialParsed.nationalNumber
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if external value changes significantly
  useEffect(() => {
    const parsed = parsePhoneNumber(value);
    setSelectedCountry(parsed.matchedCountry);
    setNationalNumber(parsed.nationalNumber);
  }, [value]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isDropdownOpen]);

  // Handle outside click & ESC key to dismiss dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // If user pastes or types a full international number with +
    if (raw.trim().startsWith('+')) {
      const parsed = parsePhoneNumber(raw);
      setSelectedCountry(parsed.matchedCountry);
      setNationalNumber(parsed.nationalNumber);
      onChange(formatFullPhoneNumber(parsed.matchedCountry.dialCode, parsed.nationalNumber));
      return;
    }

    // If Indonesian number (+62) and user typed leading 0, strip leading 0
    if (selectedCountry.code === 'ID' && raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '');
    }

    setNationalNumber(raw);
    onChange(formatFullPhoneNumber(selectedCountry.dialCode, raw));
  };

  // Handle country selection
  const handleSelectCountry = (country: CountryDialInfo) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    onChange(formatFullPhoneNumber(country.dialCode, nationalNumber));
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-start gap-2">
        {/* Country Dial Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)}
          disabled={disabled}
          className="h-[42px] mt-[5px] px-2.5 bg-[#141416] border border-[#1E1E21] hover:border-white focus:border-white focus:outline-none transition-colors rounded-none flex items-center justify-between gap-1.5 shrink-0 select-none text-white disabled:opacity-60 disabled:cursor-not-allowed group"
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          aria-label={`Selected country: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span className="text-[15px] leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-[13px] font-mono font-medium text-white">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown
            size={13}
            className={`text-[#8A8F98] group-hover:text-white transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* National Number Input Field */}
        <div className="flex-1 min-w-0">
          <LabelInput
            label="Phone"
            type="tel"
            name="phoneNumber"
            value={nationalNumber}
            onChange={handleNumberChange}
            corner={0}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Country Dial Selector Dropdown Popover */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[52px] z-50 w-[290px] bg-[#0E0E10] border border-[#1E1E21] shadow-2xl rounded-none flex flex-col overflow-hidden"
            role="listbox"
            aria-label="Country calling codes"
          >
            {/* Search Input Bar */}
            <div className="p-2 border-b border-[#1E1E21] bg-[#121214] flex items-center gap-2">
              <Search size={14} className="text-[#8A8F98] shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full bg-transparent text-white text-[12px] placeholder-[#8A8F98] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#8A8F98] hover:text-white transition-colors p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Country List (Scrollable, 0px geometry) */}
            <div className="max-h-[220px] overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-1 flex flex-col">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => {
                  const isSelected = country.code === selectedCountry.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className={`w-full px-2.5 py-1.5 flex items-center justify-between text-left transition-colors rounded-none text-[13px] ${
                        isSelected
                          ? 'bg-[#1E1E21] text-white font-medium'
                          : 'text-[#D1D5DB] hover:bg-[#141416] hover:text-white'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[14px] leading-none shrink-0" role="img" aria-label={country.name}>
                          {country.flag}
                        </span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <span className="font-mono text-[12px] text-[#8A8F98] shrink-0">
                        {country.dialCode}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-[12px] text-[#8A8F98] text-center">
                  No country found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
