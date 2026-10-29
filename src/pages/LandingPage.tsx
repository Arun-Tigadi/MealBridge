import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { BelagaviMap, MapMarker } from '../components/maps/BelagaviMap.tsx';
import {
  HeartHandshake,
  ShieldCheck,
  Truck,
  Building2,
  Users,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { quickSwitchRole } = useAuth();
  const [stats, setStats] = useState({
    totalDonations: 48,
    foodSavedKg: 1420,
    verifiedNgos: 6,
    activeVolunteers: 18,
  });

  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    // Load map markers from real API
    const loadData = async () => {
      try {
        const [donationsRes, alertsRes, hungerRes] = await Promise.all([
          api.getDonations(),
          api.getEmergencyAlerts(),
          api.getHungerReports(),
        ]);

        const markers: MapMarker[] = [];

        if (donationsRes.success) {
          donationsRes.donations.forEach((d) => {
            markers.push({
              id: d._id,
              lat: d.latitude,
              lng: d.longitude,
              title: d.foodName,
              type: 'DONATION',
              status: d.status,
              description: `${d.quantity} ${d.unit} • ${d.category}`,
              info: `Pickup: ${d.pickupAddress}`,
            });
          });
        }

        if (alertsRes.success) {
          alertsRes.alerts.forEach((a) => {
            markers.push({
              id: a._id,
              lat: a.latitude,
              lng: a.longitude,
              title: `SOS: ${a.foodType}`,
              type: 'EMERGENCY',
              status: a.status,
              description: a.quantityNeeded,
              info: a.address,
            });
          });
        }

        if (hungerRes.success) {
          hungerRes.reports.forEach((h) => {
            markers.push({
              id: h._id,
              lat: h.latitude,
              lng: h.longitude,
              title: `Hunger Spot: ~${h.approximatePeople} people`,
              type: 'HUNGER',
              status: h.status,
              description: h.description,
              info: h.address,
            });
          });
        }

        // Add pre-seeded Belagavi Annapurna Seva Trust marker
        markers.push({
          id: 'ngo-hub-1',
          lat: 15.834,
          lng: 74.502,
          title: 'Belagavi Annapurna Seva Trust (HQ)',
          type: 'NGO',
          status: 'VERIFIED',
          description: 'Daily Capacity: 350 kg',
          info: 'Tilakwadi 2nd Gate, Belagavi',
        });

        setMapMarkers(markers);
      } catch (err) {
        console.warn('Failed to load map markers:', err);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/70 to-white border border-slate-900/10 rounded-2xl p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Belagavi District Food Security Network</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Bridging Food Surplus to Belagavi Communities in Need.
          </h1>

          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            MealBridge coordinates donors, verified NGOs, and rapid volunteers within a 10 km
            operational matching radius across Belagavi city, ensuring safe, rapid redistribution of
            nutritious surplus meals.
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              id="landing-hero-register-btn"
              onClick={() => onNavigate('register')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition-all ring-2 ring-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up / Register</span>
            </button>

            <button
              onClick={() => onNavigate('create-donation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-all"
            >
              <span>Donate Surplus Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('emergency')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-xs transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Broadcast Emergency SOS (15KM)</span>
            </button>

            <button
              onClick={() => onNavigate('hunger')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold transition-all"
            >
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Spot Hunger</span>
            </button>
          </div>
        </div>

        {/* Live Operational Counters */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium">Food Redistributed</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {stats.foodSavedKg} <span className="text-sm font-semibold text-slate-500">kg</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">Across Belagavi</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium">Donations Completed</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {stats.totalDonations}+
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">Verified handovers</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium">Verified NGOs</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {stats.verifiedNgos}
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold">With cold/hot holding</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium">Active Volunteers</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {stats.activeVolunteers}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">On 2-wheelers & vans</span>
          </div>
        </div>
      </section>

      {/* Belagavi Live Map Overview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Belagavi Operational Geolocation Map</h2>
            <p className="text-xs text-slate-500">
              Live status of surplus food donations, NGO distribution centers, and emergency hunger points within the 10 KM Belagavi zone.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Donations
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-700" />
              NGO Hubs
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              Emergency SOS
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Hunger Spots
            </span>
          </div>
        </div>

        <BelagaviMap
          markers={mapMarkers}
          showRadiusKm={10}
          radiusType="MATCHING"
          height="400px"
        />
      </section>

      {/* Role Navigation Cards (Instant Demo switch) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 p-4 rounded-xl shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Join MealBridge Belagavi as an Organization or Individual</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Register as a Food Donor, verified NGO, Volunteer driver, or Citizen with secure Email OTP verification.
            </p>
          </div>
          <button
            id="landing-role-register-btn"
            onClick={() => onNavigate('register')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up / Register Now</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Donor */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Donors</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Banquet halls, hotels, restaurants, and catering services listing surplus food with automated shelf-life estimation.
              </p>
            </div>
            <button
              onClick={async () => {
                await quickSwitchRole('DONOR');
                onNavigate('donor-dashboard');
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Donor Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* NGO */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">NGO Operations</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review automated 10 km recommendation matches, accept or decline food, dispatch volunteers, and verify deliveries.
              </p>
            </div>
            <button
              onClick={async () => {
                await quickSwitchRole('NGO');
                onNavigate('ngo-dashboard');
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch NGO Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volunteer */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Volunteers</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Accept assigned pickup tasks across Belagavi, view turn-by-turn routing, update statuses, and submit delivery proofs.
              </p>
            </div>
            <button
              onClick={async () => {
                await quickSwitchRole('VOLUNTEER');
                onNavigate('volunteer-dashboard');
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Volunteer App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Administration</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                NGO verification approvals, role governance, category management, matching radius configuration, and security audits.
              </p>
            </div>
            <button
              onClick={async () => {
                await quickSwitchRole('ADMIN');
                onNavigate('admin-dashboard');
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Public Users */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Public Citizens</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Spot hunger in Belagavi neighborhoods, report groups in distress, and view verified hunger relief hubs.
              </p>
            </div>
            <button
              onClick={async () => {
                await quickSwitchRole('PUBLIC');
                onNavigate('hunger');
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Spot Hunger Nearby</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Shelf-Life Safety Module */}
          <div className="p-5 rounded-xl bg-slate-900 text-white shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold mb-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-sm">AI Shelf-Life Module</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Rule-based prototype engine factoring preparation time, ambient Belagavi temperature, and storage parameters.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 italic">
              Prototype shelf-life/risk estimate. This is not a food safety decision.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
