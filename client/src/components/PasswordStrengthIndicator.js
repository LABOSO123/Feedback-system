import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  const getPasswordStrength = (pwd) => {
    let strength = 0;
    let feedback = [];

    if (pwd.length >= 8) strength++;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(pwd)) strength++;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(pwd)) strength++;
    else feedback.push('One lowercase letter');

    if (/\d/.test(pwd)) strength++;
    else feedback.push('One number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;
    else feedback.push('One special character');

    return { strength, feedback };
  };

  const { strength, feedback } = getPasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-kra-red-500', 'bg-kra-black-900'];

  return (
    <div className="mt-2">
      <div className="flex space-x-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              level <= strength ? strengthColors[strength - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="text-xs">
        <span className={`font-medium ${
          strength <= 2 ? 'text-red-600' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {strengthLabels[strength - 1] || 'Very Weak'}
        </span>
        {feedback.length > 0 && (
          <div className="text-gray-500 mt-1">
            Missing: {feedback.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;

