// src/components/ToggleButton.tsx

import React, { useState } from 'react';

const ToggleButton: React.FC = () => {
  
  const [active, setActive] = useState<'sale' | 'purchase'>('sale');

  return (
    <div className="relative flex items-center w-full p-2 bg-white rounded-full border border-gray-200">
      <div
        className={`absolute left-0 top-0 w-1/2 h-full bg-stealth-yellow rounded-full transition-transform duration-300 ${
          active === 'sale' ? 'transform translate-x-0' : 'transform translate-x-[97.5%]'
        }`}
        style={{ margin: '3px', height: 'calc(100% - 6px)' }} // Adjusting margin and height for padding
      ></div>
      <button
        className={`flex-1 py-2 px-4 rounded-full z-10 focus:outline-none transition-colors duration-300 ${
          active === 'sale' ? 'text-black font-bold' : 'text-gray-700'
        }`}
        onClick={() => setActive('sale')}
      >
        Sale Order
      </button>
      <button
        className={`flex-1 py-2 px-4 rounded-full z-10 focus:outline-none transition-colors duration-300 ${
          active === 'purchase' ? 'text-black font-bold' : 'text-gray-700'
        }`}
        onClick={() => setActive('purchase')}
      >
        Purchase Order
      </button>
    </div>
  );
};

export default ToggleButton;
