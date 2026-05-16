import React from 'react';

export default function FreshTexfyLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
      {/* Lime Graphic & Shadow Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div className="fruit-float">
          <svg width="42" height="42" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <defs>
              <radialGradient id="limeGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
              </radialGradient>
            </defs>
            {/* Leaves */}
            <path d="M 17 10 Q 11 5 9 8 Q 13 13 17 10 Z" fill="#15803d" />
            <path d="M 17 10 Q 23 5 25 8 Q 21 13 17 10 Z" fill="#16a34a" />
            
            {/* Main Fruit Body */}
            <circle cx="17" cy="20" r="11" fill="#22c55e" />
            <circle cx="17" cy="20" r="11" fill="url(#limeGradient)" />
            
            {/* Highlight */}
            <ellipse cx="12" cy="16" rx="4.5" ry="2.5" fill="#4ade80" opacity="0.6" transform="rotate(-30 12 16)" />
          </svg>
        </div>
        {/* Shadow */}
        <div className="fruit-shadow" />
      </div>

      {/* Text Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{
          color: '#ffffff',
          fontWeight: '900',
          fontSize: '18px',
          letterSpacing: '-0.5px',
          lineHeight: '1',
        }}>
          Fresh Texfy
        </div>
        <div style={{
          background: '#7C3AED',
          color: '#ffffff',
          fontSize: '9px',
          fontWeight: 'bold',
          padding: '3px 8px',
          borderRadius: '99px',
          marginTop: '3px',
          lineHeight: '1',
          letterSpacing: '0.5px',
        }}>
          BETA
        </div>
      </div>
    </div>
  );
}
