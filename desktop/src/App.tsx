import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

function App() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    const message = await invoke<string>('greet', { name })
    setGreetMsg(message)
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="mb-8 text-4xl font-bold">Welcome to Tauri</h1>

      <form
        className="mb-4 flex gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          greet()
        }}
      >
        <input
          id="greet-input"
          className="flex-1 rounded-md border px-4 py-2"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          value={name}
        />
        <Button type="submit">Greet</Button>
      </form>
      {greetMsg && <p className="text-lg">{greetMsg}</p>}
    </main>
  )
}

export default App
