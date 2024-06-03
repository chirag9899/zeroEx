import React, { useState } from "react";
import { PropagateLoader } from "react-spinners";
import { toast } from "react-toastify";
import { useContract } from "../providers/thirdwebHook";
import { useActiveAccount } from "thirdweb/react";
import { ethers, utils } from "ethers";

interface OrderProps {
  formData: {
    user_address: string;
    selectedMarket: string;
    status: number;
    createdAt: string;
    amount: string;
    buyToken: string;
    sellToken: string;
    chain: string;
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
      chain: string;
    }>
  >;
  price: number; 

}


const OrderSummary: React.FC<OrderProps> = ({ formData , price }) => {
  const { chainTokenAddresses } = useContract();
  const account = useActiveAccount();
  const { pubkey }: any = useContract();
  const [ render, setRender ] = useState(false);
  const [loadingCreateOrder, setLoadingCreateOrder] = useState(false);
  const validateForm = () => {
    const { user_address, selectedMarket, status, amount, buyToken, sellToken, chain } = formData;
    return user_address && selectedMarket && status !== undefined && Number(amount) > 0 && buyToken && sellToken && chain;
  };
  const serverUrl = "http://127.0.0.1:5000/"

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all fields before confirming.");
      return;
    }
   
    try {
      setLoadingCreateOrder(true);
      let unixTimestamp = Math.floor(Date.now() / 1000);
      const isEth = formData.sellToken === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      const amount = ethers.utils.parseUnits(formData.amount,  isEth ? 18 : 6).toBigInt();
  
  
      const orderData = {
        user_address: account?.address,
        selectedMarket: formData.selectedMarket,
        status: formData.status,
        createdAt: unixTimestamp,
        encrypted_order_value: pubkey.encrypt(amount).toString(),
        buyToken: chainTokenAddresses[formData.chain][formData.buyToken],
        sellToken: chainTokenAddresses[formData.chain][formData.sellToken],
        trader_address: "0x0000000000000000000000000000000000000000",
        chain: formData.chain,
      };
      const orderHash =  ethers.utils.keccak256(utils.toUtf8Bytes(JSON.stringify(orderData)))
  
      const signed = await account?.signMessage({message: orderHash})
      console.log(signed)
      const response = await fetch(`${serverUrl}/add_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
         await response.json();
        const existingOrders = JSON.parse(
          localStorage.getItem("orderData") || "[]"
        );

        const updatedOrders = [...existingOrders, orderData];
        const ordersForLocalStorage = updatedOrders.map(order => ({
          ...order,
          buyToken: formData.buyToken,
          sellToken: formData.sellToken,
          amount: formData.amount,
        }));
  
        localStorage.setItem("orderData", JSON.stringify(ordersForLocalStorage));

        toast.success("Order created successfully");
        setRender(!render)
      } else {
        const errorData = await response.json();
        console.error("Error creating order:", errorData);
        toast.error("Failed to create order");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while creating the order");
    } finally {
      setLoadingCreateOrder(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex justify-between mb-2 space-x-20">
          <span className="text-gray-700">Rate</span>
          <span>1 eth = {(price* 1e18).toFixed(6)}</span>
        </div>
        {/* <p className="text-xs text-gray-600">Enter ETH  (1 ETH = 10^18 Wei)</p>
        <p className="text-xs text-gray-600">Enter USDC (1 USD = 10^6)</p>
        <a className="text-xs text-blue-700 border-b border-black " target="_blank" rel="noopener noreferrer" href="https://eth-converter.com/">use eth converter</a> */}


        <div className="mt-4 mb-6 border-t border-dashed border-black"></div>
      </div>
      <button
        className="w-full py-3 text-white bg-black rounded-full hover:bg-gray-900 transition duration-300"
        onClick={handleCreateOrder}
      >
        {loadingCreateOrder ? (
          <div className="py-3 mb-2">
            <PropagateLoader size={10} color={"#fff"} />
          </div>
        ) : (
          <span className="font-semibold">Confirm</span>
        )}
      </button>
    </div>
  );
};

export default OrderSummary;
