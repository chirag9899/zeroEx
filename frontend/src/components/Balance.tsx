import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';

const Balance: React.FC = () => {
  return (
    <div className="w-full rounded-xl text-center jusify-center">
      <div className='flex flex-col items-center justify-center'>
      <h2 className="text-md font-semibold mt-16 mb-4">My Wallet</h2>
      <p className="text-5xl font-bold mb-8">$128,921</p>
      <div className="flex justify-center space-x-4">
        <button className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center">
          <ArrowUpRight className="w-8 h-8" />
        </button>
        <button className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center">
          <ArrowDownLeft className="w-8 h-8" />
        </button>
        <button className="w-20 h-20 bg-stealth-yellow text-black rounded-full flex items-center justify-center">
          <Plus className="w-8 h-8" />
        </button>
      </div>
      </div>
    </div>
  );
};

export default Balance;
