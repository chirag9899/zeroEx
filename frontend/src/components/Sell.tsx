import React, { useState } from 'react';

const Sell: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('bitcoin');
  const [inputValue, setInputValue] = useState('');
  const currencies = {
    bitcoin: { name: 'Etherium', symbol: 'ETH' },
    ccip: { name: 'CCIP', symbol: 'CCIP' },
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(event.target.value);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Validate that the input is numeric
    if (/^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const { name, symbol } = currencies[selectedCurrency];

  return (
    <div className="w-full max-w-sm p-4 bg-stealth-gradient rounded-xl shadow-lg text-left relative font-roboto text-sky-200">
      <div className="absolute top-0 right-0 mt-4 mr-4">
        <select 
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          className="bg-transparent border-none outline-none"
        >
          <option value="bitcoin" className='bg-blue-500 text-white border-none'>ETH</option>
          <option value="ccip"className='bg-blue-500 text-white border-none'>CCIP</option>
        </select>
      </div>
      <h2 className="text-sm font-semibold mb-2">You send</h2>
      <div className="flex items-center overflow-hidden">
        <input 
          type="text" 
          className="text-3xl pt-2 font-medium bg-transparent border-none outline-none overflow-hidden text-ellipsis whitespace-nowrap max-w-full placeholder-sky-200"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter amount"
          style={{ width: `${inputValue.length || 15}ch` }}
        />
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm ">{symbol}</p>
      </div>
      <div className="mt-2 mb-6 border-t border-dashed border-black"></div>
      <div className="flex justify-between items-center">
        <p className="text-sm ">Price in $</p>
        <p className="text-lg font-semibold">$2,356.11</p>
      </div>
    </div>
  );
};

export default Sell;
