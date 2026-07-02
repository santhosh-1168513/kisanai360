import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherDashboard from './pages/WeatherDashboard';
import WaterAdvisory from './pages/WaterAdvisory';
import ExpertConsultation from './pages/ExpertConsultation';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CropPrices from './pages/CropPrices';
import Reports from './pages/Reports';

export default function App() {
  const [currentView, setView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [language, setLanguage] = useState('english');
  const [darkMode, setDarkMode] = useState(false);

  // Sync app language with logged-in user profile preference
  useEffect(() => {
    if (currentUser && currentUser.language) {
      setLanguage(currentUser.language);
    }
  }, [currentUser]);

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setLanguage('english');
    setView('landing');
  };

  // Main Page View router
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <Landing setView={setView} language={language} />;
      case 'login':
        return <Login setView={setView} setCurrentUser={setCurrentUser} language={language} />;
      case 'register':
        return <Register setView={setView} setCurrentUser={setCurrentUser} language={language} />;
      case 'dashboard':
        return <Dashboard currentUser={currentUser} setView={setView} language={language} />;
      case 'crop-rec':
        return <CropRecommendation currentUser={currentUser} language={language} />;
      case 'disease-det':
        return <DiseaseDetection currentUser={currentUser} language={language} />;
      case 'weather':
        return <WeatherDashboard currentUser={currentUser} language={language} />;
      case 'water':
        return <WaterAdvisory currentUser={currentUser} language={language} />;
      case 'expert':
        return <ExpertConsultation currentUser={currentUser} language={language} />;
      case 'admin':
        return <AdminDashboard currentUser={currentUser} language={language} />;
      case 'crop-prices':
        return <CropPrices currentUser={currentUser} language={language} />;
      case 'reports':
        return <Reports currentUser={currentUser} language={language} />;
      case 'profile':
        return (
          <Profile 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
            language={language} 
            setLanguage={setLanguage} 
          />
        );
      default:
        return <Landing setView={setView} language={language} />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      setView={setView}
      currentUser={currentUser}
      language={language}
      setLanguage={setLanguage}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
}
