import React from 'react';

/**
 * AppShell: Full-viewport, responsive layout shell for all mobile devices, tablets, and laptops.
 * Replaces simulated phone frame with a true production-grade responsive container.
 */
export default function AppShell({ children }) {
  return (
    <div className="app-shell-viewport">
      <div className="app-shell-content">
        {children}
      </div>
    </div>
  );
}
