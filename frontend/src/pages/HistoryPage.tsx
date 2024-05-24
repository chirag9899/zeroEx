import React, { useEffect } from 'react'
import LSidebar from '../components/LSidebar'
import RSidebar from '../components/RSidebar'
import { useNavigate } from 'react-router-dom';
import { useActiveWalletConnectionStatus } from 'thirdweb/react';
import Table from '../components/Table';

const HistoryPage = () => {

  const connectionStatus = useActiveWalletConnectionStatus();
  console.log(connectionStatus);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log(connectionStatus);
    if (connectionStatus == "disconnected") {
      console.log("wallet disconnected");
      navigate("/");
    }
  }, [connectionStatus])

  const data = [
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
    { type: 'buy', vol: '1000', price: '$51,004', market: 'BTC / USD', time: '15:00', status: 'Completed' },
];

const columns = [
    { key: 'type', header: 'Order Type' },
    { key: 'vol', header: 'Volume' },
    { key: 'price', header: 'Price of Exchange' },
    { key: 'market', header: 'Market' },
    { key: 'time', header: 'Time' },
    { key: 'status', header: 'Status' },

];

  return (
    <div className='ml-[6%] mr-[30%] mt-32 p-4'>
      <LSidebar/>
      <Table
                    data={data}
                    columns={columns}
                />
      <RSidebar/>
    </div>
  )
}

export default HistoryPage
