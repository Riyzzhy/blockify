import React, { createContext, useContext, useState, ReactNode } from 'react'

type Web3ContextType = {
  isConnected: boolean
  connect?: () => Promise<void>
  disconnect?: () => void
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)

  // Minimal stubs; real implementation should integrate with wallet provider
  const connect = async () => setIsConnected(true)
  const disconnect = () => setIsConnected(false)

  return (
    <Web3Context.Provider value={{ isConnected, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider')
  return ctx
}

export default Web3Provider
