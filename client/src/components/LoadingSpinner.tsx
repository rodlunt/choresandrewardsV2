export default function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-4 border-brand-coral/20 border-t-brand-coral rounded-full animate-spin"></div>
    </div>
  );
}
