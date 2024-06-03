import React, { createContext, useContext, useState, useEffect } from "react";
import { arbitrumSepolia, avalancheFuji } from "thirdweb/chains";
import {
  createThirdwebClient,
  getContract,
  readContract,
  prepareContractCall,
  // sendAndConfirmTransaction,
  sendTransaction,
  ThirdwebContract,
  PreparedTransaction,
} from "thirdweb";
import {
  useActiveAccount,
  // useSendTransaction,
  useActiveWalletChain,
} from "thirdweb/react";
import { abi as executerAbi } from "../abi/executerAbi.ts";
import { abi as usdcAbi } from "../abi/usdcAbi.ts";
import * as paillierBigint from "paillier-bigint";
import { toast } from "react-toastify";
import { ethers } from "ethers";

interface ContractContextState {
  contractInstance: ThirdwebContract | undefined;
  userBalance: { ETH: number; USDC: number };
  deposit: () => Promise<any>;
  getBalance: () => Promise<any>;
  withdraw: () => Promise<any>;
  getUserOrder: () => Promise<void>;
  getPendingWithdrawals: () => Promise<void>;
  pubkey: paillierBigint.PublicKey;
  chainTokenAddresses: { [key: string]: { [key: string]: string } }; // Add this line
  orderData: any; // Add this line
  modalInput: {
    isEth: boolean;
    amount: number;
  };
  setModalInput: React.Dispatch<
    React.SetStateAction<{ isEth: boolean; amount: number }>
  >;
  fetchData: () => Promise<{ ethereum: { usd: number } } | undefined>;
  total: string;
  setTotal: React.Dispatch<React.SetStateAction<string>>;
  pendingWithdrawals: WithdrawalRequest[] | [];
  currentPrice: number;
  setCurrentPrice: React.Dispatch<React.SetStateAction<number>>;
}

interface ContractOrder {
  user: string;
  traderAddress: string;
  amount: BigInt;
  amountToTransfer: BigInt;
  buyToken: string;
  sellToken: string;
  createdAt: BigInt;
  status: number;
}

// const contractOrders = [
//   {
//     user: "0xE2db7ef93684d06BbF47137000065cF26E878B2e",
//     traderAddress: "0xTraderAddress1",
//     amount: BigInt(12), // Converted from "012"
//     amountToTransfer: BigInt(10),
//     buyToken: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
//     sellToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
//     createdAt: 1717304223306, // Example timestamp
//     status: 0,
//   },
//   {
//     user: "0xE2db7ef93684d06BbF47137000065cF26E878B2e",
//     traderAddress: "0xTraderAddress2",
//     amount: BigInt(1), // Converted from "01"
//     amountToTransfer: BigInt(1),
//     buyToken: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
//     sellToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
//     createdAt: "1717303223306", // Example timestamp
//     status: 0,
//   },
// ];

enum Status {
  COMPLETED,
  PENDING,
  FAILED,
}

interface Order {
  user_address: string;
  traderAddress: string;
  amount: string;
  amountToTransfer: string;
  buyToken: string;
  sellToken: string;
  createdAt: string;
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
  const [contractInstance, setContractInstance] = useState<ThirdwebContract>();
  const [usdcTokenInstance, setUsdcTokenInstance] =
    useState<ThirdwebContract>();
  const [userBalance, setUserBalance] = useState<{ ETH: number; USDC: number }>(
    { ETH: 0, USDC: 0 }
  );
  const [orderData, setUserOrders] = useState<any>([]);
  const [modalInput, setModalInput] = useState<{
    isEth: boolean;
    amount: number;
  }>({ isEth: true, amount: 0 });
  const [total, setTotal] = useState("0");
  const [pendingWithdrawals, setPendingWithdrawals] = useState<
    WithdrawalRequest[]
  >([]);
  const [currentPrice, setCurrentPrice] = useState(
    localStorage.getItem("price")
      ? JSON.parse(localStorage.getItem("price") || "").price
      : 0
  );

  const activeChain = useActiveWalletChain();
  console.log(modalInput);

  const activeAccount = useActiveAccount();
  console.log(activeChain);

