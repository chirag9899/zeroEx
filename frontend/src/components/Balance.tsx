import React, { useState } from "react";
import Modal from "./Modal"; // Import the modal component
import { ArrowDownLeft, Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { depositFunds } from "../utils/helper";
import { ClipLoader } from "react-spinners"; // Import the loader

const Balance: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingAddBalance, setLoadingAddBalance] = useState(false);
  const [modalData, setModalData] = useState({
    amount: 0,
    title: "",
    onSubmit: () => {},
  });

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalData((prevData) => ({
      ...prevData,
      amount: Number(event.target.value),
    }));
  };

  const handleOnClick = (method: string) => {
    if (method === "withdraw") {
      setModalData({
        ...modalData,
        title: "Withdraw",
        onSubmit: handleSubmitOnWithdraw,
      });
    } else if (method === "addBalance") {
      setModalData({
        ...modalData,
        title: "Add Balance",
        onSubmit: handleSubmitOnAddBalance,
      });
    }
    setModalOpen(true);
  };

  const handleSubmitOnWithdraw = async () => {
    setLoadingWithdraw(true);
    setModalOpen(false);
    try {
      await depositFunds(modalData.amount);
      toast.success("Withdrawal Successful");
    } catch (error) {
      toast.error("Withdrawal Failed");
    } finally {
      setLoadingWithdraw(false);
      setModalData({
        amount: 0,
        title: "",
        onSubmit: () => {},
      });
    }
  };

  const handleSubmitOnAddBalance = async () => {
    setLoadingAddBalance(true);
    setModalOpen(false);
    try {
      await depositFunds(modalData.amount);
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

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-l-sidebar p-4">
      <div className="text-center mb-5">
        <h1 className="text-l font-bold pb-2">My Wallet</h1>
        <div className="flex space-x-10">
          <div className="">
              ETH balance
              <p className="text-4xl font-bold">$99.123</p>
          </div>
          <div className="">
              USDC balance
              <p className="text-4xl font-bold">$142.213</p>
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 relative"
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
          className="w-20 h-20 bg-stealth-yellow text-black rounded-full flex items-center justify-center hover:bg-stealth-yellow relative"
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
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default Balance;
