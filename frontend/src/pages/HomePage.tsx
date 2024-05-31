import Balance from "../components/Balance";
import LSidebar from "../components/LSidebar";
import Market from "../components/Market";
import RSidebar from "../components/RSidebar";
import Watchlist from "../components/Watchlist";
import { useContract } from "../providers/thirdwebHook";


const HomePage = () => {


  const {contractInstance, someFunction} =  useContract()
  

  return (
    <div className="ml-[6%] mr-[30%] p-4 ">
      <button onClick={someFunction}> read contract</button>
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
