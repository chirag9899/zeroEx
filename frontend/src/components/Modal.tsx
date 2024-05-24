import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  modalData: {
    amount: number;
    title: string;
    onSubmit: () => void;
  };
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({
  modalData,
  onAmountChange,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-md text-center relative w-96 shadow-lg">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X/>
        </button>
        <h2 className="text-2xl font-bold mb-4">{modalData.title}</h2>
        <input
          type="number"
          value={modalData.amount}
          onChange={onAmountChange}
          className="border border-gray-300 p-2 mb-4 w-full rounded"
          placeholder="Enter Amount"
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full"
          onClick={onConfirm}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default Modal;
