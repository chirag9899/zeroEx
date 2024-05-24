import './App.css'
import HomePage from './pages/HomePage'
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import HistoryPage from './pages/HistoryPage';
import { useActiveWalletConnectionStatus } from 'thirdweb/react';
import ThreeBody from './components/ThreeBody';
import { useEffect } from 'react';



function App() {


  const connectionStatus = useActiveWalletConnectionStatus();



  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={connectionStatus == "connecting" ? <ThreeBody /> : <Login />} />
          <Route path='/home' element={connectionStatus == "connected" ? <HomePage /> : <Navigate to="/" />} />
          <Route path='/history' element={<HistoryPage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
