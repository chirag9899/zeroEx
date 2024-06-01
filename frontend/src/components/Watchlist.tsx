// src/components/Watchlist.tsx

import React from 'react';
import Card from './WatchlistCard';

const Watchlist: React.FC = () => {
  const cards = [
    { name: 'Bitcoin', symbol: 'BTC', price: '5,230.12', change: 2.31, graphColor: '#16A34A' },
    { name: 'Litecoin', symbol: 'LTC', price: '5,131.00', change: -1.12, graphColor: '#ef4444' },
    // { name: 'Solana', symbol: 'SOL', price: '3,531.23', change: 1.32, graphColor: '#16A34A' },
    { name: 'Tether', symbol: 'USDT', price: '2,356.11', change: 0.01, graphColor: '#16A34A' },
  ];

  return (
    <div className="relative w-full mx-auto p-2 rounded-lg bg-l-sidebar">
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-30 backdrop-blur-sm rounded-lg text-white text-2xl font-bold z-10">
        <div className="font-roboto text-black">
          Coming Soon
        </div>
      </div>
      <div className="relative z-0 ">
        <div>
          <h2 className="text-xl font-semibold font-roboto">Watchlist ......</h2>
        </div>
        <div className="h-full">
          {cards.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
