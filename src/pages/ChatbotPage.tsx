import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Button, Input, Spinner, type InputOnChangeData } from '@fluentui/react-components'
import { api, getErrorMessage } from '../lib/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type ChatbotPageProps = {
  onBack: () => void
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12h14m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function FormattedMessage({ content, role }: ChatMessage) {
  if (role === 'user') return <p className="whitespace-pre-wrap">{content}</p>

  const normalized = normalizeAssistantContent(content)
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
        const bulletLines = lines.filter((line) => line.startsWith('- '))

        if (bulletLines.length === lines.length) {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {bulletLines.map((line, lineIndex) => (
                <li key={lineIndex} className="grid grid-cols-[auto_1fr] gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-blue-500" />
                  <span>{formatInlineText(line.slice(2))}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <div key={index} className="space-y-2">
            {lines.map((line, lineIndex) => (
              line.startsWith('- ') ? (
                <div key={lineIndex} className="grid grid-cols-[auto_1fr] gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-blue-500" />
                  <span>{formatInlineText(line.slice(2))}</span>
                </div>
              ) : (
                <p key={lineIndex}>{formatInlineText(line)}</p>
              )
            ))}
          </div>
        )
      })}
    </div>
  )
}

function normalizeAssistantContent(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\s+-\s+(?=\*\*?[A-Za-z0-9]|[A-Za-z0-9])/g, '\n- ')
    .replace(/:\s*\n- /g, ':\n- ')
    .replace(/\.\s+(?=(These details|If you need|Sources?:|References?:)\b)/g, '.\n\n')
    .trim()
}

function formatInlineText(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-black text-slate-950">{part.slice(2, -2)}</strong>
    }

    return <span key={index}>{part}</span>
  })
}

export function ChatbotPage({ onBack }: ChatbotPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending])

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt || isSending) return

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: prompt }])
    setQuestion('')
    setIsSending(true)

    try {
      const response = await api<{ answer?: string; response?: string; message?: string }>('POST', '/api/chatbot', {
        query: prompt,
        question: prompt,
      })
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer ?? response.response ?? response.message ?? 'No answer was returned.',
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: getErrorMessage(error) },
      ])
    } finally {
      setIsSending(false)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const startWithPrompt = (prompt: string) => {
    setQuestion(prompt)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const suggestions = [
    'Summarize the key RFP requirements',
    'Find compliance gaps in the documents',
    'List deadlines and submission items',
  ]

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-950">
      <header className="z-20 flex h-16 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-950 px-4 text-white shadow-sm sm:px-7">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Back
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-500 text-sm font-black text-white">AI</span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold sm:text-lg">RFP Chatbot</h1>
            <p className="truncate text-xs font-medium text-slate-400">Ask grounded questions across ingested documents</p>
          </div>
        </div>
        <span className="ml-auto hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200 sm:inline-flex">
          Ready
        </span>
      </header>

      <main className="flex min-h-0 flex-1 bg-slate-100">
        <section className="flex min-h-0 w-full flex-1 flex-col">
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 lg:px-12">
            {!hasMessages ? (
              <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center py-10 text-center">
                <div className="mb-5 flex size-14 items-center justify-center rounded-lg bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/20">
                  AI
                </div>
                <h2 className="text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  What do you need from this RFP?
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Ask for summaries, clause checks, deadlines, compliance gaps, or answer-ready content from the ingested documents.
                </p>
                <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => startWithPrompt(suggestion)}
                      className="min-h-24 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-bold leading-6 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' ? (
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-black text-white">
                        AI
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[min(46rem,86%)] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <FormattedMessage {...message} />
                    </div>
                  </div>
                ))}
                {isSending ? (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Spinner size="tiny" />
                    <span>Generating answer...</span>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={submitQuestion} className="border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] sm:px-8">
            <div className="mx-auto flex max-w-4xl gap-3 rounded-lg border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <Input
                ref={inputRef}
                aria-label="Question"
                className="min-w-0 flex-1"
                placeholder="Ask about requirements, risks, scoring, or deadlines"
                value={question}
                onChange={(_: ChangeEvent<HTMLInputElement>, eventData: InputOnChangeData) => setQuestion(eventData.value)}
              />
              <Button appearance="primary" type="submit" disabled={!question.trim() || isSending}>
                <span className="inline-flex items-center gap-2">
                  {isSending ? null : <SendIcon />}
                  {isSending ? 'Sending' : 'Send'}
                </span>
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
