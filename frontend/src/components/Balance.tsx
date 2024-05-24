import React, { useState } from 'react';
import Modal from './Modal';  // Import the modal component
import { ArrowDownLeft, Plus, ArrowUpRight } from 'lucide-react';

const Balance: React.FC = () => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        amount: 0,
        title: "",
        onSubmit: () => { },
    });

    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setModalData({ ...modalData, amount: Number(event.target.value) });
    };

    const handleOnClick = (method: string) => {
        if (method == "send") {
            setModalData({
                ...modalData,
                title: "SEND",
                onSubmit: handleSubmitOnSend
            })

        } else if (method == "receive") {
            setModalData({
                ...modalData,
                title: "RECIEVE",
                onSubmit: handleSubmitOnRecieve
            })

        } else if (method == "addBalance") {
            setModalData({
                ...modalData,
                title: "ADD BALANCE",
                onSubmit: handleSubmitOnAddBalance
            })
        }
        setModalOpen(true);
    }

    const handleSubmitOnSend = () => {
        setModalOpen(false);
    };

    const handleSubmitOnRecieve = () => {
        setModalOpen(false);
    };

    const handleSubmitOnAddBalance = () => {
        setModalOpen(false);
    };

    return (
        <div className="flex flex-col items-center justify-center rounded-lg bg-l-sidebar p-4">
            <div className="text-center mb-5">
                <h1 className="text-xl pb-2">My Wallet</h1>
                <p className="text-5xl font-bold">$128,921</p>
            </div>
            <div className="flex space-x-4">
                <button 
                    className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800" 
                    onClick={() => handleOnClick("receive")}
                >
                    <ArrowDownLeft />
                </button>
                <button className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800" onClick={() => handleOnClick("send")}><ArrowUpRight /></button>
                <button
                    className="w-16 h-16 bg-stealth-yellow text-black rounded-full flex items-center justify-center hover:bg-stealth-yellow"
                    onClick={() => handleOnClick("addBalance")}
                >
                    <Plus />
                </button>
            </div>

            {isModalOpen && (
                <Modal
                    modalData={modalData}
                    onAmountChange={handleAmountChange}
                    onConfirm={modalData.onSubmit}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Balance;
