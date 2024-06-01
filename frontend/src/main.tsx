import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThirdwebProvider } from 'thirdweb/react'
import { ContractProvider } from './providers/thirdwebHook.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ContractProvider>
      <ThirdwebProvider >
        <App />
      </ThirdwebProvider>
    </ContractProvider>
  </>,
)
