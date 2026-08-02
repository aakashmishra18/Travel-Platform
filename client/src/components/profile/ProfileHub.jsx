import React, { useState } from 'react';
import { User, Users, MapPin, Phone, Sliders, Award, FileCheck } from 'lucide-react';
import { ProfileInfoSection } from './ProfileInfoSection';
import { TravellersSection } from './TravellersSection';
import { AddressesSection } from './AddressesSection';
import { ContactsSection } from './ContactsSection';
import { PreferencesSection } from './PreferencesSection';
import { LoyaltySection } from './LoyaltySection';
import { ConsentsSection } from './ConsentsSection';

const TABS = [
  { key: 'info', label: 'Profile', icon: User, Component: ProfileInfoSection },
  { key: 'travellers', label: 'Travellers', icon: Users, Component: TravellersSection },
  { key: 'addresses', label: 'Addresses', icon: MapPin, Component: AddressesSection },
  { key: 'contacts', label: 'Contacts', icon: Phone, Component: ContactsSection },
  { key: 'preferences', label: 'Preferences', icon: Sliders, Component: PreferencesSection },
  { key: 'loyalty', label: 'Loyalty', icon: Award, Component: LoyaltySection },
  { key: 'consents', label: 'Consents', icon: FileCheck, Component: ConsentsSection },
];

export const ProfileHub = () => {
  const [activeTab, setActiveTab] = useState('info');
  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component;

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Profile &amp; Travel</h2>
        <p className="dash-section-subtitle">Your details, travellers and preferences for booking faster.</p>
      </div>

      <div className="profile-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`profile-tab${activeTab === key ? ' active' : ''}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
};
