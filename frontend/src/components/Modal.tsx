import React, { useState } from "react";
import { X } from "lucide-react";
interface ModalProps {
  modalData: {
    amount: number;
    title: string;
    onSubmit: (val: number) => void;
  };
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onTokenChange: (event: React.ChangeEvent<HTMLSelectElement>) => void; // Add this prop
}

const Modal: React.FC<ModalProps> = ({
  modalData,
  onAmountChange,
  onClose,
  onTokenChange, // Add this prop
}) => {
  const [localAmount, setLocalAmount] = useState(modalData.amount);

  const handleFocus = () => {
    if (localAmount === 0) {
      setLocalAmount(0);
    }
  };

  console.log(modalData);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalAmount(Number(event.target.value));
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
            onChange={onTokenChange} // Add this handler
          >
            <option
              className="text-black py-2 px-4 rounded w-full border"
              value="ETH"
            >
              ETH
            </option>
            <option
              className="text-black py-2 px-4 rounded w-full border"
              value="USDC"
            >
              USDC
            </option>
          </select>
          <input
            type="number"
            value={localAmount}
            // onFocus={handleFocus}
            onChange={handleChange}
            className="border border-gray-300 p-2 mb-4 w-full rounded"
            placeholder="Enter Amount"
          />
        </div>
        <button
          className="bg-stealth-yellow hover:bg-stealth-yellow-dark text-white py-2 px-4 rounded w-full"
          onClick={() => {
            modalData.onSubmit(localAmount);
          }}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default Modal;
