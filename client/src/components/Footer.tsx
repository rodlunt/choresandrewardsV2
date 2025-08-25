import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-grayLight/20 mt-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-coral to-brand-teal rounded-lg flex items-center justify-center">
              <Heart className="text-white text-xs" />
            </div>
            <span className="text-lg font-bold text-brand-coral">Chores & Rewards</span>
          </div>
          
          <div className="text-sm text-brand-grayDark/70 space-y-2">
            <p>A family-friendly chore tracking app that works completely offline</p>
            <p className="font-medium text-brand-grayDark">
              🔒 We keep no data • No logins required • Everything stays on your device
            </p>
          </div>
          
          <div className="flex justify-center gap-6 text-sm">
            <a 
              href="mailto:hello@choresandrewards.app" 
              className="text-brand-coral hover:text-brand-coral/80 transition-colors"
              data-testid="link-contact"
            >
              Contact Us
            </a>
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
            Made with ❤️ for families everywhere
          </div>
        </div>
      </div>
    </footer>
  );
}