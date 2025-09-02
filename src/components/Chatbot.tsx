import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWeb3 } from '../contexts/Web3Context'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your BlockCert assistant. I can help you with uploading certificates, verifying documents, connecting your wallet, and navigating the platform. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentUser } = useAuth()
  const { isConnected } = useWeb3()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // Wallet-related queries
    if (message.includes('wallet') || message.includes('metamask') || message.includes('connect')) {
      if (isConnected) {
        return 'Great! Your wallet is already connected. You can now upload certificates to the blockchain. Would you like me to guide you through the upload process?'
      } else {
        return 'To connect your wallet, click the "Connect Wallet" button in the top navigation. Make sure you have MetaMask installed and are on the Sepolia testnet. Need help with MetaMask setup?'
      }
    }
    
    // Upload-related queries
    if (message.includes('upload') || message.includes('certificate') || message.includes('document')) {
      if (!currentUser) {
        return 'To upload certificates, you need to be logged in first. Please sign up or log in, then connect your wallet to get started.'
      } else if (!isConnected) {
        return 'To upload certificates, you need to connect your MetaMask wallet first. This ensures your certificates are securely stored on the blockchain.'
      } else {
        return 'Perfect! You can upload certificates by going to the Upload page. Supported formats are PDF and images. Each certificate will be hashed and stored on the Ethereum blockchain for verification.'
      }
    }
    
    // Verification queries
    if (message.includes('verify') || message.includes('check') || message.includes('authentic')) {
      return 'You can verify any certificate using our verification page. Just enter the certificate hash or scan the QR code. No login required for verification!'
    }
    
    // Account/Login queries
    if (message.includes('login') || message.includes('account') || message.includes('register')) {
      if (currentUser) {
        return `You're already logged in as ${currentUser.displayName || currentUser.email}. You can access your dashboard to manage your certificates.`
      } else {
        return 'You can create an account using email/password, Google, or Facebook. Registration is free and gives you access to upload and manage certificates.'
      }
    }
    
    // Dashboard queries
    if (message.includes('dashboard') || message.includes('manage')) {
      if (!currentUser) {
        return 'To access your dashboard, please log in first. Your dashboard shows all your uploaded certificates and their blockchain status.'
      } else {
        return 'Your dashboard shows all your certificates, their verification status, QR codes, and blockchain transaction details. You can also download certificates with verification seals.'
      }
    }
    
    // Blockchain/Technical queries
    if (message.includes('blockchain') || message.includes('ethereum') || message.includes('hash')) {
      return 'We use Ethereum blockchain (Sepolia testnet) to store certificate hashes. This ensures immutable proof of authenticity. Each certificate gets a unique hash that can\'t be tampered with.'
    }
    
    // QR Code queries
    if (message.includes('qr') || message.includes('code')) {
      return 'Every uploaded certificate gets a unique QR code that links to its blockchain record. You can download the QR code or include it in your certificate for easy verification.'
    }
    
    // General help
    if (message.includes('help') || message.includes('how') || message.includes('guide')) {
      return 'Here\'s what I can help you with:\n• Connecting your MetaMask wallet\n• Uploading certificates to blockchain\n• Verifying certificate authenticity\n• Managing your account and certificates\n• Understanding blockchain features\n\nWhat would you like to know more about?'
    }
    
    // Default responses
    const defaultResponses = [
      'I can help you with wallet connection, certificate uploads, verification, and account management. What specific task would you like assistance with?',
  'Feel free to ask me about any feature of BlockCert! I\'m here to help you navigate the platform.',
      'I\'m here to assist with your blockchain certificate needs. Try asking about uploading, verifying, or managing certificates.'
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} className="animate-pulse" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-96 bg-slate-900 border-2 border-indigo-500/30 rounded-xl shadow-2xl shadow-indigo-500/20 backdrop-blur-sm flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-indigo-500/30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-indigo-400/30">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">BlockCert Assistant</h3>
                  <p className="text-xs text-indigo-400">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-2 ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 ring-blue-400/30' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 ring-purple-400/30'
                    }`}>
                      {message.sender === 'user' ? (
                        <User size={12} className="text-white" />
                      ) : (
                        <Bot size={12} className="text-white" />
                      )}
                    </div>
                    <div className={`px-3 py-2 rounded-lg shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                        : 'bg-gradient-to-r from-slate-800 to-slate-700 text-white border border-indigo-500/30'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-purple-400/30">
                      <Bot size={12} className="text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-2 rounded-lg border border-indigo-500/30 shadow-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-indigo-500/30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-indigo-300/50 text-sm shadow-inner"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="px-3 py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot
