interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_0.0s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_0.2s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_0.4s]" />
    </div>
  );
}
