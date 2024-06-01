import React, { createContext, useContext, useState, useEffect } from "react";
import { arbitrumSepolia } from "thirdweb/chains";
import {
  createThirdwebClient,
  getContract,
  readContract,
  prepareContractCall,
  sendAndConfirmTransaction,
  ThirdwebContract,
  PreparedTransaction,
} from "thirdweb";
import {
  useActiveAccount,
  useSendTransaction,
  useActiveWalletChain,
} from "thirdweb/react";
import { abi as executerAbi } from "../abi/executerAbi.ts";
import { abi as usdcAbi } from "../abi/usdcAbi.ts";
import {
  createWallet,
  injectedProvider,
  Wallet,
  walletConnect,
} from "thirdweb/wallets";
import * as paillierBigint from "paillier-bigint";

interface ContractContextState {
  contractInstance: any;
  userBalance: () => { ETH: number; USDC: number };
}

enum Status {
  COMPLETED,
  PENDING,
  FAILED,
}
interface Order {
  user: string;
  traderAddress: string;
  amount: bigint;
  amountToTransfer: bigint;
  buyToken: string;
  sellToken: string;
  createdAt: bigint;
  status: Status;
  fulfilledAmount?: string;
}

interface WithdrawalRequest {
  user: string;
  amount: bigint;
  isETH: boolean;
  isPending: boolean;
  pendingAt: bigint;
}

