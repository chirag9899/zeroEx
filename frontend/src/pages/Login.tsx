import { ConnectEmbed } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { useNavigate } from 'react-router-dom';
import {
  ThirdwebProvider,
  // ConnectButton,
  lightTheme,
} from "thirdweb/react";
import {
  createWallet,
  walletConnect,
  inAppWallet,
} from "thirdweb/wallets";

import logo from "../assets/logo.png"
import { arbitrumSepolia, avalancheFuji } from 'thirdweb/chains';


const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  walletConnect(),
  // inAppWallet({
  //   auth: {
  //     options: [
  //       "email",
  //       "google",
  //       "apple",
  //       "facebook",
  //       "phone",
  //     ],
  //   },
  // }),
];



const Login = () => {

  const navigate = useNavigate();

  return (
    <div className='flex justify-center items-center p-20 space-x-20 h-screen'>
      <div className='flex flex-col justify-start items-start w-1/2'>
        <div className='flex items-center'>
          <img src={logo} className='h-32 w-32 mr-2' />
          <p className='text-6xl font-bold font-oswald text-primary-text'>
            Stealth Bid
          </p>
        </div>
        <span className='text-2xl font-roboto text-secondary-text'>
          Discover the Unseen: Revolutionizing Your Trading Strategy with Real-Time
          Access to Hidden Market Liquidity and Advanced Analytics for Optimal
          Decision Making
        </span>
      </div>
      <div className='flex flex-col justify-center space-y-2'>
        <div>
          <p className='text-2xl font-roboto'>Login to the world of trading</p>
        </div>

        <ConnectEmbed
          onConnect={() => navigate('/home')}
          client={client}
          chains={[avalancheFuji, arbitrumSepolia]}
          wallets={wallets}
          theme={lightTheme({
            colors: {
              // accentText: "#BEFA46",
              // accentButtonBg: "#BEFA46",
              // accentButtonText: "#000000",
              // modalBg: "#FFFFFF",
              // borderColor: "#FFFFFF"
            },
          })}
        />
      </div>
    </div>
  )
}

export default Login

