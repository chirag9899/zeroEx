import { createThirdwebClient } from 'thirdweb';
import {
  ThirdwebProvider,
  ConnectButton,
  lightTheme,
} from "thirdweb/react";
import {
  createWallet,
  walletConnect,
  inAppWallet,
  Account,
} from "thirdweb/wallets";
import Sell from './Sell';
import ToggleButton from './ToggleButton';
import OrderSummary from './OrderSummary';
import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';


const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});


const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  walletConnect(),
  inAppWallet({
    auth: {
      options: [
        "email",
        "google",
        "apple",
        "facebook",
        "phone",
      ],
    },
  }),
];


const RSidebar = () => {
  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();

  const [formData, setFormData] = useState({
    user_address: activeAccount?.address || '',
    selectedMarket: 'USDC/ETH',
    status: 0,
    createdAt: "",
    amount: '0',
    buyToken: 'USDC',
    sellToken: 'ETH',
    chain: activeChain?.id === 421614 ? 'arb' : 'avax'
  });

  return (
    <div className="h-full w-[30%] fixed right-0 top-0 text-stealth-primary bg-r-sidebar">
      <div className='flex justify-end pt-5 pr-7'>
        <ThirdwebProvider>
          <ConnectButton
            client={client}
            wallets={wallets}
            theme={lightTheme({
              colors: {
                accentText: "#BEFA46",
                accentButtonBg: "#BEFA46",
                accentButtonText: "#000000",
                modalBg: "#FFFFFF",
                borderColor: "#FFFFFF"
              },
            })}
          />
        </ThirdwebProvider>
      </div>
      <div className='flex flex-col justify-center items-center p-10  space-y-6'>
        <ToggleButton />
        <Sell formData={formData} setData={setFormData} />
        <OrderSummary formData={formData} setData={setFormData} />
      </div>
    </div>
  )
}
export default RSidebar
