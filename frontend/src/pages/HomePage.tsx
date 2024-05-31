import Balance from "../components/Balance";
import LSidebar from "../components/LSidebar";
import Market from "../components/Market";
import RSidebar from "../components/RSidebar";
import Watchlist from "../components/Watchlist";
import { useContract } from "../providers/thirdwebHook";


const HomePage = () => {


  const {deposit, userBalance, getBalance, withdraw}: any =  useContract()
  
  const data  = async() => {
    const bal =  await getBalance()
    console.log(bal)
  }

  return (
    <div className="ml-[6%] mr-[30%] p-4 ">
      <div className="flex gap-10">
      <button onClick={data}>balance</button>
      <button onClick={async() => await deposit(false, 1000)}>deposit</button>
      <button onClick={async() => await withdraw(false, 1000)}>withdraw</button>

      </div>
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
