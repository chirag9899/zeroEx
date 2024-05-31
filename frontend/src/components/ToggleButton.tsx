import React from 'react';

const ToggleButton: React.FC = () => {
  

  return (
    <div className="relative flex items-center w-full p-2 bg-white rounded-lg border border-gray-200 shadow-md">
      <div
        className={`absolute left-0 top-0 w-full h-full bg-stealth-yellow rounded-lg transition-transform duration-300 transform translate-x-0`}
        style={{ margin: '3px', height: 'calc(100% - 6px)', width: 'calc(100% - 6px)' }} // Adjusting margin, height, and width for padding
      ></div>
      <div
        className={`w-full flex item-center justify-center py-2 px-4 rounded-lg z-10 focus:outline-none transition-colors duration-300 font-semibold text-black `}
      >
        Create Order
      </div>
    </div>
  );
};

export default ToggleButton;
