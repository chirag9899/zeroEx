import React from "react";

interface OrderSummaryProps {
  formData: {
    selectedMarket: string;
    status: string;
    createdAt: string;
    amount: string;
    buy: string;
    sell: string;
  };
  setData: React.Dispatch<
    React.SetStateAction<{
      selectedMarket: string;
      status: string;
      createdAt: string;
      amount: string;
      buy: string;
      sell: string;
    }>
  >;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ formData }) => {
  const handleCreateOrder = () => {
    // Retrieve existing orders from localStorage
    const existingOrders = JSON.parse(localStorage.getItem("orderData") || "[]");
    
    // Append the new order to the existing orders
    const updatedOrders = [...existingOrders, formData];

    // Save the updated orders back to localStorage
    localStorage.setItem("orderData", JSON.stringify(updatedOrders));
    console.log("Order saved to localStorage", formData);
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex justify-between mb-2 space-x-20">
          <span className="text-gray-700">Rate</span>
          <span>1 USDT = 0.0130 LTC</span>
        </div>
        <div className="flex justify-between mb-2 space-x-20">
          <span className="text-gray-700">Estimate Amount</span>
          <span>132312312 USDC</span>
        </div>
        <hr className="my-4" />
        <div className="flex justify-between mb-4 space-x-20">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">$5,254</span>
        </div>
      </div>
      <button
        className="w-full py-3 text-white bg-black rounded-full hover:bg-gray-900 transition duration-300"
        onClick={handleCreateOrder}
      >
        Create Order
      </button>
    </div>
  );
};

export default OrderSummary;
