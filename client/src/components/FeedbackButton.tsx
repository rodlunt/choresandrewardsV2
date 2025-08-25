import { useState } from 'react';
import { MessageSquare, Bug, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleFeedbackClick = () => {
    const issueTemplate = `
**Issue Type**: [Bug Report / Feature Request / Question]

**Description**:
Please describe the issue or feature request in detail.

**Steps to Reproduce** (for bugs):
1. 
2. 
3. 

**Expected Behavior**:
What did you expect to happen?

**Actual Behavior**:
What actually happened?

**Browser/Device Info**:
- Browser: 
- Version: 
- Device: 

**Additional Context**:
Add any other context about the problem here.
    `.trim();

    const encodedTemplate = encodeURIComponent(issueTemplate);
    const url = `https://github.com/replit/chores-and-rewards/issues/new?body=${encodedTemplate}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleFeedbackClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          bg-red-500 hover:bg-red-600 
          text-white shadow-lg hover:shadow-xl 
          transition-all duration-300 ease-in-out
          rounded-full p-4 h-14 w-14
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}
        data-testid="button-feedback"
      >
        <Bug className="w-6 h-6" />
        <span className="sr-only">Report Bug or Request Feature</span>
      </Button>
      
      {isHovered && (
        <div className="absolute bottom-16 right-0 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
          Report bug or request feature
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}