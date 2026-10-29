import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DonorDashboard } from './pages/DonorDashboard.tsx';
import { CreateDonationPage } from './pages/CreateDonationPage.tsx';
import { DonationDetailsPage } from './pages/DonationDetailsPage.tsx';
import { NGODashboard } from './pages/NGODashboard.tsx';
import { VolunteerDashboard } from './pages/VolunteerDashboard.tsx';
import { EmergencySOSPage } from './pages/EmergencySOSPage.tsx';
import { HungerSpottingPage } from './pages/HungerSpottingPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { BelagaviMap, MapMarker } from './components/maps/BelagaviMap.tsx';
import { api } from './services/api.ts';
import { Layers, MapPin, AlertTriangle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedDonationId, setSelectedDonationId] = useState<string>('don-1');

  // Fullscreen Belagavi Map state
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [mapRadius, setMapRadius] = useState<number>(10);
  const [mapRadiusType, setMapRadiusType] = useState<'MATCHING' | 'EMERGENCY'>('MATCHING');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'belagavi-map') {
      loadMapMarkers();
    }
  };

  const loadMapMarkers = async () => {
    try {
      const [donRes, sosRes, hgRes] = await Promise.all([
        api.getDonations(),
        api.getEmergencyAlerts(),
        api.getHungerReports(),
      ]);

      const list: MapMarker[] = [];
      if (donRes.success) {
        donRes.donations.forEach((d) => {
          list.push({
            id: d._id,
            lat: d.latitude,
            lng: d.longitude,
            title: d.foodName,
            type: 'DONATION',
            status: d.status,
            description: `${d.quantity} ${d.unit} • ${d.category}`,
            info: d.pickupAddress,
          });
        });
      }

      if (sosRes.success) {
        sosRes.alerts.forEach((a) => {
          list.push({
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

      if (hgRes.success) {
        hgRes.reports.forEach((h) => {
          list.push({
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

      // Add Annapurna NGO Hub
      list.push({
        id: 'ngo-hub-1',
        lat: 15.834,
        lng: 74.502,
        title: 'Belagavi Annapurna Seva Trust (HQ)',
        type: 'NGO',
        status: 'VERIFIED',
        description: 'Daily Capacity: 350 kg',
        info: 'Tilakwadi 2nd Gate, Belagavi',
      });

      setMapMarkers(list);
    } catch (err) {
      console.warn('Map load error:', err);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'donor-dashboard':
      case 'donations-list':
        return (
          <DonorDashboard
            onNavigate={handleNavigate}
            onSelectDonation={(id) => setSelectedDonationId(id)}
          />
        );
      case 'create-donation':
        return (
          <CreateDonationPage
            onNavigate={handleNavigate}
            onDonationCreated={(id) => setSelectedDonationId(id)}
          />
        );
      case 'donation-details':
        return (
          <DonationDetailsPage
            donationId={selectedDonationId}
            onNavigate={handleNavigate}
          />
        );
      case 'ngo-dashboard':
      case 'available-donations':
      case 'tasks-management':
        return (
          <NGODashboard
            onNavigate={handleNavigate}
            onSelectDonation={(id) => setSelectedDonationId(id)}
          />
        );
      case 'volunteer-dashboard':
        return <VolunteerDashboard />;
      case 'emergency':
        return <EmergencySOSPage />;
      case 'hunger':
        return <HungerSpottingPage />;
      case 'admin-dashboard':
      case 'admin-ngos':
      case 'admin-users':
      case 'admin-categories':
      case 'admin-audits':
      case 'admin-settings':
        return <AdminDashboard />;
      case 'profile':
        return <ProfilePage />;
      case 'belagavi-map':
        return (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-900/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  Belagavi Regional Geographic Hub
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time OpenStreetMap visualization of surplus food points, verified NGOs, and emergency incidents.
                </p>
              </div>

              {/* Radius Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMapRadius(10);
                    setMapRadiusType('MATCHING');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mapRadius === 10
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  10 KM Surplus Matching
                </button>
                <button
                  onClick={() => {
                    setMapRadius(15);
                    setMapRadiusType('EMERGENCY');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mapRadius === 15
                      ? 'bg-red-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  15 KM SOS Mesh
                </button>
              </div>
            </div>

            <BelagaviMap
              markers={mapMarkers}
              showRadiusKm={mapRadius}
              radiusType={mapRadiusType}
              height="580px"
            />
          </div>
        );
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar only shown on larger screens when not on login/register or when authenticated */}
        {currentPage !== 'login' && currentPage !== 'register' && (
          <div className="hidden lg:block">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {renderContent()}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-900/10 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MealBridge Belagavi</span>
            <span>• Karnataka, India</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Automated 10 KM Surplus Matching • 15 KM Emergency SOS • 48-Hour Retention Policy
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
