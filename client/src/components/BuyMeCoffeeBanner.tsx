import { useState, useEffect } from 'react';
import { Coffee, X } from 'lucide-react';

export default function BuyMeCoffeeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user has clicked the Buy Me A Coffee link before
    const clicked = localStorage.getItem('bmc-link-clicked');
    // Check if user closed the banner this session
    const closedThisSession = sessionStorage.getItem('bmc-banner-closed');

    if (clicked === 'true' || closedThisSession === 'true') {
      setIsVisible(false);
    } else {
      setIsLoaded(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Only hide for this session, will show again on next visit
    sessionStorage.setItem('bmc-banner-closed', 'true');
  };

  const handleCoffeeClick = () => {
    // Mark that user clicked the link - don't show banner again
    localStorage.setItem('bmc-link-clicked', 'true');
  };

  if (!isVisible || !isLoaded) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-brand-coral to-brand-yellow border-b border-brand-coral/20 shadow-soft">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 flex-wrap text-sm">
        <p className="text-white font-medium flex items-center gap-2">
          <Coffee className="w-4 h-4" />
          <span className="hidden sm:inline">Enjoying this app? Support its development with a coffee!</span>
          <span className="sm:hidden">Like this app? Buy me a coffee!</span>
        </p>
        <a
          href="https://buymeacoffee.com/rodluntgithub"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCoffeeClick}
          className="inline-flex items-center gap-1.5 bg-white text-brand-coral px-3 py-1.5 rounded-lg font-bold hover:bg-brand-grayLight transition-all shadow-sm hover:shadow-md"
        >
          <Coffee className="w-4 h-4" />
          <span>Buy me a coffee</span>
        </a>
        <button
          onClick={handleClose}
          className="inline-flex items-center gap-1 text-white/90 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Close</span>
        </button>
      </div>
    </div>
  );
}
