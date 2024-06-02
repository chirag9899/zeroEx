import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  modalData: {
    amount: number;
    title: string;
    onSubmit: (val: number) => void;
  };
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onTokenChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isEth: boolean; // Receive isEth as a prop
}

const Modal: React.FC<ModalProps> = ({
  modalData,
  onAmountChange,
  onClose,
  onTokenChange,
  isEth,
}) => {
  const [localAmount, setLocalAmount] = useState(modalData.amount);

  useEffect(() => {
    setLocalAmount(modalData.amount);
  }, [modalData.amount]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setLocalAmount(value);
    onAmountChange(event);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-md text-center relative w-96 shadow-lg">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-2xl font-bold mb-4">{modalData.title}</h2>
        <div className="flex flex-col space-y-2 py-2">
          <select
            className="text-black py-2 px-4 rounded w-full border"
            onChange={onTokenChange}
            value={isEth ? "ETH" : "USDC"} // Set the select value based on isEth
          >
            <option className="text-black py-2 px-4 rounded w-full border" value="ETH">
              ETH
            </option>
            <option className="text-black py-2 px-4 rounded w-full border" value="USDC">
              USDC
            </option>
          </select>
          <input
            type="number"
            value={localAmount}
            onChange={handleChange}
            className="border border-gray-300 p-2 mb-4 w-full rounded"
            placeholder="Enter Amount"
          />
        </div>
        <button
          className="bg-stealth-yellow hover:bg-stealth-yellow-dark text-white py-2 px-4 rounded w-full"
          onClick={() => modalData.onSubmit(localAmount)}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default Modal;
