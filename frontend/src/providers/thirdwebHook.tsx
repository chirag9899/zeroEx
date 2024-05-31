import React, { createContext, useContext, useState, useEffect } from 'react';
import { arbitrumSepolia } from "thirdweb/chains";
import { createThirdwebClient, getContract, readContract, prepareContractCall, sendAndConfirmTransaction, ThirdwebContract, PreparedTransaction } from "thirdweb";
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import {abi as executerAbi} from "../abi/executerAbi.ts";
import { abi as usdcAbi } from '../abi/usdcAbi.ts';
import { createWallet, injectedProvider, Wallet, walletConnect } from "thirdweb/wallets";


interface ContractContextState {
  contractInstance: any; 
  userBalance: () => { ETH: number; USDC: number; }; 
}

const ContractContext = createContext<ContractContextState | undefined>(undefined);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // <Readonly<ThirdwebContract<Abi>>>(null)
  const [contractInstance, setContractInstance] = useState<ThirdwebContract>();
  const [usdcTokenInstance, setUsdcTokenInstance] = useState<ThirdwebContract>();

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

            const usdc_contract =  getContract({
                address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", 
                abi: usdcAbi as any,
                client: client,
                chain: arbitrumSepolia
            });

            setContractInstance(contract);
            setUsdcTokenInstance(usdc_contract)
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
            method: "function getUserBalance(address) view returns ((uint256, uint256))",
            params: [activeAccount?.address?.toString() || '0xe2db7ef93684d06bbf47137000065cf26e878b2e'],
        });
        console.log(balance)
        setUserBalance({ ETH: Number(balance[0]), USDC: Number(balance[1]) });
        return balance
    };


    const getUserOrder = async () => {
        if (!contractInstance) return; 

        const balance = await readContract({
            contract: contractInstance,
            method: "function getUserOrder(address) view returns ((uint256, uint256))",
            params: [activeAccount?.address?.toString() || '0xe2db7ef93684d06bbf47137000065cf26e878b2e'],
        });
        console.log(balance)
        setUserBalance({ ETH: Number(balance[0]), USDC: Number(balance[1]) });
        return balance
    };

const deposit = async(isEth: boolean ,amount: number) => {
    console.log(isEth, amount)
    try {
        if (!activeAccount) {
            throw new Error('Active account is undefined');
        }
    
        if (!contractInstance) {
            throw new Error('Contract instance is undefined');
        }
     
        let transaction: PreparedTransaction<any> ;
    
        if (!isEth) {
            console.log("enter")
            if (!usdcTokenInstance) {
                throw new Error('Contract instance is undefined');
            }
    
            let allowance_transaction = await readContract({
                contract: usdcTokenInstance,
                method: "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
                params: [ activeAccount.address , contractInstance.address],
                value: isEth ? BigInt(amount) : BigInt(0) 
            });
            
            console.log(allowance_transaction)
    
              if (Number(allowance_transaction) < amount) {

                let aprove_tx = prepareContractCall({
                    contract: usdcTokenInstance,
                    method: "function approve(address _spender, uint256 _value) public returns (bool success)",
                    params: [  contractInstance.address , BigInt(amount)],
                    value: isEth ? BigInt(amount) : BigInt(0) 
                });

                var aprove_result = await sendAndConfirmTransaction({
                    transaction: aprove_tx,
                    account: activeAccount,
                });

                if (aprove_result.status === "reverted") {
                    throw new Error("Aprove transaction failed")
                } 
                
              }
            }
    
        transaction = prepareContractCall({
            contract: contractInstance,
            method: "function depositFunds(bool isEth ,uint256 amount) public payable",
            params: [  (isEth ? true : false) , BigInt(amount)],
            value: isEth ? BigInt(amount) : BigInt(0) 
        });
    
        var result = await sendAndConfirmTransaction({
            transaction: transaction,
            account: activeAccount,
        });
        
        return result;

    } catch (error) {
        console.log({error})
        throw new Error(`Error depositing ${error}`)
    }
   
}

const withdraw = async(isEth: boolean, amount: number) => {
    console.log(isEth, amount)
    try {
        if (!activeAccount) {
            throw new Error('Active account is undefined');
        }

        if (!contractInstance) {
            throw new Error('Contract instance is undefined');
        }

        let transaction: PreparedTransaction<any> ;

        transaction = prepareContractCall({
            contract: contractInstance,
            method: "function withdrawFunds(uint256 amount, bool isETH) public",
            params: [BigInt(amount), isEth],
            value: BigInt(0)  
        });

        const result = await sendAndConfirmTransaction({
            transaction: transaction,
            account: activeAccount,
        });

        return result;

    } catch (error) {
        console.log({error});
        throw new Error(`Error withdrawing: ${error}`);
    }
}




  return (
    <ContractContext.Provider value={{ contractInstance, userBalance, deposit, getBalance , withdraw} as any}>
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