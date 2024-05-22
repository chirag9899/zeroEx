
import './App.css'
import LSidebar from './components/LSidebar';
import RSidebar from './components/RSidebar';
import HomePage from './pages/HomePage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';


function App() {

  return (
    <>
      <Router>
        <LSidebar/>
        <RSidebar/>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path='/home' element={<HomePage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
