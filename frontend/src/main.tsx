import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThirdwebProvider } from 'thirdweb/react'
import { ContractProvider } from './providers/thirdwebHook.tsx'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ContractProvider>
      <ThirdwebProvider >
        <App />
        <ToastContainer />
      </ThirdwebProvider>
    </ContractProvider>

  </>,
)
