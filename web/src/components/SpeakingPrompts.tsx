'use client';

import { useState } from 'react';
import { SpeakingPrompt } from '@/lib/types';

interface SpeakingPromptsProps {
  prompts: SpeakingPrompt[];
}

export default function SpeakingPrompts({ prompts }: SpeakingPromptsProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Check for valid prompts
  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-500">
            Error: Invalid speaking prompts
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            The speaking prompts data appears to be missing or invalid. Please try generating new content.
          </p>
          <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
            {JSON.stringify(prompts, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const currentPrompt = prompts[currentPromptIndex];

  // Additional validation for the current prompt
  if (!currentPrompt || !currentPrompt.question || !currentPrompt.modelAnswer ||
      !currentPrompt.question.japanese || !currentPrompt.question.english ||
      !currentPrompt.modelAnswer.japanese || !currentPrompt.modelAnswer.english) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-500">
            Error: Invalid prompt format
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This speaking prompt has an invalid structure. Please try generating new content.
          </p>
          <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
            {JSON.stringify(currentPrompt, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const handleNextPrompt = () => {
    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePreviousPrompt = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(currentPromptIndex - 1);
      setShowAnswer(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 my-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Speaking Prompt ({currentPromptIndex + 1}/{prompts.length})
        </h2>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {showTranslation ? 'Hide Translation' : 'Show Translation'}
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Question:</h3>
        <p className="text-lg text-gray-800 dark:text-white leading-relaxed p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          {currentPrompt.question.japanese}
        </p>
        {showTranslation && (
          <p className="mt-2 text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            {currentPrompt.question.english}
          </p>
        )}
      </div>

      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full py-2 mb-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
        >
          Show Model Answer
        </button>
      ) : (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Model Answer:</h3>
          <p className="text-lg text-gray-800 dark:text-white leading-relaxed p-4 bg-indigo-50 dark:bg-indigo-900 rounded-md">
            {currentPrompt.modelAnswer.japanese}
          </p>
          {showTranslation && (
            <p className="mt-2 text-gray-600 dark:text-gray-400 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-md">
              {currentPrompt.modelAnswer.english}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <button
          onClick={handlePreviousPrompt}
          disabled={currentPromptIndex === 0}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNextPrompt}
          disabled={currentPromptIndex === prompts.length - 1}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
} 