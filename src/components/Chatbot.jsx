import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiX, FiSend, FiMinimize2 } from 'react-icons/fi';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hello! I'm your ThemeHub assistant. How can I help you today? I can help you find templates, navigate the site, or answer questions about our services.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Knowledge base for chatbot responses
  const knowledgeBase = {
    templates: {
      keywords: ['template', 'templates', 'theme', 'themes', 'design', 'website'],
      response: "We have a wide variety of templates! You can browse them at our Templates page. Would you like me to show you categories like WordPress, React, HTML/CSS, or Landing Pages?",
      link: '/templates'
    },
    categories: {
      keywords: ['category', 'categories', 'type', 'kind', 'what types'],
      response: "We offer templates in various categories: WordPress Themes, React Templates, HTML/CSS Templates, Landing Pages, Dashboards, E-Commerce, and more. Check out our Categories page!",
      link: '/allcategories'
    },
    blog: {
      keywords: ['blog', 'article', 'post', 'news', 'updates'],
      response: "Our blog features the latest updates, tutorials, and design tips. Visit our Blog section to read articles and stay updated!",
      link: '/blog'
    },
    contact: {
      keywords: ['contact', 'support', 'help', 'email', 'reach', 'get in touch'],
      response: "You can reach us through our Contact page. We're here to help with any questions or support you need!",
      link: '/contact'
    },
    pricing: {
      keywords: ['price', 'pricing', 'cost', 'how much', 'buy', 'purchase'],
      response: "Our templates have various pricing options. Browse our Templates page to see individual prices. Each template shows its price clearly.",
      link: '/templates'
    },
    wordpress: {
      keywords: ['wordpress', 'wp'],
      response: "We have excellent WordPress themes! Check out our WordPress category for premium, customizable themes perfect for any website.",
      link: '/wordpress'
    },
    react: {
      keywords: ['react', 'reactjs'],
      response: "We offer modern React templates! Visit our React Templates section to find the perfect template for your project.",
      link: '/react'
    },
    htmlcss: {
      keywords: ['html', 'css', 'html/css', 'static'],
      response: "Browse our HTML/CSS templates collection! Perfect for static websites and custom projects.",
      link: '/htmlcss'
    },
    cart: {
      keywords: ['cart', 'shopping cart', 'checkout', 'buy'],
      response: "You can add templates to your cart and checkout easily. Visit your Cart to see your selected items!",
      link: '/cart'
    },
    register: {
      keywords: ['register', 'sign up', 'account', 'create account'],
      response: "Create an account to get started! Registration is quick and gives you access to downloads and more features.",
      link: '/register'
    },
    login: {
      keywords: ['login', 'sign in', 'log in'],
      response: "Sign in to your account to access your downloads and manage your profile.",
      link: '/login'
    }
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for matches in knowledge base
    for (const [key, data] of Object.entries(knowledgeBase)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          text: data.response,
          link: data.link,
          hasLink: true
        };
      }
    }

    // Default responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        text: "Hello! I'm here to help you navigate ThemeHub. You can ask me about templates, categories, blog posts, or how to contact us.",
        hasLink: false
      };
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return {
        text: "You're welcome! Is there anything else I can help you with?",
        hasLink: false
      };
    }

    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return {
        text: "Goodbye! Feel free to come back anytime if you need help. Happy browsing!",
        hasLink: false
      };
    }

    // Generic helpful response
    return {
      text: "I can help you with:\n• Finding templates and themes\n• Navigating categories\n• Accessing our blog\n• Contact information\n• Pricing information\n\nWhat would you like to know more about?",
      hasLink: false
    };
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = getBotResponse(inputValue);
      const botMessage = {
        type: 'bot',
        text: botResponse.text,
        link: botResponse.link,
        hasLink: botResponse.hasLink,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleLinkClick = (link) => {
    navigate(link);
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="chatbot-toggle"
          aria-label="Open chatbot"
        >
          <FiMessageCircle className="w-6 h-6" />
          <span className="chatbot-pulse"></span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">
                <FiMessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="chatbot-title">ThemeHub Assistant</h3>
                <p className="chatbot-subtitle">Online • Ready to help</p>
              </div>
            </div>
            <div className="chatbot-actions">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="chatbot-btn-icon"
                aria-label="Minimize"
              >
                <FiMinimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="chatbot-btn-icon"
                aria-label="Close"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chatbot-message ${msg.type}`}>
                    {msg.type === 'bot' && (
                      <div className="chatbot-avatar-small">
                        <FiMessageCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div className="chatbot-message-content">
                      <p>{msg.text}</p>
                      {msg.hasLink && msg.link && (
                        <button
                          onClick={() => handleLinkClick(msg.link)}
                          className="chatbot-link-btn"
                        >
                          Visit {msg.link === '/templates' ? 'Templates' : 
                                  msg.link === '/allcategories' ? 'Categories' :
                                  msg.link === '/blog' ? 'Blog' :
                                  msg.link === '/contact' ? 'Contact' :
                                  msg.link === '/wordpress' ? 'WordPress Templates' :
                                  msg.link === '/react' ? 'React Templates' :
                                  msg.link === '/htmlcss' ? 'HTML/CSS Templates' :
                                  msg.link === '/cart' ? 'Cart' :
                                  msg.link === '/register' ? 'Register' :
                                  msg.link === '/login' ? 'Login' : 'Page'} →
                        </button>
                      )}
                      <span className="chatbot-timestamp">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chatbot-message bot">
                    <div className="chatbot-avatar-small">
                      <FiMessageCircle className="w-4 h-4" />
                    </div>
                    <div className="chatbot-message-content">
                      <div className="chatbot-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="chatbot-input-area">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="chatbot-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="chatbot-send-btn"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chatbot Styles */}
      <style>{`
        .chatbot-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #04733c;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(4, 115, 60, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: all 0.3s ease;
        }

        .chatbot-toggle:hover {
          background: #035a2f;
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(4, 115, 60, 0.5);
        }

        .chatbot-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #04733c;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        .chatbot-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .chatbot-window.minimized {
          height: 60px;
        }

        .chatbot-header {
          background: #04733c;
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chatbot-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chatbot-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatbot-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        .chatbot-subtitle {
          font-size: 12px;
          opacity: 0.9;
          margin: 0;
        }

        .chatbot-actions {
          display: flex;
          gap: 8px;
        }

        .chatbot-btn-icon {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .chatbot-btn-icon:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f9fafb;
        }

        .chatbot-message {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .chatbot-message.user {
          flex-direction: row-reverse;
        }

        .chatbot-message.user .chatbot-message-content {
          background: #04733c;
          color: white;
          border-radius: 16px 16px 4px 16px;
        }

        .chatbot-message.bot .chatbot-message-content {
          background: white;
          color: #000;
          border-radius: 16px 16px 16px 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .chatbot-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #04733c;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chatbot-message-content {
          max-width: 75%;
          padding: 12px 16px;
        }

        .chatbot-message-content p {
          margin: 0 0 8px 0;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .chatbot-link-btn {
          background: rgba(4, 115, 60, 0.1);
          color: #04733c;
          border: 1px solid #04733c;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s;
        }

        .chatbot-link-btn:hover {
          background: #04733c;
          color: white;
        }

        .chatbot-timestamp {
          font-size: 10px;
          opacity: 0.6;
          display: block;
          margin-top: 4px;
        }

        .chatbot-typing {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .chatbot-typing span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #04733c;
          animation: typing 1.4s infinite;
        }

        .chatbot-typing span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .chatbot-typing span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .chatbot-input-area {
          padding: 16px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }

        .chatbot-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .chatbot-input:focus {
          border-color: #04733c;
        }

        .chatbot-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #04733c;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .chatbot-send-btn:hover:not(:disabled) {
          background: #035a2f;
        }

        .chatbot-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .chatbot-window {
            width: calc(100% - 32px);
            height: calc(100vh - 100px);
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>
    </>
  );
}
