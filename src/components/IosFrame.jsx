import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, ShieldCheck, Sparkles, Smartphone, Monitor } from 'lucide-react';

export default function IosFrame({ children, isFullWidth, setIsFullWidth, activeOrdersCount, currentRole }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`ios-frame-container ${isFullWidth ? 'full-width' : ''}`}>
      {/* iOS Top Status Bar */}
      <div className="ios-status-bar">
        <span>{timeStr || '9:41'}</span>

        {/* Dynamic Island */}
        <div className="ios-dynamic-island" title="Dynamic Island Activity Indicator">
          <div className="dynamic-island-lens" />
          <div className="dynamic-island-indicator">
            {activeOrdersCount > 0 ? (
              <>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', display: 'inline-block' }} />
                <span>{activeOrdersCount} Live</span>
              </>
            ) : (
              <>
                <ShieldCheck size={11} color="#34D399" />
                <span style={{ fontSize: 9 }}>Verified</span>
              </>
            )}
          </div>
        </div>

        {/* Status Right Icons */}
        <div className="ios-status-right">
          <Wifi size={13} strokeWidth={2.5} />
          <Battery size={14} strokeWidth={2.5} />
        </div>
      </div>

      {/* Frame Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
      </div>

      {/* iOS Home Indicator Bar */}
      <div style={{
        width: 134,
        height: 5,
        borderRadius: 3,
        background: '#000000',
        opacity: 0.35,
        margin: '6px auto 8px',
        flexShrink: 0
      }} />
    </div>
  );
}
