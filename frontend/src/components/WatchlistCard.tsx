import React from 'react';

import bitcoin from '../assets/bitcoin-svgrepo-com.svg';
import litecoin from '../assets/litecoin-svgrepo-com.svg';
import solana from '../assets/solana-svgrepo-com.svg';
import tethered from '../assets/usdt-alt-svgrepo-com.svg'

interface CardProps {
  name: string;
  symbol: string;
  price: string;
  change: number;
  graphColor: string;
}

const WatchlistCard: React.FC<CardProps> = ({ name, symbol, price, change, graphColor }) => {
  const graphSvg = (
    <svg className="w-full h-auto" viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 40C10 30, 20 30, 30 40C40 50, 50 40, 60 30C70 20, 80 30, 90 25C100 20, 110 30, 120 25C130 20, 140 30, 150 20" stroke={graphColor} strokeWidth="2" fill="none" />
    </svg>
  );

  return (
    <div className="flex justify-evenly items-center p-2 bg-white rounded-xl w-full">
      <div className='flex space-x-2'>
        <div className="bg-stealth-gradient rounded-full w-12 h-12 flex items-center justify-center">
          {symbol === 'BTC' ? <img src={bitcoin} alt="" className='w-8 h-8'/> : null}
          {symbol === 'LTC' ? <img src={litecoin} alt="" className='w-8 h-8'/> : null}
          {symbol === 'SOL' ? <img src={solana} alt="" className='w-8 h-8'/> : null}
          {symbol === 'USDT' ? <img src={tethered} alt="" className='w-8 h-8'/> : null}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{name}</h2>
          <p className="text-gray-500">{symbol}</p>
        </div>  
      </div>
      <div className="flex-1 mx-2">
        {graphSvg}
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold">${price}</p>
        <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{change >= 0 ? `↑ ${change}%` : `↓ ${Math.abs(change)}%`}</p>
      </div>
    </div>
  );
};

export default WatchlistCard;
