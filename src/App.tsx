/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout, BottomNav } from './components/ui/Layout';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { CommunityScreen } from './components/screens/CommunityScreen';
import { CreateScreen } from './components/screens/CreateScreen';
import { ProjectsScreen } from './components/screens/ProjectsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, loading } = useFirebase();
  const [activeTab, setActiveTab] = useState('home');
  const [showWelcome, setShowWelcome] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 rounded-full border-2 border-neon-purple neon-glow-purple"
        />
      </div>
    );
  }

  if (!user || showWelcome) {
    return <WelcomeScreen onFinish={() => setShowWelcome(false)} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen onNavigate={setActiveTab} />;
      case 'community': return <CommunityScreen />;
      case 'create': return <CreateScreen onComplete={() => setActiveTab('projects')} />;
      case 'projects': return <ProjectsScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </Layout>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
