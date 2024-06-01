import  { useEffect, useState } from "react";
import LSidebar from "../components/LSidebar";
import RSidebar from "../components/RSidebar";
import { useNavigate } from "react-router-dom";
import { useActiveWalletConnectionStatus } from "thirdweb/react";
import Table from "../components/Table";

const HistoryPage = () => {
  const connectionStatus = useActiveWalletConnectionStatus();
  const [orderData] = useState(JSON.parse(localStorage.getItem("orderData") || "[]"));



  const navigate = useNavigate();

  useEffect(() => {
    if (connectionStatus == "disconnected") {
      console.log("wallet disconnected");
      navigate("/");
    }
  }, [connectionStatus]);


  const historyColumns = [
    { key: "sell", header: "Purchase Token" },
    { key: "amount", header: "Amount" },
    { key: "selectedMarket", header: "Market" },
    { key: "createdAt", header: "Time" },
    { key: "status", header: "Status" },
    { key: "fulfilledAmount", header: "Remaining Amount" },
  ];
  
  const pendingWithdrawalColums = [
    {key: "user", header: "User"},
    {key: "amount", header: "Amount"},
    {key: "isETH", header: "Chain"},
    {key: "isPending", header: "Status"},
    {key: "pendingAt", header: "Time"},
  ];

  return (
    <div className="ml-[6%] mr-[30%] p-4  ">
      <LSidebar />
      <div className="flex flex-col gap-3">
        <Table data={orderData} columns={historyColumns} />
        <Table data={orderData} columns={pendingWithdrawalColums} />
      </div>
      <RSidebar />
    </div>
  );
};

export default HistoryPage;



