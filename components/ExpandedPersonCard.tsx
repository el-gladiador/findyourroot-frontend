'use client';

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Edit3, Trash2, UserPlus, Loader2, Instagram, Heart, Flame, Check, Link } from 'lucide-react';
import { Person } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { ApiClient } from '@/lib/api';

interface ExpandedPersonCardProps {
  person: Person;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  canEdit?: boolean;
  isContributor?: boolean; // Keep for API but not used in UI
  onSuccess?: (message: string) => void;
  currentUserId?: string; // Current user's ID to check if already liked
  isAdmin?: boolean; // Is current user an admin
}

// Parse Instagram username from URL or handle
const parseInstagramUsername = (input: string): string => {
  let username = input.trim();
  username = username.replace(/^@/, '');
  // Handle full URL
  if (username.includes('instagram.com/')) {
    const parts = username.split('instagram.com/');
    if (parts.length > 1) {
      username = parts[1].split('/')[0].split('?')[0];
    }
  }
  return username;
};

// Get avatar URL with fallback
const getAvatarUrl = (person: Person, useFallback: boolean = false): string => {
  // If we have Instagram avatar and it hasn't failed, use it
  if (!useFallback && person.linked_user_id && person.instagram_avatar_url) {
    return person.instagram_avatar_url;
  }
  // Fallback to regular avatar or ui-avatars
  return person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=160`;
};

// Get popularity indicator based on likes count
const getPopularityIndicator = (likesCount: number = 0) => {
  if (likesCount === 0) {
    return {
      icon: 'heart-outline',
      bgColor: 'bg-slate-200 dark:bg-slate-600',
      textColor: 'text-slate-600 dark:text-slate-200',
      showCount: false,
      animate: false,
    };
  } else if (likesCount <= 5) {
    return {
      icon: 'heart',
      bgColor: 'bg-rose-100 dark:bg-rose-900/40',
      textColor: 'text-rose-600 dark:text-rose-400',
      showCount: true,
      animate: false,
    };
  } else if (likesCount <= 15) {
    return {
      icon: 'heart',
      bgColor: 'bg-rose-100 dark:bg-rose-900/40',
      textColor: 'text-rose-600 dark:text-rose-400',
      showCount: true,
      animate: true,
    };
  } else {
    return {
      icon: 'fire',
      bgColor: 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40',
      textColor: 'text-orange-600 dark:text-orange-400',
      showCount: true,
      animate: true,
    };
  }
};

const ExpandedPersonCard: React.FC<ExpandedPersonCardProps> = memo(({
  person,
  onClose,
  onEdit,
  onAddChild,
  canEdit = false,
  isContributor = false,
  onSuccess,
  currentUserId,
  isAdmin = false,
}) => {
  const removePerson = useAppStore((state) => state.removePerson);
  const updatePersonLocal = useAppStore((state) => state.updatePersonLocal);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(person.likes_count || 0);
  const [localLikedBy, setLocalLikedBy] = useState<string[]>(person.liked_by || []);
  const [avatarFailed, setAvatarFailed] = useState(false);
  
  // Instagram editing state
  const [showInstagramInput, setShowInstagramInput] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isSavingInstagram, setIsSavingInstagram] = useState(false);
  const [localInstagramUsername, setLocalInstagramUsername] = useState(person.instagram_username || '');
  
  // Can edit Instagram: admin for any linked person, or user for their own node
  const isOwnNode = person.linked_user_id === currentUserId;
  const canEditInstagram = person.linked_user_id && (isAdmin || isOwnNode);
  
  const hasLiked = currentUserId ? localLikedBy.includes(currentUserId) : false;
  
  // Layout transition for shared elements
  const layoutTransition = {
    type: 'tween' as const,
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  };
  
  // Fast fade for non-shared elements on exit
  const contentTransition = {
    duration: 0.15,
    ease: 'easeOut' as const,
  };

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;
    
    setIsLiking(true);
    try {
      if (hasLiked) {
        // Unlike
        const result = await ApiClient.unlikePerson(person.id);
        if (!result.error) {
          const newCount = Math.max(0, localLikesCount - 1);
          const newLikedBy = localLikedBy.filter(id => id !== currentUserId);
          setLocalLikesCount(newCount);
          setLocalLikedBy(newLikedBy);
          // Update store locally
          updatePersonLocal(person.id, { 
            likes_count: newCount,
            liked_by: newLikedBy
          });
        }
      } else {
        // Like
        const result = await ApiClient.likePerson(person.id);
        if (!result.error) {
          const newCount = localLikesCount + 1;
          const newLikedBy = [...localLikedBy, currentUserId];
          setLocalLikesCount(newCount);
          setLocalLikedBy(newLikedBy);
          // Update store locally
          updatePersonLocal(person.id, { 
            likes_count: newCount,
            liked_by: newLikedBy
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSaveInstagram = async () => {
    if (!instagramUrl.trim()) {
      setShowInstagramInput(false);
      return;
    }
    
    setIsSavingInstagram(true);
    try {
      const username = parseInstagramUsername(instagramUrl);
      
      let result;
      if (isOwnNode) {
        // User updating their own node
        result = await ApiClient.updateMyInstagram(username);
      } else if (isAdmin) {
        // Admin updating any node
        result = await ApiClient.updatePersonInstagram(person.id, username);
      }
      
      if (result && !result.error) {
        setLocalInstagramUsername(username);
        updatePersonLocal(person.id, { instagram_username: username });
        onSuccess?.('Instagram linked successfully!');
        setShowInstagramInput(false);
        setInstagramUrl('');
      } else {
        onSuccess?.(`Error: ${result?.error || 'Failed to update Instagram'}`);
      }
    } catch (error) {
      console.error('Failed to save Instagram:', error);
      onSuccess?.('Failed to update Instagram');
    } finally {
      setIsSavingInstagram(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${person.name} from the family tree?`)) {
      return;
    }
    
    setIsDeleting(true);
    const result = await removePerson(person.id);
    setIsDeleting(false);
    
    if (result.isSuggestion && result.message) {
      onSuccess?.(result.message);
    }
    
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={contentTransition}
        className="fixed inset-0 z-[99998] bg-black/70"
        onClick={onClose}
      />

      {/* Card positioned at center */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none p-4">
        {/* The circle morphs into this card */}
        <motion.div
          layoutId={`card-${person.id}`}
          transition={layoutTransition}
          style={{ 
            borderRadius: 24,
          }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-800 shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={contentTransition}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 active:scale-95 transition-all"
          >
            <X size={18} />
          </motion.button>

          {/* Gradient Header */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={contentTransition}
            className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" 
          />

          {/* Content Section */}
          <div className="relative px-5 pb-5">
            {/* Avatar - morphs from full-size to smaller centered */}
            <div className="flex justify-center -mt-12 mb-3">
              <div className="relative">
                {/* Glow effect */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={contentTransition}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 blur-xl" 
                />
                <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-xl">
                  <motion.img
                    layoutId={`avatar-img-${person.id}`}
                    transition={layoutTransition}
                    src={getAvatarUrl(person, avatarFailed)}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                </div>
              </div>
            </div>

            {/* Popularity Badge with Like Button */}
            <div className="flex justify-center items-center gap-2 mb-2">
              {/* Role Label */}
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {person.role}
              </span>
              
              {/* Like Button + Count */}
              {(() => {
                const pop = getPopularityIndicator(localLikesCount);
                return (
                  <motion.button
                    layoutId={`popularity-${person.id}`}
                    transition={layoutTransition}
                    onClick={handleLike}
                    disabled={!currentUserId || isLiking}
                    className={`${pop.bgColor} px-3 py-1.5 rounded-full flex items-center gap-1.5 
                      ${currentUserId ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'} 
                      transition-all disabled:opacity-50`}
                    whileTap={currentUserId ? { scale: 0.9 } : undefined}
                  >
                    {isLiking ? (
                      <Loader2 size={16} className={`${pop.textColor} animate-spin`} />
                    ) : pop.icon === 'heart-outline' ? (
                      <Heart size={16} className={`${pop.textColor} ${hasLiked ? 'fill-current' : ''}`} strokeWidth={2} />
                    ) : pop.icon === 'heart' ? (
                      <Heart 
                        size={16} 
                        className={`${pop.textColor} ${hasLiked ? 'fill-current' : ''}`} 
                        fill={hasLiked ? 'currentColor' : 'none'} 
                        strokeWidth={hasLiked ? 0 : 2} 
                      />
                    ) : (
                      <Flame size={16} className={pop.textColor} fill="currentColor" strokeWidth={0} />
                    )}
                    <span className={`${pop.textColor} text-sm font-semibold`}>
                      {localLikesCount}
                    </span>
                  </motion.button>
                );
              })()}
            </div>

            {/* Name - Shared Element */}
            <motion.div
              layoutId={`name-${person.id}`}
              transition={layoutTransition}
              className="text-center mb-4"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {person.name}
              </h2>
            </motion.div>

            {/* Info Cards - Fade in/out quickly */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={contentTransition}
              className="space-y-2.5"
            >
              {/* Birth Info */}
              {person.birth && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Birth Year</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{person.birth}</p>
                  </div>
                </div>
              )}

              {/* Instagram Link - Only show if person is linked to a user */}
              {person.linked_user_id && localInstagramUsername && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://instagram.com/${localInstagramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                        <Instagram size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">@{localInstagramUsername}</p>
                          {person.instagram_is_verified && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                        </div>
                        {person.instagram_full_name && person.instagram_full_name !== localInstagramUsername && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{person.instagram_full_name}</p>
                        )}
                      </div>
                    </a>
                    {/* Edit button for admin or owner */}
                    {canEditInstagram && (
                      <button
                        onClick={() => {
                          setInstagramUrl(localInstagramUsername);
                          setShowInstagramInput(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-500 transition-colors"
                        title="Edit Instagram"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                  {/* Instagram Bio */}
                  {person.instagram_bio && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {person.instagram_bio}
                    </p>
                  )}
                </div>
              )}

              {/* Instagram Input - Show when editing or when no Instagram set but can edit */}
              {showInstagramInput && canEditInstagram && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <Instagram size={16} className="text-white" />
                    </div>
                    <input
                      type="text"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="Paste Instagram URL or username"
                      className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveInstagram}
                      disabled={isSavingInstagram}
                      className="p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                      {isSavingInstagram ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setShowInstagramInput(false);
                        setInstagramUrl('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Paste your Instagram profile URL or just the username
                  </p>
                </div>
              )}

              {/* Link Instagram Button - Show if linked but no Instagram AND can edit */}
              {person.linked_user_id && !localInstagramUsername && canEditInstagram && !showInstagramInput && (
                <button
                  onClick={() => setShowInstagramInput(true)}
                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <Link size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {isOwnNode ? 'Link your Instagram' : 'Link Instagram'}
                  </span>
                </button>
              )}

              {/* Linked Account Badge - Show if linked but no Instagram AND cannot edit */}
              {person.linked_user_id && !localInstagramUsername && !canEditInstagram && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Verified Family Member</span>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={contentTransition}
              className="flex gap-2 mt-4"
            >
              {/* Add Child Button */}
              {canEdit && onAddChild && (
                <button
                  onClick={onAddChild}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-transform bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20"
                >
                  <UserPlus size={18} />
                  <span>Add Child</span>
                </button>
              )}

              {/* Edit Button */}
              {canEdit && onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-semibold active:scale-[0.98] transition-all bg-indigo-600 hover:bg-indigo-700"
                >
                  <Edit3 size={18} />
                  Edit
                </button>
              )}

              {/* Delete Button */}
              {canEdit && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-11 flex items-center justify-center py-2.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                  title="Delete"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
});

ExpandedPersonCard.displayName = 'ExpandedPersonCard';

export default ExpandedPersonCard;
