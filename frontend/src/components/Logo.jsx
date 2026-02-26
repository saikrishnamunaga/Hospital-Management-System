import React from 'react';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: 32,
    medium: 42,
    large: 56,
  };

  const dimension = sizes[size] || sizes.medium;

  return (
    <svg
      className={`logo-svg ${className}`}
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="url(#logoGradient)"
      />
      
      {/* Medical Cross */}
      <rect
        x="26"
        y="14"
        width="12"
        height="36"
        rx="2"
        fill="white"
      />
      <rect
        x="14"
        y="26"
        width="36"
        height="12"
        rx="2"
        fill="white"
      />
      
      {/* Inner Cross Detail */}
      <rect
        x="28"
        y="22"
        width="8"
        height="20"
        rx="1"
        fill="url(#logoGradientInner)"
      />
      <rect
        x="22"
        y="28"
        width="20"
        height="8"
        rx="1"
        fill="url(#logoGradientInner)"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient
          id="logoGradient"
          x1="2"
          y1="2"
          x2="62"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient
          id="logoGradientInner"
          x1="22"
          y1="22"
          x2="38"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Logo with text for sidebar
export const LogoWithText = ({ size = 'medium' }) => {
  const sizes = {
    small: { icon: 28, title: '0.875rem', subtitle: '0.625rem' },
    medium: { icon: 42, title: '1.125rem', subtitle: '0.75rem' },
    large: { icon: 56, title: '1.375rem', subtitle: '0.875rem' },
  };

  const config = sizes[size] || sizes.medium;

  return (
    <div className="logo-with-text">
      <Logo size={size} />
      <div className="logo-text">
        <h1 style={{ fontSize: config.title }}>HMS</h1>
        <span style={{ fontSize: config.subtitle }}>Hospital System</span>
      </div>
    </div>
  );
};

export default Logo;
