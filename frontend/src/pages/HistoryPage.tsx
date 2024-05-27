import React, { useEffect, useState } from "react";
import LSidebar from "../components/LSidebar";
import RSidebar from "../components/RSidebar";
import { useNavigate } from "react-router-dom";
import { useActiveWalletConnectionStatus } from "thirdweb/react";
import Table from "../components/Table";
import Market from "../components/Market";

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


  const columns = [
    { key: "sell", header: "Purchase Token" },
    { key: "amount", header: "Amount" },
    { key: "selectedMarket", header: "Market" },
    { key: "createdAt", header: "Time" },
    { key: "status", header: "Status" },
  ];

  return (
    <div className="ml-[6%] mr-[30%] p-4 bg-page">
      <LSidebar />
      <div className="flex flex-col gap-3">
        <Table data={orderData} columns={columns} />
        <Market />
      </div>
      <RSidebar />
    </div>
  );
};

export default HistoryPage;


