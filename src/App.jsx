import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Emesh from './components/Emesh'

function App() {
  const [count, setCount] = useState(0)

  return (
   <>
   <Emesh/>
   </>
  )
}

export default App
