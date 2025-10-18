import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, Send, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface BugReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type IssueType = 'bug' | 'feature';

const CATEGORIES = [
  'User Interface',
  'Chores Management',
  'Child Management',
  'Rewards/Payouts',
  'Settings',
  'PWA/Offline',
  'Performance',
  'Other',
];

export default function BugReport({ open, onOpenChange }: BugReportProps) {
  const [issueType, setIssueType] = useState<IssueType>('bug');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      // Temporarily hide the dialog
      onOpenChange(false);

      // Wait for dialog to close
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the screen
      const canvas = await html2canvas(document.body, {
        scale: 0.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
      });

      // Convert to base64
      const dataUrl = canvas.toDataURL('image/png', 0.8);
      setScreenshot(dataUrl);

      // Reopen the dialog
      onOpenChange(true);

      toast({
        title: 'Screenshot captured',
        description: 'Screenshot has been added to your report',
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      onOpenChange(true);
      toast({
        title: 'Screenshot failed',
        description: 'Unable to capture screenshot. You can still submit without it.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
  };

  const getTechnicalInfo = () => {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolution: `${window.innerWidth}x${window.innerHeight}`,
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      buildNumber: import.meta.env.VITE_BUILD_NUMBER || 'dev',
    };
  };

  const handleSubmit = async () => {
    if (!description || !category) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        issueType,
        category,
        description,
        stepsToReproduce: issueType === 'bug' ? stepsToReproduce : undefined,
        expectedBehavior: issueType === 'bug' ? expectedBehavior : undefined,
        actualBehavior: issueType === 'bug' ? actualBehavior : undefined,
        screenshot,
        technicalInfo: getTechnicalInfo(),
      };

      const response = await fetch('/api/issues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const result = await response.json();

      toast({
        title: 'Report submitted!',
        description: `Thank you! Issue #${result.issueNumber} has been created.`,
      });

      // Reset form
      setDescription('');
      setStepsToReproduce('');
      setExpectedBehavior('');
      setActualBehavior('');
      setScreenshot(null);
      setCategory('');
      onOpenChange(false);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'Unable to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = description.trim() && category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report a Bug or Request a Feature</DialogTitle>
          <DialogDescription>
            Help us improve Chores & Rewards by reporting issues or suggesting new features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={issueType}
              onValueChange={(value) => setIssueType(value as IssueType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              {issueType === 'bug' ? 'Bug Description' : 'Feature Description'} *
            </Label>
            <Textarea
              placeholder={
                issueType === 'bug'
                  ? 'Describe the bug you encountered...'
                  : 'Describe the feature you would like...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Bug-specific fields */}
          {issueType === 'bug' && (
            <>
              <div className="space-y-2">
                <Label>Steps to Reproduce</Label>
                <Textarea
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Expected Behavior</Label>
                <Textarea
                  placeholder="What did you expect to happen?"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Actual Behavior</Label>
                <Textarea
                  placeholder="What actually happened?"
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Screenshot */}
          <div className="space-y-2">
            <Label>Screenshot (Optional)</Label>
            {screenshot ? (
              <div className="relative">
                <img
                  src={screenshot}
                  alt="Screenshot preview"
                  className="w-full rounded-lg border border-brand-grayDark/20"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveScreenshot}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleCaptureScreenshot}
                disabled={isCapturing}
                className="w-full"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Screenshot
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-brand-coral hover:bg-brand-coral/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
