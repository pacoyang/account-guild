import { Provider, ConnectSection, DataSection } from './components'

export default function Home() {
  return (
    <main
      className="min-h-screenw-full max-w-3xl mx-auto py-16 px-8"
    >
      <Provider>
        <div className="flex flex-col gap-6">
          <ConnectSection />
          <DataSection />
        </div>
      </Provider>
    </main>
  )
}
