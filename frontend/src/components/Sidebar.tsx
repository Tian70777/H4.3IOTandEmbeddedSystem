import { useState, useEffect } from 'react'
import './Sidebar.css'

interface SidebarProps {
  onNavigate: (page: 'dashboard' | 'history' | 'live-graphs') => void
  currentPage: 'dashboard' | 'history' | 'live-graphs'
}

const Sidebar = ({ onNavigate, currentPage }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse sidebar on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsCollapsed(true)
      }
    }
    
    // Check on mount
    handleResize()
    
    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <button 
        className={`sidebar-toggle ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {isCollapsed ? '☰' : '✕'}
      </button>

      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>🏠 Menu</h2>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsCollapsed(true)}
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Historical Analysis</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'live-graphs' ? 'active' : ''}`}
            onClick={() => onNavigate('live-graphs')}
          >
            <span className="nav-icon">📉</span>
            <span className="nav-text">Live Graphs</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-version">v1.0.0</p>
        </div>
      </div>
    </>
  )
}

export default Sidebar
