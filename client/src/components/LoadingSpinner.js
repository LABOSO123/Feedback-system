import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component with customizable size and color.
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg', 'xl')
 * @param {string} props.color - Color of the spinner (default: 'kra-red')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.text - Optional text to display below spinner
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'kra-red', 
  className = '', 
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    'kra-red': 'border-kra-red border-t-transparent',
    'kra-black': 'border-kra-black border-t-transparent',
    'blue': 'border-blue-600 border-t-transparent',
    'gray': 'border-gray-600 border-t-transparent'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color] || colorClasses['kra-red']}
          rounded-full 
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className={`mt-2 text-${size === 'sm' ? 'sm' : 'base'} text-gray-600`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

