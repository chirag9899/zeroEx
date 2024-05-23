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
} from "thirdweb/wallets";


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
  return (
    <div className="h-full w-96 fixed right-0 top-0 text-stealth-primary bg-r-sidebar
    ">
        <div className='flex justify-end p-5'>
        <ThirdwebProvider>
        <ConnectButton
          // onConnect={() => navigate('/home')}
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
</div>
  )
}

export default RSidebar
