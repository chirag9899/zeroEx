import { useActiveWalletConnectionStatus } from "thirdweb/react";
import Balance from "../components/Balance";
import LSidebar from "../components/LSidebar";
import Market from "../components/Market";
import RSidebar from "../components/RSidebar";
import Watchlist from "../components/Watchlist";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const connectionStatus = useActiveWalletConnectionStatus();

  const navigate = useNavigate();

  return (
    <div className="ml-[6%] mr-[30%] p-4 bg-page">
      <LSidebar />
      <div className="grid grid-cols-2 gap-4">
        <Balance />
        <Watchlist />
        <div className="col-span-2">
          <Market />
        </div>
      </div>
      <RSidebar />
    </div>
  );
};

export default HomePage;
