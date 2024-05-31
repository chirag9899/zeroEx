import "./App.css";
import HomePage from "./pages/HomePage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import HistoryPage from "./pages/HistoryPage";
import { useActiveWalletConnectionStatus } from "thirdweb/react";
import ThreeBody from "./components/ThreeBody";

function App() {
  const connectionStatus = useActiveWalletConnectionStatus();

  
  return (
    <div className="bg-page min-h-full">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              connectionStatus == "connecting" ? <ThreeBody /> : <Login />
            }
          />
          <Route
            path="/home"
            element={
              connectionStatus == "connected" ? (
                <HomePage />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Router>
    </div >
  );
}

export default App;