const ContractContext = createContext<ContractContextState | undefined>(
  undefined
);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // <Readonly<ThirdwebContract<Abi>>>(null)
  const [contractInstance, setContractInstance] = useState<ThirdwebContract>();
  const [usdcTokenInstance, setUsdcTokenInstance] =
    useState<ThirdwebContract>();

  const activeChain = useActiveWalletChain();
  console.log(activeChain?.name);

  const chainTokenAddresses: { [key: string]: { [key: string]: string } } = {
    amoy: {
      USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      CONTRACT: "0x32A96ce7203a5257785D801576a61B06e87A5279",
    },
    avax: {
      USDC: "0xasdasdeafb1BDbe2F0316DF893fd58CE46AA4d",
      CONTRACT: "0xF7bF22cdC0c16ee8704863d03403cf3DC9650B50", // to be changed
    },
  };

  const [userBalance, setUserBalance] = useState<{ ETH: number; USDC: number }>(
    { ETH: 0, USDC: 0 }
  );
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const pubkey = new paillierBigint.PublicKey(
    2110635290356708079658926219106600858277n,
    2110635290356708079658926219106600858278n
  );
  const activeAccount = useActiveAccount();

  useEffect(() => {
    const client = createThirdwebClient({
      clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
    });

    const initContract = async () => {
      try {
        if (activeChain?.name === "Polygon Amoy") {
          const contract = getContract({
            address: chainTokenAddresses["amoy"].CONTRACT,
            abi: executerAbi as any,
            client: client,
            chain: arbitrumSepolia,
          });

          const usdc_contract = getContract({
            address: chainTokenAddresses["amoy"].USDC,
            abi: usdcAbi as any,
            client: client,
            chain: arbitrumSepolia,
          });
          setContractInstance(contract);
          setUsdcTokenInstance(usdc_contract);
        } else if (activeChain?.name === "Avalanche Avax") {
          const contract = getContract({
            address: chainTokenAddresses["avax"].CONTRACT,
            abi: executerAbi as any,
            client: client,
            chain: arbitrumSepolia,
          });

          const usdc_contract = getContract({
            address: chainTokenAddresses["avax"].USDC,
            abi: usdcAbi as any,
            client: client,
            chain: arbitrumSepolia,
          });
          setContractInstance(contract);
          setUsdcTokenInstance(usdc_contract);
        }
      } catch (error) {
        console.error(error);
      }
    };
    initContract();
    getBalance();
  }, [activeChain]);

  const getBalance = async () => {
    if (!contractInstance) return;

    const balance = await readContract({
      contract: contractInstance,
      method:
        "function getUserBalance(address) view returns ((uint256, uint256))",
      params: [
        activeAccount?.address?.toString() ||
          "0xe2db7ef93684d06bbf47137000065cf26e878b2e",
      ],
    });
    console.log(balance);
    setUserBalance({ ETH: Number(balance[0]), USDC: Number(balance[1]) });
    return balance;
  };

  // get pending withdrwals
  const getPendingWithdrawals = async () => {
    try {
      if (!contractInstance) return;

      const pendingWithdrawals: WithdrawalRequest[] = await readContract({
        contract: contractInstance,
        method:
          "function getPendingWithdrawals() view returns ((address, uint256, bool, bool, uint256)[])",
      }).then((data) =>
        data.map((item) => {
          return {
            user: item[0],
            amount: item[1],
            isETH: item[2],
            isPending: item[3],
            pendingAt: item[4],
          };
        })
      );
      console.log("pendingWithdrawals", pendingWithdrawals);
    } catch (error) {
      console.log(error);
    }
  };

  const getUserOrder = async () => {
    try {
      if (!contractInstance) return;

      const ordersFromContract: Order[] = await readContract({
        contract: contractInstance,
        method:
          "function getUserOrders(address) view returns ((address, address, uint256, uint256, address, address, uint256, uint256)[])",
        params: [
          activeAccount?.address?.toString() ||
            "0xe2db7ef93684d06bbf47137000065cf26e878b2e",
        ],
      }).then((data) =>
        data.map((item) => {
          return {
            user: item[0],
            traderAddress: item[1],
            amount: item[2],
            amountToTransfer: item[3],
            buyToken: item[4],
            sellToken: item[5],
            createdAt: item[6],
            status: Object.values(Status)[Number(item[7])] as Status,
          };
        })
      );
      console.log("order from contract", ordersFromContract);

      const ordersFromLocal: Order[] = JSON.parse(
        localStorage.getItem("orderData") || "[]"
      );
      console.log("order from local", ordersFromLocal);

      let updatedOrders = [...ordersFromLocal];

      ordersFromContract.forEach((order) => {
        const index = updatedOrders.findIndex(
          (allOrder) =>
            allOrder.user === order.user &&
            allOrder.createdAt === order.createdAt
        );

        if (index !== -1) {
          if (updatedOrders[index].amount - order.amount === BigInt(0)) {
            updatedOrders[index].status = Status.COMPLETED;
          } else {
            if (updatedOrders[index].status === Status.PENDING) {
              updatedOrders[index].fulfilledAmount = `${
                updatedOrders[index].amount
              } / ${updatedOrders[index].amount - order.amount}`;
              updatedOrders[index].amount -= order.amount;
            }
          }
        }
      });

      localStorage.setItem("orderData", JSON.stringify(updatedOrders));
      console.log("updatedOrders", updatedOrders);

      setUserOrders(updatedOrders);
    } catch (error) {
      throw new Error(`Error getting user order ${error}`);
    }
  };

  const deposit = async (isEth: boolean, amount: number) => {
    console.log(isEth, amount);
    try {
      if (!activeAccount) {
        throw new Error("Active account is undefined");
      }

      if (!contractInstance) {
        throw new Error("Contract instance is undefined");
      }

      let transaction: PreparedTransaction<any>;

      if (!isEth) {
        console.log("enter");
        if (!usdcTokenInstance) {
          throw new Error("Contract instance is undefined");
        }

        let allowance_transaction = await readContract({
          contract: usdcTokenInstance,
          method:
            "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
          params: [activeAccount.address, contractInstance.address],
          value: isEth ? BigInt(amount) : BigInt(0),
        });

        console.log(allowance_transaction);

        if (Number(allowance_transaction) < amount) {
          let aprove_tx = prepareContractCall({
            contract: usdcTokenInstance,
            method:
              "function approve(address _spender, uint256 _value) public returns (bool success)",
            params: [contractInstance.address, BigInt(amount)],
            value: isEth ? BigInt(amount) : BigInt(0),
          });

          var aprove_result = await sendAndConfirmTransaction({
            transaction: aprove_tx,
            account: activeAccount,
          });

          if (aprove_result.status === "reverted") {
            throw new Error("Aprove transaction failed");
          }
        }
      }

      console.log(activeAccount.address, contractInstance.address);

      transaction = prepareContractCall({
        contract: contractInstance,
        method:
          "function depositFunds(bool isEth ,uint256 amount) public payable",
        params: [isEth ? true : false, BigInt(amount)],
        value: isEth ? BigInt(amount) : BigInt(0),
      });

      var result = await sendAndConfirmTransaction({
        transaction: transaction,
        account: activeAccount,
      });

      return result;
    } catch (error) {
      console.log({ error });
      throw new Error(`Error depositing ${error}`);
    }
  };

  const withdraw = async (isEth: boolean, amount: number) => {
    console.log(isEth, amount);
    try {
      if (!activeAccount) {
        throw new Error("Active account is undefined");
      }

      if (!contractInstance) {
        throw new Error("Contract instance is undefined");
      }

      let transaction: PreparedTransaction<any>;

      transaction = prepareContractCall({
        contract: contractInstance,
        method: "function withdrawFunds(uint256 amount, bool isETH) public",
        params: [BigInt(amount), isEth],
        value: BigInt(0),
      });

      const result = await sendAndConfirmTransaction({
        transaction: transaction,
        account: activeAccount,
      });

      return result;
    } catch (error) {
      console.log({ error });
      throw new Error(`Error withdrawing: ${error}`);
    }
  };

  return (
    <ContractContext.Provider
      value={
        {
          contractInstance,
          userBalance,
          deposit,
          getBalance,
          withdraw,
          getUserOrder,
          getPendingWithdrawals,
          pubkey,
        } as any
      }
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};
