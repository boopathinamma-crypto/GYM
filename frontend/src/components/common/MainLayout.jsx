import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIAssistant from './AIAssistant';

export default function MainLayout() {
  // Sidebar STARTS CLOSED — user must click ☰ to open
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when window resizes to mobile
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const toggle = () => setSidebarOpen(prev => !prev);
  const close = () => setSidebarOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Sidebar — slides in/out */}
      <Sidebar isOpen={sidebarOpen} onClose={close} />

      {/* Main content — shifts right when sidebar is open */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '0px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 0.3s ease',
      }}>
        <Navbar onMenuToggle={toggle} sidebarOpen={sidebarOpen} />
        <main style={{
          flex: 1,
          padding: '24px 28px',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}