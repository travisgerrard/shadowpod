'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

interface LevelSelectorProps {
  onLevelChange: (level: string) => void;
  onApiTokenChange: (token: string | null) => void;
}

export default function LevelSelector({ onLevelChange, onApiTokenChange }: LevelSelectorProps) {
  const [useWaniKani, setUseWaniKani] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // JLPT levels
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('wanikani_api_token, selected_wanikani_level')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const hasToken = !!data.wanikani_api_token;
          setUseWaniKani(hasToken);
          setApiToken(data.wanikani_api_token || '');
          
          if (data.selected_wanikani_level) {
            setSelectedLevel(data.selected_wanikani_level);
            onLevelChange(data.selected_wanikani_level);
          }
          
          if (hasToken) {
            onApiTokenChange(data.wanikani_api_token);
          } else {
            onApiTokenChange(null);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [onLevelChange, onApiTokenChange]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = e.target.value;
    setSelectedLevel(level);
    onLevelChange(level);
    
    // Update user profile
    updateUserProfile({ selected_wanikani_level: level });
  };

  const handleApiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiToken(e.target.value);
  };

  const handleToggleWaniKani = () => {
    const newUseWaniKani = !useWaniKani;
    setUseWaniKani(newUseWaniKani);
    
    if (!newUseWaniKani) {
      onApiTokenChange(null);
    } else if (apiToken) {
      onApiTokenChange(apiToken);
    }
  };

  const handleSaveApiToken = async () => {
    if (!apiToken.trim()) {
      setError('API token cannot be empty');
      return;
    }
    
    try {
      // Update user profile with the new token
      await updateUserProfile({ wanikani_api_token: apiToken });
      
      onApiTokenChange(apiToken);
      setError(null);
    } catch (error) {
      console.error('Error saving API token:', error);
      setError('Failed to save API token');
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', session.user.id);
    
    if (error) {
      throw error;
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Vocabulary Level
      </h2>
      
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={useWaniKani}
            onChange={handleToggleWaniKani}
            className="form-checkbox h-5 w-5 text-indigo-600"
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">
            Use WaniKani API
          </span>
        </label>
      </div>
      
      {useWaniKani ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            WaniKani API Token
          </label>
          <div className="flex">
            <input
              type="text"
              value={apiToken}
              onChange={handleApiTokenChange}
              placeholder="Enter your WaniKani API token"
              className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleSaveApiToken}
              className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            >
              Save
            </button>
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get your token from your WaniKani account settings
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            JLPT Level
          </label>
          <select
            value={selectedLevel}
            onChange={handleLevelChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
} 