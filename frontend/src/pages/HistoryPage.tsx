import { useEffect } from "react";
import LSidebar from "../components/LSidebar";
import RSidebar from "../components/RSidebar";
import { useNavigate } from "react-router-dom";
import { useActiveWalletConnectionStatus } from "thirdweb/react";
import Table from "../components/Table";
import { toast } from "react-toastify";
import { useContract } from "../providers/thirdwebHook";

const HistoryPage = () => {
  const {getUserOrder, orderData, pendingWithdrawals, getPendingWithdrawals} = useContract()
  const connectionStatus = useActiveWalletConnectionStatus();
  

  const navigate = useNavigate();

  useEffect(() => {
    if (connectionStatus === "disconnected") {
      console.log("wallet disconnected");
      navigate("/");
    } else {
      const fetchAndSetOrders = async () => {
        try {
          await getUserOrder();
        } catch (error: any) {
          toast.error(`Failed to fetch user orders: ${error.message}`);
        }
      };

      fetchAndSetOrders();
      getPendingWithdrawals()
    }
  }, [connectionStatus]);

  const pendingWithdrawalColums = [
    {key: "user", header: "User"},
    {key: "amount", header: "Amount"},
    {key: "isETH", header: "Chain"},
    {key: "isPending", header: "Status"},
    {key: "pendingAt", header: "Time"},
    
  ];
  

  const historyColumns = [
    { key: "buyToken", header: "Buy Token" },
    { key: "sellToken", header: "Sell Token" },
    { key: "amount", header: "Amount" },
    { key: "selectedMarket", header: "Market" },
    { key: "status", header: "Status" },
    { key: "fulfilledAmount", header: "Fulfilled Amount" },

  ];
  const processedPendingWithdrawals = pendingWithdrawals.map(withdrawal => ({
    ...withdrawal,
    isETH: withdrawal.isETH ? 'Eth' : 'Usdc',
    isPending: withdrawal.isPending ? 'Pending' : 'Not Pending',
    pendingAt: new Date(Number(withdrawal.pendingAt)).toLocaleString(),
  }));
  
  // ...
  
  <Table data={processedPendingWithdrawals} columns={pendingWithdrawalColums} />

  return (
    <div className="ml-[6%] mr-[30%] p-4">
      <LSidebar />
      <div className="flex flex-col gap-3">
        <Table data={orderData} columns={historyColumns} />
        <Table data={processedPendingWithdrawals} columns={pendingWithdrawalColums} />

      </div>
      <RSidebar />
    </div>
  );
};

export default HistoryPage;

