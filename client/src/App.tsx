import { useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChildren } from '@/hooks/use-app-data';
import LoadingSpinner from '@/components/LoadingSpinner';
import FirstRunPage from '@/pages/FirstRunPage';
import HomePage from '@/pages/HomePage';
import ChildChoresPage from '@/pages/ChildChoresPage';
import ChoresPage from '@/pages/ChoresPage';
import TotalsPage from '@/pages/TotalsPage';
import HistoryPage from '@/pages/HistoryPage';
import SettingsPage from '@/pages/SettingsPage';
import { Star, Users, DollarSign, History, Settings, ListTodo } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Footer from '@/components/Footer';
import FeedbackButton from '@/components/FeedbackButton';

function AppContent() {
  const [location] = useLocation();
  const { data: children, isLoading } = useChildren();
  const [showFirstRun, setShowFirstRun] = useState(false);

  useEffect(() => {
    if (!isLoading && children?.length === 0) {
      setShowFirstRun(true);
    }
  }, [children, isLoading]);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed', err));
    }
  }, []);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (showFirstRun) {
    return <FirstRunPage onComplete={() => setShowFirstRun(false)} />;
  }

  return (
    <div className="min-h-screen bg-brand-grayLight text-brand-grayDark">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-coral to-brand-teal rounded-lg flex items-center justify-center">
              <Star className="text-white text-sm" />
            </div>
            <span className="text-2xl font-bold text-brand-coral">Chores</span>
          </div>
          
          {/* Navigation */}
          <nav className="ml-auto flex gap-1 sm:gap-2 overflow-x-auto">
            <Link href="/">
              <button className={`nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                location === '/' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} data-testid="nav-home">
                <Users className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Home</span>
              </button>
            </Link>
            <Link href="/totals">
              <button className={`nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                location === '/totals' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} data-testid="nav-totals">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Totals</span>
              </button>
            </Link>
            <Link href="/chores">
              <button className={`nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                location === '/chores' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} data-testid="nav-chores">
                <ListTodo className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Chores</span>
              </button>
            </Link>
            <Link href="/history">
              <button className={`nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                location === '/history' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} data-testid="nav-history">
                <History className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">History</span>
              </button>
            </Link>
            <Link href="/settings">
              <button className={`nav-tab flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                location === '/settings' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} data-testid="nav-settings">
                <Settings className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Settings</span>
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/child/:id">
            {(params) => <ChildChoresPage childId={params.id} />}
          </Route>
          <Route path="/totals" component={TotalsPage} />
          <Route path="/chores" component={ChoresPage} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route>
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-brand-grayDark mb-4">Page Not Found</h1>
              <Link href="/">
                <button className="bg-brand-coral text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-coral/90 transition-all">
                  Go Home
                </button>
              </Link>
            </div>
          </Route>
        </Switch>
      </main>
      
      <Footer />
      <FeedbackButton />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
