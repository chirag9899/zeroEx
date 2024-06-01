import React, { useState } from "react";
import { PropagateLoader } from "react-spinners";
import { toast } from "react-toastify";
import { useContract } from "../providers/thirdwebHook";
import { useActiveAccount } from "thirdweb/react";

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
}

const OrderSummary: React.FC<OrderProps> = ({ formData }) => {
  const account = useActiveAccount();
  const { pubkey }: any = useContract();
  const [loadingCreateOrder, setLoadingCreateOrder] = useState(false);

  const handleCreateOrder = () => {
    setLoadingCreateOrder(true);
    let unixTimestamp = Math.floor(Date.now() / 1000);

    const chainTokenAddresses: { [key: string]: { [key: string]: string } } = {
      arb: {
        USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      },
      avax: {
        USDC: "0xasdasdeafb1BDbe2F0316DF893fd58CE46AA4d",
        ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      },
    };

    console.log({
      user_address: account?.address,
      selectedMarket: formData.selectedMarket,
      status: formData.status,
      createdAt: unixTimestamp,
      encrypted_order_value: pubkey.encrypt(BigInt(formData.amount)).toString(),
      buyToken: chainTokenAddresses[formData.chain][formData.buyToken],
      sellToken: chainTokenAddresses[formData.chain][formData.sellToken],
      trader_address: "",
      chain: formData.chain,
    });

    try {
      fetch("http://127.0.0.1:5000/add_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: account?.address,
          selectedMarket: formData.selectedMarket,
          status: formData.status,
          createdAt: unixTimestamp,
          encrypted_order_value: pubkey
            .encrypt(BigInt(formData.amount))
            .toString(),
          buyToken: chainTokenAddresses[formData.chain][formData.buyToken],
          sellToken: chainTokenAddresses[formData.chain][formData.sellToken],
          trader_address: "",
          chain: formData.chain,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          setLoadingCreateOrder(false);
        });

      // const existingOrders = JSON.parse(
      //   localStorage.getItem("orderData") || "[]"
      // );

      // // Append the new order to the existing orders
      // const updatedOrders = [...existingOrders, formData];

      // // Save the updated orders back to localStorage
      // localStorage.setItem("orderData", JSON.stringify(updatedOrders));
      // console.log("Order saved to localStorage", formData);
      // toast.success("order created successfully");
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingCreateOrder(false);
    }
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
        <div className="mt-4 mb-6 border-t border-dashed border-black"></div>
        <div className="flex justify-between mb-4 space-x-20">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">$5,254</span>
        </div>
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
          <span className="font-semibold  ">Confirm</span>
        )}
      </button>
    </div>
  );
};

export default OrderSummary;
