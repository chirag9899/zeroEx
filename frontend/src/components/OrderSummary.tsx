// src/components/OrderSummary.tsx

import React from 'react';

const OrderSummary: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex justify-between mb-2 space-x-20">
          <span className="text-gray-500">Rate</span>
          <span>1 USDT = 0.0130 LTC</span>
        </div>
        <div className="flex justify-between mb-2 space-x-20">
          <span className="text-gray-500">Estimate Amount</span>
          <span>132312312 USDC</span>
        </div>
        <hr className="my-4"/>
        <div className="flex justify-between mb-4 space-x-20">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">$5,254</span>
        </div>
      </div>
      <button className="w-full py-3 text-white bg-black rounded-full hover:bg-gray-900 transition duration-300">
        Create Order
      </button>
    </div>
  );
};

export default OrderSummary;
