'use client'
import React, { useState, useEffect } from 'react'
import {
  WagmiConfig,
  createConfig,
  configureChains,
  mainnet,
  useConnect,
  useAccount,
  useDisconnect,
  useNetwork,
  useSignMessage,
} from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
// import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  connectors: [
    // new InjectedConnector({ chains }),
    new MetaMaskConnector({ chains })
  ],
  publicClient,
})

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiConfig config={config}>
      {children}
    </WagmiConfig>
  )
}

const useIsMounted = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return mounted
}

export const ConnectSection = () => {
  const isMounted = useIsMounted()
  const { address, connector, isConnected } = useAccount()
  const { connect, connectors, error: connectError, isLoading, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()

  return isMounted ? (isConnected && connector) ? (
    <section className="flex flex-col gap-3">
      <div className="break-all">{address}</div>
      <div>Connected to {connector.name}</div>
      <button
        className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        onClick={() => disconnect()}
      >
        Disconnect
      </button>
    </section>
  ) : (
    <section className="flex flex-col gap-6">
      {connectors.map((connector) => (
        <button
          className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          {!connector.ready && ' (unsupported)'}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            ' (connecting)'}
        </button>
      ))}
      {connectError && <div>{connectError.message}</div>}
    </section>
  ) : null
}

interface UserGuild {
  id: number
  name: string
  roles: GuildRole[]
  urlName: string
}

interface GuildRole {
  id: number
  description: string
  access: boolean
}

export const DataSection = () => {
  const isMounted = useIsMounted()
  const { isConnected } = useAccount()
  const { data, error, isLoading, signMessageAsync, variables } = useSignMessage()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<UserGuild[]>([])

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const message = formData.get('message') as string
    if (!message) {
      window.alert('Please enter urlnames')
      return
    }
    setLoading(true)
    const signature = await signMessageAsync({
      message,
    })
    const res = await fetch('/guild', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, signature }),
    })
    const data = await res.json()
    setLoading(false)
    setItems(data.items)
  }

  return isMounted && isConnected ? (
    <section>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit}
      >
        <label htmlFor="message">Enter guild urlnames</label>
        <textarea
          id="message"
          name="message"
          className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 px-4 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-blue-500 focus:ring-1 sm:text-sm"
          placeholder="Enter guild urlnames..."
        />
        <button
          className="flex items-center justify-center px-4 py-3 font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm disabled:opacity-50"
          disabled={isLoading || loading}
        >
          {
            isLoading || loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null
          }
          {isLoading || loading ? 'Loading...' : 'Sign Message'}
        </button>
        {error && <div>{error.message}</div>}
      </form>
      <div className="flex flex-col gap-6 mt-6">
        {
          items.map((item: UserGuild) => (
            <div key={item.id}>
              <div className="font-semibold">{item.name}</div>
              <div>
                {item.roles.map((role: GuildRole, index: number) => (
                  <div key={role.id}>
                    <div>{index + 1}. {role.description}</div>
                    <div className={role.access ? 'text-green-600' : 'text-rose-600'}>{`${!!role.access}`}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </section>
  ) : null
}
