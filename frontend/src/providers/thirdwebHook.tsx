import React, { createContext, useContext, useState } from 'react';

interface ContractContextState {
  contractInstance: any; 
  someFunction: () => void; 
}

const ContractContext = createContext<ContractContextState | undefined>(undefined);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contractInstance, setContractInstance] = useState<any>(null); 


  const someFunction = () => {
   
  };

  return (
    <ContractContext.Provider value={{ contractInstance, someFunction }}>
      {children}
    </ContractContext.Provider>
  );
};

// Create a custom hook to use the contract context
export const useContract = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};