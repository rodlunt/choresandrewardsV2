import { useState } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleFeedbackClick = () => {
    window.open('https://github.com/replit/chores-and-rewards/issues/new', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleFeedbackClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          bg-brand-coral hover:bg-brand-coral/90 
          text-white shadow-lg hover:shadow-xl 
          transition-all duration-300 ease-in-out
          rounded-full p-4 h-14 w-14
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}
        data-testid="button-feedback"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="sr-only">Send Feedback</span>
      </Button>
      
      {isHovered && (
        <div className="absolute bottom-16 right-0 bg-brand-grayDark text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
          Report a bug or suggest a feature
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-brand-grayDark"></div>
        </div>
      )}
    </div>
  );
}