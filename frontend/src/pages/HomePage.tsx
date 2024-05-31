import { getBalance } from "thirdweb/extensions/erc20";
import Balance from "../components/Balance";
import LSidebar from "../components/LSidebar";
import Market from "../components/Market";
import RSidebar from "../components/RSidebar";
import Watchlist from "../components/Watchlist";
import { useContract } from "../providers/thirdwebHook";


const HomePage = () => {


<<<<<<< HEAD
  const {contractInstance, getBalance} =  useContract()
=======
  const {contractInstance, userBalance} =  useContract()
>>>>>>> refs/remotes/origin/zerox
  
  console.log(userBalance)

  return (
    <div className="ml-[6%] mr-[30%] p-4 ">
<<<<<<< HEAD
      <button onClick={getBalance}> read contract</button>
=======
>>>>>>> refs/remotes/origin/zerox
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
