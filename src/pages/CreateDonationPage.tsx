import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { BelagaviMap } from '../components/maps/BelagaviMap.tsx';
import { FoodCategory } from '../types.ts';
import {
  HeartHandshake,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowLeft,
} from 'lucide-react';

interface CreateDonationPageProps {
  onNavigate: (page: string) => void;
  onDonationCreated?: (id: string) => void;
}

export const CreateDonationPage: React.FC<CreateDonationPageProps> = ({
  onNavigate,
  onDonationCreated,
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    foodName: '',
    category: 'Prepared Meals',
    quantity: 25,
    unit: 'meals' as const,
    description: '',
    ingredients: 'Rice, dal, vegetables, mild spices',
    preparationTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isVegetarian: true,
    allergens: 'None',
    pickupAddress: user?.address || 'Maratha Mandir Hall, Club Road, Belagavi',
    latitude: user?.latitude || 15.856,
    longitude: user?.longitude || 74.505,
    storageInformation: 'Kept warm in insulated thermal containers (>60°C)',
    contactName: user?.name || 'Catering Coordinator',
    contactPhone: user?.phone || '+91 98451 22334',
  });

  // AI Expiry Preview State
  const [aiPreview, setAiPreview] = useState<{
    estimatedHours: number;
    riskLevel: string;
    guidance: string[];
    aiEnrichedInsights?: string;
  } | null>(null);
  const [aiEstimating, setAiEstimating] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.getCategories();
        if (res.success) {
          setCategories(res.categories);
        }
      } catch (err) {
        // Use defaults
      }
    };
    fetchCats();
  }, []);

  const runAiEstimate = async () => {
    if (!formData.foodName) return;
    setAiEstimating(true);
    try {
      const res = await api.estimateShelfLife({
        foodName: formData.foodName,
        category: formData.category,
        preparationTime: formData.preparationTime,
        storageCondition: formData.storageInformation,
        isVegetarian: formData.isVegetarian,
      });

      if (res.success && res.prediction) {
        setAiPreview({
          estimatedHours: res.prediction.estimatedSafeHours,
          riskLevel: res.prediction.riskLevel,
          guidance: res.prediction.safetyGuidance || [],
          aiEnrichedInsights: res.aiEnrichedInsights,
        });
      }
    } catch (err) {
      console.warn('AI estimate error:', err);
    } finally {
      setAiEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createDonation({
        ...formData,
        quantity: Number(formData.quantity),
        ingredients: formData.ingredients.split(',').map((s) => s.trim()),
        allergens: formData.allergens.split(',').map((s) => s.trim()),
      });

      if (res.success && res.donation) {
        if (onDonationCreated) onDonationCreated(res.donation._id);
        onNavigate('donor-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list food donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => onNavigate('donor-dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Donor Dashboard</span>
      </button>

      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Post Food Donation</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Food is automatically matched to verified NGOs within 10 km in Belagavi.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Food Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Food Description & Quantity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.foodName}
                  onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                  placeholder="e.g. Fresh Steamed Rice & Dal Makhani"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="Prepared Meals">Prepared Meals (Cooked)</option>
                  <option value="Bakery">Bakery (Bread, Buns, Pastries)</option>
                  <option value="Produce">Produce (Raw Vegetables & Fruit)</option>
                  <option value="Dairy">Dairy (Milk, Paneer, Curd)</option>
                  <option value="Packaged Goods">Packaged / Dry Groceries</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="meals">Meals (Plates)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="boxes">Boxes</option>
                    <option value="packets">Packets</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Ingredients
                </label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="e.g. Rice, Toor Dal, Ghee, Cumin"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>100% Pure Vegetarian</span>
              </label>

              <div className="flex-1">
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="Allergens (e.g. Dairy, Gluten, Peanuts, None)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Timing & Storage Information */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Preparation & Storage Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preparation / Cooked Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Safe Expiry / Cutoff *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.expiryTime}
                  onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage & Handling Condition *
              </label>
              <input
                type="text"
                required
                value={formData.storageInformation}
                onChange={(e) => setFormData({ ...formData, storageInformation: e.target.value })}
                placeholder="e.g. Held in stainless steel chafing dishes above 65°C / Chilled at 4°C"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            {/* AI Expiry & Risk Estimator Widget */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Prototype Shelf-Life & Safety Risk Estimator
                  </span>
                </div>
                <button
                  type="button"
                  onClick={runAiEstimate}
                  disabled={aiEstimating || !formData.foodName}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {aiEstimating ? 'Calculating...' : 'Run Estimate'}
                </button>
              </div>

              {aiPreview ? (
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      Estimated Safe Consumption Window:{' '}
                      <strong className="text-slate-900">{aiPreview.estimatedHours} Hours</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        aiPreview.riskLevel === 'LOW'
                          ? 'bg-emerald-100 text-emerald-800'
                          : aiPreview.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Risk: {aiPreview.riskLevel}
                    </span>
                  </div>

                  {aiPreview.aiEnrichedInsights && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                      <strong>Belagavi Food Science Insights:</strong>
                      <p className="mt-0.5">{aiPreview.aiEnrichedInsights}</p>
                    </div>
                  )}

                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                    {aiPreview.guidance.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Click 'Run Estimate' to calculate the safe transit duration based on category, preparation time, and Belagavi ambient conditions.
                </p>
              )}

              {/* Strict Disclaimer */}
              <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">
                  <strong>Disclaimer:</strong> Prototype shelf-life/risk estimate. This is not a food safety decision. Never claim that AI guarantees food safety. Always physically inspect food before pickup.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Belagavi Pickup Location & Map Pin */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Belagavi Pickup Location & Geolocation Pin
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  placeholder="e.g. Club Road, Belagavi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Clickable Leaflet Map */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Click map to accurately set Belagavi pickup coordinates:
              </label>
              <BelagaviMap
                selectedCoord={[formData.latitude, formData.longitude]}
                onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                showRadiusKm={10}
                radiusType="MATCHING"
                height="280px"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Donor Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('donor-dashboard')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-donation-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting & Running Matching...' : 'Publish Surplus Food Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
