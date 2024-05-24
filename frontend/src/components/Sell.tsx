import React, { useState } from 'react';

const Sell: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('bitcoin');
  const currencies = {
    bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
    ccip: { name: 'CCIP', symbol: 'CCIP' },
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(event.target.value);
  };

  const { name, symbol } = currencies[selectedCurrency];

  return (
    <div className="w-full max-w-sm p-6 bg-stealth-gradient rounded-xl shadow-lg text-left relative">
      <div className="absolute top-0 right-0 mt-4 mr-4">
        <select 
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          className="bg-transparent"
        >
          <option value="bitcoin">Bitcoin</option>
          <option value="ccip">CCIP</option>
        </select>
      </div>
      <h2 className="text-sm font-semibold mb-2">You send</h2>
      <input type="text" className="text-6xl font-bold bg-transparent border-none outline-none" defaultValue="0.00" />
      <div className="text-right">
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm text-black">{symbol}</p>
      </div>
      <div className="mt-2 mb-6 border-t border-dashed border-black"></div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-black">Price in $</p>
        <p className="text-lg font-semibold">$2,356.11</p>
      </div>
    </div>
  );
};

export default Sell;
