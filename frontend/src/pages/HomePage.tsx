import { useEffect } from "react";
import Balance from "../components/Balance";
import LSidebar from "../components/LSidebar";
import Market from "../components/Market";
import RSidebar from "../components/RSidebar";
import Watchlist from "../components/Watchlist";
import { useContract } from "../providers/thirdwebHook";

const HomePage = () => {
  const {
    userBalance,
    getBalance,
    fetchData,
    currentPrice
  }: any = useContract();

  useEffect(() => {
    const fetchPrice = async () => {
      const priceData = localStorage.getItem('price');
      const now = Date.now();
  
      if (priceData) {
        const { timestamp } = JSON.parse(priceData);
  
        // If less than 5 hours have passed since the last fetch, don't fetch again
        if (now - timestamp < 5 * 60 * 60 * 1000) {
          return;
        }
      }
  
      // Fetch the data and save it to local storage
      await fetchData();
    };
  
    // Fetch the balance and price data when the component mounts
    getBalance();
    fetchPrice();
  }, []);
  
  return (
    <div className="ml-[6%] mr-[30%] p-4 ">
      <LSidebar />
      <div className="grid grid-cols-2 gap-4">
        <Balance userBalance={userBalance} price={currentPrice} />
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
