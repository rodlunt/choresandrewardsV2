import { Heart, Download, Upload } from 'lucide-react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-teal-500 rounded-lg flex items-center justify-center">
              <Heart className="text-white text-xs" />
            </div>
            <span className="text-lg font-bold text-red-400">Chores & Rewards v1.0.0</span>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p>A family-friendly chore tracking app that works completely offline</p>
            <p className="font-medium text-gray-800">
              🔒 We keep no data • No logins required • Everything stays on your device
            </p>
          </div>
          
          <div className="flex justify-center gap-6 text-sm">
            <a 
              href="mailto:hello@choresandrewards.app" 
              className="text-red-400 hover:text-red-300 transition-colors"
              data-testid="link-contact"
            >
              Contact Us
            </a>
            <Link href="/settings">
              <button className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
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
              className="text-red-400 hover:text-red-300 transition-colors"
              data-testid="button-privacy-policy"
            >
              Privacy Policy
            </button>
          </div>
          
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-200">
            Made with ❤️ for families everywhere • All data stays on your device
          </div>
        </div>
      </div>
    </footer>
  );
}