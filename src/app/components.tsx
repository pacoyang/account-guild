'use client'
import React, { useState, useEffect } from 'react'
import { MetaMaskSDK } from '@metamask/sdk'
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
import { InjectedConnector } from 'wagmi/connectors/injected'
import { atom, useAtom, useAtomValue } from 'jotai'

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
  ],
  publicClient,
})

const accountAtom = atom<string>('')

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
  const [account, setAccount] = useAtom(accountAtom)

  function isMobile(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'iphone', 'ipod', 'android', 'blackberry', 'windows phone'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }

  const handleUnsupportMetaMaskConnect = async () => {
    if (isMobile()) {
      const MMSDK = new MetaMaskSDK()
      const provider = MMSDK.getProvider()
      if (provider) {
        const accounts = await provider.request({ method: 'eth_requestAccounts', params: [] })
        if (accounts && (accounts as string[]).length > 0) {
          setAccount((accounts as string[])[0])
          return
        }
      }
    }
    window.open('https://metamask.io/')
  }

  return isMounted ? ((isConnected && connector) || account ) ? (
    <section className="flex flex-col gap-3">
      <div className="break-all">{account || address}</div>
      <div>Connected to {account ? 'MetaMask' : connector!.name}</div>
      <button
        className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        onClick={() => account ? setAccount('') : disconnect()}
      >
        Disconnect
      </button>
    </section>
  ) : (
    <section className="flex flex-col gap-6">
      {connectors.map((connector) => connector.ready ? (
        <button
          className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            ' (connecting)'}
        </button>
      ) : (
        <button
          key={connector.id}
          className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          onClick={handleUnsupportMetaMaskConnect}
        >
          MetaMask
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
  const account = useAtomValue(accountAtom)

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    let message = formData.get('message') as string
    if (!message) {
      window.alert('Please enter urlnames')
      return
    }
    message = message.trim()
    setLoading(true)
    let signature
    try {
      if (account) {
        const MMSDK = new MetaMaskSDK()
        const provider = MMSDK.getProvider()
        signature = await provider!.request({
          method: 'personal_sign',
          params: [message, account],
        })
      } else {
        signature = await signMessageAsync({
          message,
        })
      }
    } catch {
      window.alert('Fail to sign')
      setLoading(false)
      return
    }
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

  return isMounted && (isConnected || account) ? (
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
