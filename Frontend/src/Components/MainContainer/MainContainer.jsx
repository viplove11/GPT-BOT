import React, { useState, useEffect, useRef } from 'react';
import { FiPaperclip } from 'react-icons/fi';
import { IoSendSharp } from "react-icons/io5";
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PulseLoader } from 'react-spinners';
import './MainContainer.css';
import { genai_logo, icon } from "../../assets/asstes";

const MainContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem('user_id');
    let storedSessionId = localStorage.getItem('session_id');
    if (!storedUserId || !storedSessionId) {
      storedUserId = uuidv4();
      storedSessionId = uuidv4();
      localStorage.setItem('user_id', storedUserId);
      localStorage.setItem('session_id', storedSessionId);
    }
    setUserId(storedUserId);
    setSessionId(storedSessionId);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      setIsLoading(true);

      try {
        const response = await fetch('http://127.0.0.1:8000/valuestream/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
            user_input: newMessage.text,
          }),
        });

        if (!response.body) throw new Error('No response body');

        const botMessage = {
          id: newMessage.id + 1,
          text: '',
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: true, // Track loading state for this message
        };
        setMessages(prev => [...prev, botMessage]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let done = false;
        let botReply = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            botReply += chunk;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessage.id
                  ? { ...msg, text: botReply, isLoading: false } // Hide loader when response starts
                  : msg
              )
            );
            scrollToBottom(); // Ensure scroll after each chunk
          }
          done = readerDone;
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => [...prev, {
          id: newMessage.id + 1,
          text: 'Sorry, there was an error processing your request. Please try again.',
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      } finally {
        setIsLoading(false);
        // Ensure loading state is cleared for the bot message
        setMessages(prev =>
          prev.map(msg =>
            msg.sender === 'bot' && msg.isLoading
              ? { ...msg, isLoading: false }
              : msg
          )
        );
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttach = () => {
    alert('Attach file functionality to be implemented');
  };

  // Custom link component for ReactMarkdown to handle file downloads
  const handleLinkClick = async (href, e) => {
    // Check if the link is a file download (e.g., ends with .csv)
    if (href.endsWith('.csv')) {
      e.preventDefault();
      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error('Failed to fetch file');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = href.split('/').pop() || 'file.csv'; // Extract filename or use default
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download the file. Please try again.');
      }
    }
    // Allow default behavior for other links
  };

  return (
    <div className="main-container">
      <div className="content-container">
        <div className="navbar">
          <div className="navbar-logo">
            <a href="https://genaiprotos.com" target="_blank" rel="noopener noreferrer">
              <img src={icon} alt="icon" className="icon-image" />
            </a>
          </div>
          <div className='logo-div'>
            <a href="https://genaiprotos.com" target="_blank" rel="noopener noreferrer">
              <img src={genai_logo} alt="Genaiprotos Logo" className="logo-image" />
            </a>
          </div>
        </div>

        <div className="chat-container">
          {messages.length === 0 && (
            <div className="empty-chat-message">
              <p>Start a conversation by typing a message below</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}
            >
              <div className="message-content">
                <div className="markdown-wrapper">
                  {message.sender === 'bot' && message.isLoading ? (
                    <div className="loading-container">
                      <PulseLoader color="#007bff" size={8} />
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            onClick={(e) => handleLinkClick(href, e)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  )}
                </div>
                <span className="message-time">{message.time}</span>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button className="attach-button" onClick={handleAttach} disabled={isLoading}>
            <FiPaperclip size={20} />
          </button>
          <button
            className={`send-button ${inputText.trim() ? 'active' : ''}`}
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
          >
            <IoSendSharp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;