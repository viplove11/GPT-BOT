import React from 'react'
import "./App.css"
// import ChatInterface from './Components/ChatInterface/ChatInterface'

import Sidebar from './Components/Sidebar/Sidebar'
import MainContainer from './Components/MainContainer/MainContainer'


const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
     <Sidebar/>
      <MainContainer/>
      
      {/* <ChatInterface/> */}
     
    </div>
  )
}

export default App
