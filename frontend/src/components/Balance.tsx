import React, { useState } from "react";
import Modal from "./Modal"; // Import the modal component
import { ArrowDownLeft, Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners"; // Import the loader
import { useContract } from "../providers/thirdwebHook";

interface BalanceProps {
  userBalance: {
    ETH: number;
    USDC: number;
  };
}

const Balance: React.FC<BalanceProps> = ({ userBalance }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingAddBalance, setLoadingAddBalance] = useState(false);
  const [isEth, setIsEth] = useState(true); // State to track if the selected token is ETH
  const [modalData, setModalData] = useState({
    amount: 0,
    title: "",
    onSubmit: (_: number) => {},
  });

  const { deposit, getBalance, withdraw, getUserOrder }: any = useContract();

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("updatting", event.target.value);
    setModalData((prevData) => ({
      ...prevData,
      amount: Number(event.target.value),
    }));
  };
  console.log(modalData);

  const handleOnClick = (method: string) => {
    console.log("withdraw", modalData);
    if (method === "withdraw") {
      setModalData({
        ...modalData,
        title: "Withdraw",
        onSubmit: handleSubmitOnWithdraw,
      });
    } else if (method === "addBalance") {
      console.log("add balance", modalData);
      setModalData({
        ...modalData,
        title: "Add Balance",
        onSubmit: handleSubmitOnAddBalance,
      });
    }
    setModalOpen(true);
  };

  const handleSubmitOnWithdraw = async (val: number) => {
    setLoadingWithdraw(true);
    setModalOpen(false);
    console.log(isEth, modalData.amount);
    try {
      await withdraw(isEth, val);
      toast.success("Withdrawal Successful");
    } catch (error) {
      toast.error("Withdrawal Failed");
    } finally {
      setLoadingWithdraw(false);
      setModalData({
        amount: 0,
        title: "",
        onSubmit: (val: number) => {},
      });
    }
  };

  const handleSubmitOnAddBalance = async (val: number) => {
    setLoadingAddBalance(true);
    setModalOpen(false);
    console.log(val);

    console.log(isEth, modalData.amount);

    try {
      await deposit(isEth, val);
      toast.success("Balance Added Successfully");
    } catch (error) {
      toast.error("Adding Balance Failed");
    } finally {
      setLoadingAddBalance(false);
      setModalData({
        amount: 0,
        title: "",
        onSubmit: () => {},
      });
    }
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setIsEth(event.target.value === "ETH");
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4">
      <div className="text-center mb-5">
        <h1 className="text-l font-bold pb-2">My Wallet</h1>
        <div className="flex space-x-10">
          <div>
            ETH balance
            <p className="text-4xl font-bold">${userBalance.ETH}</p>
          </div>
          <div>
            USDC balance
            <p className="text-4xl font-bold">${userBalance.USDC}</p>
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 "
          onClick={() => handleOnClick("withdraw")}
          disabled={loadingWithdraw}
        >
          {loadingWithdraw ? (
            <ClipLoader size={30} color={"#fff"} />
          ) : (
            <ArrowDownLeft className="w-10 h-10" />
          )}
        </button>
        <button
          className="w-20 h-20 bg-stealth-yellow text-black rounded-full flex items-center justify-center hover:bg-stealth-yellow-dark "
          onClick={() => handleOnClick("addBalance")}
          disabled={loadingAddBalance}
        >
          {loadingAddBalance ? (
            <ClipLoader size={30} color={"#000"} />
          ) : (
            <Plus className="w-10 h-10" />
          )}
        </button>
      </div>

      {isModalOpen && (
        <Modal
          modalData={modalData}
          onAmountChange={handleAmountChange}
          onClose={() => setModalOpen(false)}
          onTokenChange={handleTokenChange} // Pass the token change handler
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default Balance;
