import { useEffect, useState } from 'react'
import './App.css'
import { ChatbotPage } from './pages/ChatbotPage'
import { RfpWorkspacePage } from './pages/RfpWorkspacePage'

const chatbotPath = '/chatbot'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const isChatbotOpen = path === chatbotPath

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname)
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  const navigate = (nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath)
    }
    setPath(nextPath)
  }

  return (
    <>
      <div className={isChatbotOpen ? 'hidden' : 'block'} aria-hidden={isChatbotOpen}>
        <RfpWorkspacePage onOpenChatbot={() => navigate(chatbotPath)} />
      </div>
      <div className={isChatbotOpen ? 'block' : 'hidden'} aria-hidden={!isChatbotOpen}>
        <ChatbotPage onBack={() => navigate('/')} />
      </div>
    </>
  )
}

export default App
