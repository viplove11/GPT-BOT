import React, { useState } from 'react';
import './ChatInterface.css';
import { IoMdSend } from "react-icons/io";
import { IoAddCircleOutline } from "react-icons/io5";
import { CgAttachment } from "react-icons/cg";

const ChatInterface = () => {
  const [isContentVisible, setContentVisible] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState(''); // State to track input value

  const handleSendMessage = () => {
    if (inputValue.trim()) { // Check if input is not empty
      setContentVisible(false);
      const newMessage = inputValue; // Get user input
      const responseMessage = "This is a response"; // Simulated response
    setMessages([...messages, { text: newMessage, type: 'user' }, { text: responseMessage, type: 'response' }]);
      setInputValue(''); // Clear input field after sending
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value); // Update input value state
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>{msg.text}</div>
        ))}
        
        {isContentVisible && (
          <div className='content'>
            <div className="icon">📦</div>
            <p style={{fontSize:"22px", fontWeight:"bold"}}>Finding Required Information Types of Value Stream</p>
            <p className="author">By Daniel Lambert, M.Sc.</p>
            <p className="description">
              This agent generates required information concepts of a value stream.
              More precisely, it provides the name and the description of each information 
              concepts required in a value stream.
            </p>
          </div>
        )}
      </div>
      <div className="chat-input">
        <div className="input-container">
          <input 
            type="text" 
            placeholder="Ask anything" 
            value={inputValue} // Bind input value to state
            onChange={handleInputChange} // Update state on input change
            />
            
          <div className='input-buttons'>
          <button><CgAttachment style={{fontSize:"24px"}}/></button>
          <button onClick={handleSendMessage}>
            <IoMdSend style={{fontSize:"22px"}}/>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
