import React, { useState } from "react";
import Modal from "./Modal"; // Import the modal component
import { ArrowDownLeft, Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { depositFunds } from "../utils/helper";

const Balance: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
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

  const handleSubmitOnWithdraw = () => {
    depositFunds(modalData.amount);
    setModalOpen(false);
    setModalData({
      amount: 0,
      title: "",
      onSubmit: () => {},
    });
    toast.success("Withdrawal Successful");
  };

  const handleSubmitOnAddBalance = () => {
    depositFunds(modalData.amount);
    setModalOpen(false);
    setModalData({
      amount: 0,
      title: "",
      onSubmit: () => {},
    });
    toast.success("Balance Added Successfully");
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-l-sidebar p-4">
      <div className="text-center mb-5">
        <h1 className="text-xl pb-2">My Wallet</h1>
        <p className="text-5xl font-bold">$128,921</p>
      </div>
      <div className="flex space-x-4">
        <button
          className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800"
          onClick={() => handleOnClick("withdraw")}
        >
          <ArrowDownLeft className="w-10 h-10" />
        </button>
        <button
          className="w-20 h-20 bg-stealth-yellow text-black rounded-full flex items-center justify-center hover:bg-stealth-yellow"
          onClick={() => handleOnClick("addBalance")}
        >
          <Plus className="w-10 h-10" />
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
