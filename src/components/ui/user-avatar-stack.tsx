'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface UserData {
  id: number;
  name: string;
  email?: string;
}

interface UserAvatarStackProps {
  users: UserData[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Individual avatar with hover/click popover
function UserAvatarWithPopover({ 
  user, 
  size, 
  zIndex,
  sizeClasses,
  iconSizes,
}: { 
  user: UserData; 
  size: 'sm' | 'md' | 'lg';
  zIndex: number;
  sizeClasses: Record<string, string>;
  iconSizes: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative cursor-pointer transition-all duration-200 ease-out hover:scale-110 hover:z-50"
          style={{ zIndex }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Avatar
            className={`${sizeClasses[size]} border-2 border-background ring-1 ring-border transition-shadow duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg`}
          >
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              {user.name ? (
                getInitials(user.name)
              ) : (
                <User className={iconSizes[size]} />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-auto px-3 py-2"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <p className="text-sm font-medium">{user.name}</p>
        {user.email && (
          <p className="text-xs text-muted-foreground">{user.email}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function UserAvatarStack({ 
  users, 
  maxVisible = 4, 
  size = 'md',
  className = '' 
}: UserAvatarStackProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  // Size configurations - increased sizes
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Avatar Stack */}
      <div className="flex -space-x-3">
        {visibleUsers.map((user, index) => (
          <UserAvatarWithPopover
            key={user.id}
            user={user}
            size={size}
            zIndex={visibleUsers.length - index}
            sizeClasses={sizeClasses}
            iconSizes={iconSizes}
          />
        ))}
      </div>

      {/* +N more text */}
      {remainingCount > 0 && (
        <span className="ml-3 text-sm text-muted-foreground font-medium">
          +{remainingCount} more
        </span>
      )}

      {/* Show count if no users */}
      {users.length === 0 && (
        <span className="text-sm text-muted-foreground">No users assigned</span>
      )}
    </div>
  );
}
