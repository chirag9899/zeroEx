import React, { useState } from "react";
import Modal from "./Modal"; // Import the modal component
import { ArrowDownLeft, Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import { ClipLoader } from "react-spinners"; // Import the loader
import { useContract } from "../providers/thirdwebHook";
import { useActiveWalletChain } from "thirdweb/react";

interface BalanceProps {
  userBalance: {
    ETH: number;
    USDC: number;
  };
  price: number;
}

const Balance: React.FC<BalanceProps> = ({ userBalance,price }) => {
  const chain = useActiveWalletChain();
  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingAddBalance, setLoadingAddBalance] = useState(false);

  const { deposit, withdraw, modalInput, setModalInput }: any = useContract();
  const [action, setAction] = useState<string | null>(null);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === '0' ? '' : event.target.value;
    setModalInput((prevData: any) => ({
      ...prevData,
      amount: isNaN(Number(newValue)) ? 0 : Number(newValue),
    }));
  };

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModalInput((prevData: any) => ({
      ...prevData,
      isEth: event.target.value === "ETH",
    }));
  };

  const handleOnClick = (method: string) => {
    setAction(method);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (action === "withdraw") {
      await handleWithdraw();
    } else if (action === "addBalance") {
      await handleAddBalance();
    }
    setModalOpen(false);
    resetModalInput();
  };

  const handleWithdraw = async () => {
    setLoadingWithdraw(true);
    try {
      await withdraw();
      toast.success("Withdrawal Successful");
    } catch (error) {
      const errorMessage = (error as Error)?.message;
      const errorMessageAfterTransactionError = errorMessage.split('TransactionError:')[1].split('contract:')[0].trim();
      toast.error(
        <div>
          <p>Withdrawal Failed</p>
          <h3>{errorMessageAfterTransactionError}</h3>
        </div>
      );
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleAddBalance = async () => {
    setLoadingAddBalance(true);
    try {
      await deposit();
      toast.success("Balance Added Successfully");
    } catch (error) {
      toast.error("Adding Balance Failed");
    } finally {
      setLoadingAddBalance(false);
    }
  };

  const resetModalInput = () => {
    setModalInput({
      isEth: true,
      amount: 0,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4">
      <div className="text-center mb-5">
        <h1 className="text-l font-bold pb-2">My Wallet</h1>
        <div className="flex space-x-10">
          <div>
            ETH balance
            <p className="text-4xl font-bold">${((userBalance.ETH / 1e18) * price).toFixed(4)}</p>
          </div>
          <div>
            USDC balance
            <p className="text-4xl font-bold">${((userBalance.USDC /1e6) * price).toFixed(4)}</p>
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800"
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
          className="w-20 h-20 bg-stealth-yellow text-black rounded-full flex items-center justify-center hover:bg-stealth-yellow-dark"
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
          modalData={modalInput}
          onAmountChange={handleAmountChange}
          onClose={() => setModalOpen(false)}
          onTokenChange={handleTokenChange}
          isEth={modalInput.isEth}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default Balance;
