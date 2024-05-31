import React, { createContext, useContext, useState, useEffect } from 'react';
import { arbitrumSepolia } from "thirdweb/chains";
import { createThirdwebClient, getContract, readContract, prepareContractCall, sendAndConfirmTransaction, ThirdwebContract, PreparedTransaction } from "thirdweb";
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import {abi as executerAbi} from "../abi/executerAbi.ts";
import { createWallet, injectedProvider, Wallet, walletConnect } from "thirdweb/wallets";

interface ContractContextState {
  contractInstance: any; 
  userBalance: () => { ETH: number; USDC: number; }; 
}

const ContractContext = createContext<ContractContextState | undefined>(undefined);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // <Readonly<ThirdwebContract<Abi>>>(null)
  const [contractInstance, setContractInstance] = useState<ThirdwebContract>();

  const [userBalance, setUserBalance] = useState<{ETH: number, USDC: number}>({ETH: 0, USDC: 0});
  const activeAccount = useActiveAccount();


  useEffect(() => {
    const client = createThirdwebClient({
        clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
    });

    const initContract = async() => {
        try {
            const contract = getContract({
                address: "0x35801db57ef45068A6865d21500CC1286Fb6b508", 
                abi: executerAbi as any,
                client: client,
                chain: arbitrumSepolia
            });
            console.log("hello",contract)

            setContractInstance(contract);
        } catch (error) {
            console.error(error);
            
        }
    }
    initContract();
    getBalance();

  }, [ ]);
  

    const getBalance = async () => {
        if (!contractInstance) return; 

        const balance = await readContract({
            contract: contractInstance,
            method: "function getUserOrders(address) view returns ((uint256, uint256))",
            params: ["0xE2db7ef93684d06BbF47137000065cF26E878B2e"],
        });
        setUserBalance({ ETH: Number(balance[0]), USDC: Number(balance[1]) });
        return balance
    };

const deposit = async(isEth: boolean ,amount: number) => {
    if (!activeAccount) {
        throw new Error('Active account is undefined');
    }

    if (!contractInstance) {
        throw new Error('Contract instance is undefined');
    }
    let transaction: PreparedTransaction<any> ;

    transaction = prepareContractCall({
        contract: contractInstance,
        method: "function depositFunds(isEth ,address) public payable",
        params: [  isEth ? true : false , amount.toString()],
        value: isEth ? BigInt(amount) : BigInt(0) 
    });

    var result = await sendAndConfirmTransaction({
        transaction: transaction,
        account: activeAccount,
    });
    
    return result;
}




  return (
    <ContractContext.Provider value={{ contractInstance, userBalance , deposit} as any}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};