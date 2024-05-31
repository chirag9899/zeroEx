import React, { createContext, useContext, useState, useEffect } from 'react';
import { arbitrumSepolia } from "thirdweb/chains";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import {abi as executerAbi} from "../abi/executerAbi.ts";

interface ContractContextState {
  contractInstance: any; 
  someFunction: () => void; 
}

const ContractContext = createContext<ContractContextState | undefined>(undefined);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contractInstance, setContractInstance] = useState<any>(null); 
  const [userBalance, setUserBalance] = useState<{ETH: number, USDC: number}>({ETH: 0, USDC: 0});

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
    const balance  = await readContract({
            contract: contractInstance,
            method: "function getUserOrders(address) view returns ((uint256, uint256))",
            params: ["0xE2db7ef93684d06BbF47137000065cF26E878B2e"],
        });
        setUserBalance({ETH: Number(balance[0]), USDC: Number(balance[1])});
        return balance
};

// const deposit = () => {
//     const orders = await wr
// }


  return (
    <ContractContext.Provider value={{ contractInstance, userBalance } as any}>
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