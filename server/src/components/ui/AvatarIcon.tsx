import React, { useMemo } from 'react';

interface AvatarIconProps {
  userId: string;
  firstName: string;
  lastName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const AvatarIcon: React.FC<AvatarIconProps> = ({ userId, firstName, lastName, size = 'md' }) => {
  const getInitial = () => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getUserColor = useMemo(() => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    if (!userId) return colors[0]; // Default color if no user

    // Generate a hash from the userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    return colors[Math.abs(hash) % colors.length];
  }, [userId]);

  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className={`${getUserColor} ${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold`}>
      {getInitial()}
    </div>
  );
};

export default AvatarIcon;
