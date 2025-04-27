import React from 'react';
import './Navbar.css';
import { FaUserCircle } from 'react-icons/fa'; // User icon from react-icons
import { genai_logo, icon } from "../../assets/asstes";


const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="https://genaiprotos.com" target="_blank" rel="noopener noreferrer">
          <img src={icon} alt="icon" className="icon-image"  />
        </a>
      </div>
      <div className='logo-div'>
        <a href="https://genaiprotos.com" target="_blank" rel="noopener noreferrer">
          <img src={genai_logo} alt="Genaiprotos Logo" className="logo-image" />
        </a>
      </div>
      <div className="navbar-icons">
        <FaUserCircle className="icon" />
      </div>
    </nav>
  );
};

export default Navbar;
