import React, { useState } from 'react';
import { User, Sprout, Shield, Save, CheckCircle, RotateCcw } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Profile({ currentUser, setCurrentUser, language, setLanguage }) {
  const [name, setName] = useState(currentUser.name);
  const [district, setDistrict] = useState(currentUser.district || '');
  const [village, setVillage] = useState(currentUser.village || '');
  const [soilType, setSoilType] = useState(currentUser.soilType || 'Red Soil');
  const [waterSource, setWaterSource] = useState(currentUser.waterSource || 'Borewell');
  const [farmSize, setFarmSize] = useState(currentUser.farmSize || '');
  const [previousCrop, setPreviousCrop] = useState(currentUser.previousCrop || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const t = translations[language] || translations.english;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSaved(false);

    try {
      const res = await fetch(`/api/auth/profile?userId=${currentUser.userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': currentUser.userId
        },
        body: JSON.stringify({
          name,
          district,
          village,
          soilType,
          waterSource,
          farmSize,
          previousCrop,
          language
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        alert(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile in backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
          Farm Profile Setup
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Review and update your profile parameters to fine-tune AI recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Farmer Info (Takes 2/5 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-center">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="bg-primary hover:bg-primary-dark text-white rounded-full text-2xl font-bold h-20 w-20 flex items-center justify-center shadow-lg border-4 border-slate-100 dark:border-slate-800 transition">
                {currentUser.name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins mt-2">{currentUser.name}</h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-gray-500 rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide">
                Role: {currentUser.role}
              </span>
            </div>

            {/* Profile fields */}
            <div className="flex flex-col gap-4 text-left border-t border-gray-150 dark:border-slate-800 pt-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Farmer Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Mobile Number</label>
                <input
                  type="text"
                  value={currentUser.phone}
                  disabled
                  className="w-full rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-gray-400 px-4 py-2 text-xs cursor-not-allowed outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Select Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2 text-xs outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
                >
                  <option value="english">English</option>
                  <option value="telugu">తెలుగు (Telugu)</option>
                  <option value="hindi">हिन्दी (Hindi)</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Specs (Takes 3/5 width) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-left">
            <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 font-poppins pb-2 border-b border-gray-50 dark:border-slate-850">
              Farm Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">District Location</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="E.g., Guntur"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Village Location</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="E.g., Tenali"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Soil Composition</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
                >
                  <option value="Red Soil">Red Soil (ఎర్ర నేలలు)</option>
                  <option value="Black Soil">Black Cotton Soil (నల్ల రేగడి నేలలు)</option>
                  <option value="Clay Soil">Clay Soil (మట్టి నేలలు)</option>
                  <option value="Sandy Soil">Sandy Loam (ఇసుక నేలలు)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Water Supply Source</label>
                <select
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
                >
                  <option value="Borewell">Borewell (బావి/బోరు బావి)</option>
                  <option value="Canal">Canal Irrigation (కాలువ నీరు)</option>
                  <option value="Rainfed">Rainfed (వర్షాధారం)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Total Land Area (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="2.5"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Previously Cultivated Crop</label>
                <input
                  type="text"
                  value={previousCrop}
                  onChange={(e) => setPreviousCrop(e.target.value)}
                  placeholder="E.g., Groundnut"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            {/* Save profile */}
            <div className="flex justify-end gap-3 mt-4 print:hidden">
              {isSaved && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4 animate-bounce" />
                  <span>Profile updated successfully!</span>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition font-poppins"
              >
                <Save className="w-4.5 h-4.5 text-accent" />
                <span>Save Profile Parameters</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