  const chainTokenAddresses: { [key: string]: { [key: string]: string } } = {
    arb: {
      USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      CONTRACT: "0x31333dA7AAcbE968310e09279bda1dD8dE14d805",
      ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    avax: {
      USDC: "0x5425890298aed601595a70AB815c96711a31Bc65",
      CONTRACT: "0x18Bb384D85A2E613C89F6cD00eBE936f5370A68c",
      ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
  };

  const pubkey = new paillierBigint.PublicKey(
    2110635290356708079658926219106600858277n,
    2110635290356708079658926219106600858278n
  );

  useEffect(() => {
    const client = createThirdwebClient({
      clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
    });

    const initContract = async () => {
      try {
        if (activeChain?.name === "Arbitrum Sepolia") {
          const contract = getContract({
            address: chainTokenAddresses["arb"].CONTRACT,
            abi: executerAbi as any,
            client: client,
            chain: arbitrumSepolia,
          });

          const usdc_contract = getContract({
            address: chainTokenAddresses["arb"].USDC,
            abi: usdcAbi as any,
            client: client,
            chain: arbitrumSepolia,
          });
          setContractInstance(contract);
          setUsdcTokenInstance(usdc_contract);
        } else if (activeChain?.name === "Avalanche Fuji") {
          const contract = getContract({
            address: chainTokenAddresses["avax"].CONTRACT,
            abi: executerAbi as any,
            client: client,
            chain: avalancheFuji,
          });

          const usdc_contract = getContract({
            address: chainTokenAddresses["avax"].USDC,
            abi: usdcAbi as any,
            client: client,
            chain: avalancheFuji,
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

    try {
      const balance = await readContract({
        contract: contractInstance,
        method:
          "function getUserBalance(address) view returns ((uint256, uint256))",
        params: [activeAccount?.address?.toString() ?? ""],
      });
      console.log(balance);
      setUserBalance({ ETH: Number(balance[0]), USDC: Number(balance[1]) });
      return balance;
    } catch (e) {
      return;
    }
  };

  const getPendingWithdrawals = async () => {
    try {
      if (!contractInstance) return;

      const pendingWithdrawals: WithdrawalRequest[] = await readContract({
        contract: contractInstance,
        method:
          "function getPendingWithdrawals() view returns ((address, uint256, bool, bool, uint256)[])",
      }).then((data) =>
        data.map((item) => ({
          user: item[0],
          amount: item[1],
          isETH: item[2],
          isPending: item[3],
          pendingAt: item[4],
        }))
      );
      // const pendingWithdrawals : WithdrawalRequest[] = [
      //   { user: '0xE2db7ef93684d06BbF47137000065cF26E878B2e', amount: 100n, isETH: true, isPending: true, pendingAt: 1633027200n },
      //   { user: '0xE2db7ef93684d06BbF47137000065cF26E878B2e', amount: 200n, isETH: false, isPending: false, pendingAt: 1633113600n },
      //   { user: '0xE2db7ef93684d06BbF47137000065cF26E878B2e', amount: 300n, isETH: true, isPending: true, pendingAt: 1633200000n },
      // ];
      const userWithdrawals = pendingWithdrawals.filter(
        (withdrawal) => withdrawal.user === activeAccount?.address
      );
      console.log(userWithdrawals);
      setPendingWithdrawals(userWithdrawals || []);
    } catch (error) {
      console.log(error);
    }
  };

  const getUserOrder = async () => {
    try {
      if (!contractInstance) return;
      const orders: ContractOrder[] = await readContract({
        contract: contractInstance,
        method:
          "function getUserOrders(address) view returns ((address, address, uint256, uint256, address, address, uint256, uint256)[])",
        params: [
          activeAccount?.address?.toString() ||
            "0xe2db7ef93684d06bbf47137000065cf26e878b2e",
        ],
      }).then((data) =>
        data.map((item) => ({
          user: item[0],
          traderAddress: item[1],
          amount: item[2],
          amountToTransfer: item[3],
          buyToken: item[4],
          sellToken: item[5],
          createdAt: item[6],
          status: Object.values(Status)[Number(item[7])] as Status,
        }))
      );

      // const orders = contractOrders;
      const updatedContractOrders = orders.map((order) => {
        return {
          ...order,
          sellToken:
            order.sellToken === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
              ? "ETH"
              : "USDC",
          buyToken:
            order.buyToken === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
              ? "ETH"
              : "USDC",
        };
      });
      const ordersFromContract: Order[] = updatedContractOrders.map(
        (order) => ({
          user_address: order.user,
          traderAddress: order.traderAddress,
          amount: order.amount.toString(),
          amountToTransfer: order.amountToTransfer.toString(),
          buyToken: order.buyToken,
          sellToken: order.sellToken,
          createdAt: order.createdAt.toString(),
          status: order.status,
        })
      );

      console.log("Orders from contract", ordersFromContract);

      const ordersFromLocal: Order[] = JSON.parse(
        localStorage.getItem("orderData") || "[]"
      );
      console.log("Orders from local", ordersFromLocal);

      let updatedOrders = [...ordersFromLocal];

      ordersFromContract.forEach((order) => {
        const index = updatedOrders.findIndex((localOrder) => {
          const isMatch =
            localOrder.user_address === order.user_address &&
            BigInt(localOrder.createdAt) === BigInt(order.createdAt);

          // Debugging output
          console.log("Matching criteria result:", isMatch);
          console.log({
            localOrder,
            contractOrder: order,
            localCreatedAt: BigInt(localOrder.createdAt),
            contractCreatedAt: BigInt(order.createdAt),
            userMatch: localOrder.user_address === order.user_address,
            createdAtMatch:
              BigInt(localOrder.createdAt) === BigInt(order.createdAt),
          });

          return isMatch;
        });

        console.log("Index found:", index);

        if (index !== -1) {
          console.log("Order matched:", updatedOrders[index]);

          updatedOrders[index].status = order.status;

          const localAmount = BigInt(updatedOrders[index].amount);
          const contractAmountToTransfer = BigInt(order.amount);

          // Calculate the fulfillment percentage
          const fulfillmentPercentage =
            (localAmount * 100n) / contractAmountToTransfer;
          updatedOrders[
            index
          ].fulfilledAmount = `${localAmount} / ${contractAmountToTransfer} (${fulfillmentPercentage}%)`;
        }
      });

      localStorage.setItem("orderData", JSON.stringify(updatedOrders));
      console.log("Updated Orders", updatedOrders);

      setUserOrders(updatedOrders);
    } catch (error) {
      throw new Error(`Error getting user orders: ${(error as Error).message}`);
    }
  };

  const deposit = async () => {
    let { isEth, amount: ethAmount } = modalInput;
    let amount = ethers.utils.parseUnits(ethAmount.toString(), "ether").toBigInt();
    if(!isEth) {
      amount = ethers.utils.parseUnits(ethAmount.toString(), 6).toBigInt();
    }
    console.log("Inside deposit", isEth, amount); // Log to check values
    try {
      if (!activeAccount) {
        throw new Error("Active account is undefined");
      }

      if (!contractInstance) {
        throw new Error("Contract instance is undefined");
      }

      if (amount < 0) {
        toast.error("Amount should be greater than 0");
        return;
      }

      let transaction: PreparedTransaction<any>;

      if (!isEth) {
        if (!usdcTokenInstance) {
          throw new Error("USDC token instance is undefined");
        }

        console.log(
          activeAccount.address,
          contractInstance.address,
          usdcTokenInstance.address
        );

        const allowance = await readContract({
          contract: usdcTokenInstance,
          method:
            "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
          params: [activeAccount.address, contractInstance.address],
        });

        console.log(BigInt(allowance), amount);

        try {
          if (BigInt(allowance) < amount) {
            const approveTx = prepareContractCall({
              contract: usdcTokenInstance,
              method:
                "function approve(address _spender, uint256 _value) public returns (bool success)",
              params: [contractInstance.address, amount],
            });

            await sendTransaction({
              transaction: approveTx,
              account: activeAccount,
            });
          }
        } catch (error) {
          toast.error("Approvance Failed");
        }
      }

      transaction = prepareContractCall({
        contract: contractInstance,
        method:
          "function depositFunds(bool isEth ,uint256 amount) public payable",
        params: [isEth, BigInt(amount)],
        value: isEth ? BigInt(amount) : BigInt(0),
        gas: BigInt("800000"),
        maxFeePerGas: BigInt("20000000000"),
      });

      const result = await sendTransaction({
        transaction: transaction,
        account: activeAccount,
      });

      await getBalance();
      return result;
    } catch (error) {
      console.log({ error });
      throw new Error(`Error depositing: ${error}`);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const ethPriceInUSD = data.ethereum.usd;
      const weiPriceInUSD = ethPriceInUSD / 1e18;
      localStorage.setItem(
        "price",
        JSON.stringify({ price: data.ethereum.usd, timestamp: Date.now() })
      );
      return { ethereum: { usd: weiPriceInUSD } };
    } catch (error) {
      console.log(error);
    }
  };

  const withdraw = async () => {
    try {
      // const { isEth, amount } = modalInput;
      let { isEth, amount: ethAmount } = modalInput;
      let amount = ethers.utils.parseUnits(ethAmount.toString(), isEth ? "ether": 6).toBigInt();

      console.log("Inside deposit", isEth, amount); // Log to check values
      if (!activeAccount) {
        throw new Error("Active account is undefined");
      }

      if (!contractInstance) {
        throw new Error("Contract instance is undefined");
      }

      const transaction = prepareContractCall({
        contract: contractInstance,
        method: "function withdrawFunds(uint256 amount, bool isETH) public",
        params: [BigInt(amount), isEth],
        value: BigInt(0),
      });

      const result = await sendTransaction({
        transaction: transaction,
        account: activeAccount,
      });

      await getBalance();

      return result;
    } catch (error) {
      console.log({ error });
      throw new Error(`Error withdrawing: ${error}`);
    }
  };

  return (
    <ContractContext.Provider
      value={{
        contractInstance,
        userBalance,
        deposit,
        getBalance,
        withdraw,
        getUserOrder,
        getPendingWithdrawals,
        pubkey,
        chainTokenAddresses,
        orderData,
        modalInput,
        setModalInput,
        fetchData,
        total,
        setTotal,
        pendingWithdrawals,
        currentPrice,
        setCurrentPrice,
      }}
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
