import React, { useEffect } from 'react';

interface OrderProps {
  formData: {
    user_address: string;
    selectedMarket: string;
    status: number;
    createdAt: string;
    amount: string;
    buyToken: string;
    sellToken: string;
    chain: string
  };
  setData: React.Dispatch<
    React.SetStateAction<{
      user_address: string;
      selectedMarket: string;
      status: number;
      createdAt: string;
      amount: string;
      buyToken: string;
      sellToken: string;
      chain: string

    }>
  >;
}

const Sell: React.FC<OrderProps> = ({ formData, setData }) => {
  const { amount, buyToken, selectedMarket } = formData;
  const inputValue = amount;

  const [outputAmount, setOutputAmount] = React.useState(0);

  // Static exchange rates for demonstration
  const exchangeRates: { [key: string]: number } = {
    'ETH/USDC': 20,  // Example: 1 ETH = 20 USDC
    'USDC/ETH': 0.05  // Example: 1 USDC = 0.05 ETH
  };

  useEffect(() => {
    const inputAmount = parseFloat(inputValue) || 0;
    const rateKey = `${formData.sellToken}/${buyToken}`;
    const rate = exchangeRates[rateKey] || 1;
    setOutputAmount(inputAmount * rate);
  }, [inputValue, buyToken, formData.sellToken]);

  useEffect(() => {
    const [base, quote] = selectedMarket.split('/');
    setData((prevData) => ({
      ...prevData,
      buy: base,
      sell: quote,
    }));
  }, [selectedMarket, setData]);

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = event.target.value;
    const otherCurrency = currency === formData.buyToken ? formData.sellToken : formData.buyToken;
    setData((prevData) => ({
      ...prevData,
      buyToken: otherCurrency,
      sellToken: currency,
    }));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Validate that the input is numeric
    if (/^\d*\.?\d*$/.test(value)) {
      setData((prevData) => ({
        ...prevData,
        amount: value,
      }));
    }
  };

  const receiveCurrency = formData.buyToken;

  return (
    <div className="w-full max-w-sm p-6 bg-stealth-gradient rounded-xl border border-stealth-yellow text-left relative font-roboto text-black">
      <div className="absolute top-0 right-0 mt-4 mr-4">
        <select 
          value={formData.sellToken}
          onChange={handleCurrencyChange}
          className="bg-transparent border-none outline-none text-black"
        >
          <option value={formData.buyToken} >{formData.buyToken}</option>
          <option value={formData.sellToken} >{formData.sellToken}</option>
        </select>
      </div>
      <div className="mb-4">
        <h2 className="text-sm font-semibold mb-1">You send</h2>
        <div className="flex items-center overflow-hidden">
          <input 
            type="text" 
            className="text-3xl pt-2 font-medium bg-transparent border-none outline-none overflow-hidden text-ellipsis whitespace-nowrap max-w-full placeholder-gray-700 text-black"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter amount"
            style={{ width: `${inputValue.length || 15}ch` }}
          />
        </div>
      </div>
   
      <div className="mt-4 mb-6 border-t border-dashed border-black"></div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold mb-1">You receive</h2>
          <div className="text-right">
            <p className="text-lg font-semibold">{`${outputAmount.toFixed(2)} ${receiveCurrency}`}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm">Price in $</p>
          <p className="text-lg font-semibold">$2,356.11</p>
        </div>
      </div>
    </div>
  );
};

export default Sell;
