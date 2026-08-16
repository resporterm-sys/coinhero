import React from 'react';
import { BadgeCheck, Sparkles } from 'lucide-react';
import { VerificationType } from '../types';

interface VerifiedBadgeProps {
  type?: VerificationType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  type = 'none',
  className = '',
  size = 'md',
  showTooltip = true,
}) => {
  const badgeType: VerificationType =
    type === 'purple'
      ? 'purple'
      : type === 'blue'
      ? 'blue'
      : 'none';

  if (badgeType === 'none') return null;

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  };

  const currentSizeClass = sizeClasses[size];

  if (badgeType === 'purple') {
    return (
      <span
        className={`inline-flex items-center justify-center relative group ${className}`}
        title={showTooltip ? 'توثيق أسطوري ملكي بنفسجي (أقوى علامة توثيق)' : undefined}
      >
        {/* Ambient Purple Glow */}
        <span className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full blur-[2px] opacity-75 animate-pulse pointer-events-none" />
        
        {/* Core Purple Royal Badge */}
        <span className="relative flex items-center justify-center text-fuchsia-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]">
          <BadgeCheck className={`${currentSizeClass} fill-purple-600 text-purple-100 stroke-[2.5]`} />
          <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-300 animate-spin-slow pointer-events-none" />
        </span>
      </span>
    );
  }

  // Standard Blue Verification Badge
  return (
    <span
      className={`inline-flex items-center justify-center text-blue-400 group ${className}`}
      title={showTooltip ? 'توثيق رسمي بالعلامة الزرقاء' : undefined}
    >
      <BadgeCheck className={`${currentSizeClass} fill-blue-500 text-slate-900 stroke-[2]`} />
    </span>
  );
};
