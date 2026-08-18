import { useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChildren } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import FirstRunPage from '@/pages/FirstRunPage';
import HomePage from '@/pages/HomePage';
import ChildChoresPage from '@/pages/ChildChoresPage';
import ChoresPage from '@/pages/ChoresPage';
import TotalsPage from '@/pages/TotalsPage';
import HistoryPage from '@/pages/HistoryPage';
import SettingsPage, { LAST_EXPORT_STORAGE_KEY } from '@/pages/SettingsPage';
import { Users, DollarSign, History, Settings, ListTodo } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Footer from '@/components/Footer';
import FeedbackButton from '@/components/FeedbackButton';
import BuyMeCoffeeBanner from '@/components/BuyMeCoffeeBanner';

const BACKUP_REMINDER_SHOWN_KEY = 'chores-rewards-backup-reminder-shown';
const BACKUP_REMINDER_STALE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const BACKUP_REMINDER_THROTTLE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function AppContent() {
  const [location] = useLocation();
  const { data: children, isLoading } = useChildren();
  const [showFirstRun, setShowFirstRun] = useState(false);
  const { toast } = useToast();

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

    // Request persistent storage so the browser is less likely to evict
    // IndexedDB under storage pressure. Best-effort, no UI: whether it was
    // granted is only ever surfaced to the console.
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        console.info('Persistent storage granted:', granted);
      });
    }
  }, []);

  useEffect(() => {
    // Gentle backup reminder: only once there is family data to lose, and
    // at most once every 14 days, so it doesn't nag on every launch.
    if (isLoading || !children || children.length === 0) {
      return;
    }

    const now = Date.now();
    const lastExport = Number(localStorage.getItem(LAST_EXPORT_STORAGE_KEY)) || 0;
    const lastReminder = Number(localStorage.getItem(BACKUP_REMINDER_SHOWN_KEY)) || 0;

    const exportIsStale = lastExport === 0 || now - lastExport > BACKUP_REMINDER_STALE_MS;
    const reminderDue = now - lastReminder > BACKUP_REMINDER_THROTTLE_MS;

    if (exportIsStale && reminderDue) {
      toast({
        title: "Back up your data",
        description: "It's been a while since your last backup. Head to Settings > Export Backup to keep your family's data safe.",
      });
      localStorage.setItem(BACKUP_REMINDER_SHOWN_KEY, String(now));
    }
  }, [children, isLoading, toast]);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (showFirstRun) {
    return <FirstRunPage onComplete={() => setShowFirstRun(false)} />;
  }

  return (
    <div className="min-h-screen bg-brand-grayLight text-brand-grayDark flex flex-col">
      {/* Buy Me A Coffee Banner */}
      <BuyMeCoffeeBanner />

      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center">
            <img 
              src="/logo.webp" 
              alt="Chores and Rewards" 
              className="h-8 w-auto"
            />
          </div>
          
          {/* Navigation */}
          <nav className="ml-auto flex gap-1 flex-shrink-0">
            <Link href="/">
              <button className={`nav-tab flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all ${
                location === '/' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} aria-label="Home" data-testid="nav-home">
                <Users className="w-4 h-4" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Home</span>
              </button>
            </Link>
            <Link href="/totals">
              <button className={`nav-tab flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all ${
                location === '/totals' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} aria-label="Totals" data-testid="nav-totals">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Totals</span>
              </button>
            </Link>
            <Link href="/chores">
              <button className={`nav-tab flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all ${
                location === '/chores' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} aria-label="Chores" data-testid="nav-chores">
                <ListTodo className="w-4 h-4" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">Chores</span>
              </button>
            </Link>
            <Link href="/history">
              <button className={`nav-tab flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all ${
                location === '/history' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} aria-label="History" data-testid="nav-history">
                <History className="w-4 h-4" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">History</span>
              </button>
            </Link>
            <Link href="/settings">
              <button className={`nav-tab flex items-center justify-center px-3 py-2 rounded-xl transition-all ${
                location === '/settings' 
                  ? 'bg-white text-brand-coral shadow-soft' 
                  : 'text-brand-grayDark hover:bg-white/70'
              }`} aria-label="Settings" data-testid="nav-settings">
                <Settings className="w-4 h-4" />
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1">
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
