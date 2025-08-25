import { Heart, Download } from 'lucide-react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-grayLight/20 mt-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-coral to-brand-teal rounded-lg flex items-center justify-center">
              <Heart className="text-white text-xs" />
            </div>
            <span className="text-lg font-bold text-brand-coral">Chores & Rewards v1.0.0</span>
          </div>
          
          <div className="text-sm text-brand-grayDark/70">
            <p>A family-friendly chore tracking app that works completely offline</p>
          </div>
          
          <div className="flex justify-center gap-6 text-sm">
            <a 
              href="mailto:hello@choresandrewards.app" 
              className="text-brand-coral hover:text-brand-coral/80 transition-colors"
              data-testid="link-contact"
            >
              Contact Us
            </a>
            <Link href="/settings">
              <button className="text-brand-coral hover:text-brand-coral/80 transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" />
                Export/Import
              </button>
            </Link>
            <button 
              onClick={() => {
                const privacyText = `Privacy Policy

This app is designed with your privacy in mind:

• All data is stored locally on your device using IndexedDB
• No personal information is collected or transmitted to our servers
• No user accounts, logins, or authentication required
• No cookies, tracking, or analytics
• All processing happens offline in your browser
• Data can be exported/imported at any time by you

This application works completely offline and respects your privacy.`;
                
                alert(privacyText);
              }}
              className="text-brand-coral hover:text-brand-coral/80 transition-colors"
              data-testid="button-privacy-policy"
            >
              Privacy Policy
            </button>
          </div>
          
          <div className="text-xs text-brand-grayDark/50 pt-4 border-t border-brand-grayLight/20">
            Made with ❤️ for families everywhere • All data stays on your device
          </div>
        </div>
      </div>
    </footer>
  );
}