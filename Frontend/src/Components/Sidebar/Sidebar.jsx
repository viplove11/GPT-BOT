import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Mock recent chat history data
  const recentChats = [
    { id: 1, title: 'Genai Protos', time: '2h ago' },
    { id: 2, title: 'Project Discussion', time: 'Yesterday' },
    { id: 3, title: 'Ideas Brainstorm', time: '2 days ago' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2 className="sidebar-title">Recent Chats</h2>}
        <button 
          className="toggle-button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className="toggle-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
            />
          </svg>
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="chat-list">
          {recentChats.map((chat) => (
            <div key={chat.id} className="chat-item">
              <span className="chat-title">{chat.title}</span>
              <span className="chat-time">{chat.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;