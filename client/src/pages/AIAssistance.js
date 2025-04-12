import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../services/api';

const AIAssistance = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText, isQuickPrompt = false) => {
    if ((messageText.trim() === '' && !isQuickPrompt) || loading) return;
    
    if (!isQuickPrompt) {
      setInput('');
    }
    
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (isQuickPrompt === 'first-aid') {
        response = await aiService.getFirstAidAssistance(messageText);
      } else if (isQuickPrompt === 'symptoms') {
        response = await aiService.analyzeSymptomsAssistance(messageText);
      } else if (isQuickPrompt === 'report') {
        response = await aiService.interpretHealthReport(messageText);
      } else {
        response = await aiService.getFirstAidAssistance(messageText);
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      if (response.disclaimer) {
        const disclaimerMessage = {
          id: Date.now() + 2,
          text: response.disclaimer,
          sender: 'system',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prevMessages => [...prevMessages, aiMessage, disclaimerMessage]);
      } else {
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      }
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Failed to get a response. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptType) => {
    setInput('');
    
    let modeMessage;
    switch(promptType) {
      case 'first-aid':
        modeMessage = "🔴 First Aid Assistant activated. Please describe the emergency situation:";
        break;
      case 'symptoms':
        modeMessage = "🟡 Symptom Analyzer activated. Please describe your symptoms:";
        break;
      case 'report':
        modeMessage = "🔵 Medical Report Reader activated. Please enter medical terms or report sections to explain:";
        break;
      default:
        return;
    }
    
    const systemMessage = {
      id: Date.now(),
      text: modeMessage,
      sender: 'system',
      promptType: promptType,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, systemMessage]);
    
    setTimeout(() => {
      document.getElementById('message-input').focus();
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const isInPromptMode = lastMessage && lastMessage.sender === 'system' && lastMessage.promptType;
    
    if (isInPromptMode) {
      handleSendMessage(input, lastMessage.promptType);
    } else {
      handleSendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden min-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-primary py-6 px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">AI Health Assistant</h2>
                <p className="text-indigo-100 mt-1">
                  Powered by Groq LLaMA 4 for accurate healthcare information
                </p>
              </div>
              <svg className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="bg-gray-100 p-4 flex justify-center space-x-4">
            <button
              onClick={() => handleQuickPrompt('first-aid')}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300 shadow-md"
            >
              🔴 Quick First Aid
            </button>
            <button
              onClick={() => handleQuickPrompt('symptoms')}
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-300 shadow-md"
            >
              🟡 Analyze Symptoms
            </button>
            <button
              onClick={() => handleQuickPrompt('report')}
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 shadow-md"
            >
              🔵 Read Health Report
            </button>
          </div>
          
          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Ask me anything about health</h3>
                  <p className="mt-1 text-gray-500">
                    Get instant guidance on first aid, symptoms, medical reports, and general health inquiries.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span 
                      onClick={() => handleSendMessage("What common symptoms indicate a cold versus the flu?")}
                      className="text-primary hover:text-indigo-700 cursor-pointer underline"
                    >
                      "What common symptoms indicate a cold versus the flu?"
                    </span>
                    <span 
                      onClick={() => handleSendMessage("How should I treat a minor burn at home?")}
                      className="text-primary hover:text-indigo-700 cursor-pointer underline"
                    >
                      "How should I treat a minor burn at home?"
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user' 
                          ? 'justify-end' 
                          : message.sender === 'system' 
                          ? 'justify-center' 
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-primary text-white'
                            : message.sender === 'system'
                            ? 'bg-gray-100 text-gray-800 border border-gray-200'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="whitespace-pre-line">{message.text}</div>
                        <div 
                          className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="bg-gray-100 p-4 border-t border-gray-200">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex">
              <input
                id="message-input"
                type="text"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              This AI assistant is for informational purposes only. Always consult with a healthcare professional for medical advice.
              {!messages.length && (
                <> Need immediate care? <Link to="/register" className="text-primary hover:underline">Sign up</Link> to book a video consultation with a doctor.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistance;