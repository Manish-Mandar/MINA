import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { aiService, appointmentService } from '../services/api';
import BookAppointment from '../components/BookAppointment';
import VideoCall from '../components/VideoCall';

const AIAssistance = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiMode, setAiMode] = useState('');
  const [processingAi, setProcessingAi] = useState(false);
  
  // Interface mode toggle
  const [activeTab, setActiveTab] = useState('chat');
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (user && user.uid) {
          const response = await appointmentService.getPatientAppointments(user.uid);
          setAppointments(response.appointments || []);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointmentError('Failed to load appointments');
      } finally {
        setLoadingAppointments(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

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
      document.getElementById('message-input')?.focus();
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

  // AI panel handlers (from PatientDashboard)
  const handleAiModeSelect = (mode) => {
    setAiMode(mode);
    setAiResponse('');
    setAiPrompt('');
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    
    if (!aiPrompt.trim() || !aiMode) return;
    
    setProcessingAi(true);
    
    try {
      let response;
      
      switch (aiMode) {
        case 'first-aid':
          response = await aiService.getFirstAidAssistance(aiPrompt);
          break;
        case 'symptoms':
          response = await aiService.analyzeSymptomsAssistance(aiPrompt);
          break;
        case 'report':
          response = await aiService.interpretHealthReport(aiPrompt);
          break;
        default:
          throw new Error('Invalid AI mode');
      }
      
      setAiResponse(response.response || 'No response from AI assistant');
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setAiResponse('Error: Unable to get a response from the AI assistant. Please try again later.');
    } finally {
      setProcessingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with user info (if logged in) */}
        {user && (
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Welcome, {user.displayName}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Access your health assistant and appointments
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to="/ai-assistance/book-appointment"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('chat')}
              className={`${
                activeTab === 'chat'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              AI Chat Assistant
            </button>
            <button
              onClick={() => setActiveTab('panel')}
              className={`${
                activeTab === 'panel'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              AI Health Panel
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('appointments')}
                className={`${
                  activeTab === 'appointments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Appointments
              </button>
            )}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-primary py-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Chat Assistant</h2>
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
                {!messages.length && !user && (
                  <> Need immediate care? <Link to="/register" className="text-primary hover:underline">Sign up</Link> to book a video consultation with a doctor.</>
                )}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'panel' && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI Assistant Panel  */}
            <div className="bg-white overflow-hidden shadow rounded-lg col-span-2">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">AI Health Assistant</h3>
                
                {/* AI Mode Buttons */}
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => handleAiModeSelect('first-aid')}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      aiMode === 'first-aid' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    🔴 First Aid
                  </button>
                  <button
                    onClick={() => handleAiModeSelect('symptoms')}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      aiMode === 'symptoms' 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    }`}
                  >
                    🟡 Disease Symptoms
                  </button>
                  <button
                    onClick={() => handleAiModeSelect('report')}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      aiMode === 'report' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    🔵 Health Report Reading
                  </button>
                </div>
                
                {/* AI Input Form */}
                {aiMode && (
                  <form onSubmit={handleAiSubmit} className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700">
                        {aiMode === 'first-aid' && 'Describe the emergency situation:'}
                        {aiMode === 'symptoms' && 'Describe your symptoms:'}
                        {aiMode === 'report' && 'Enter medical report terms to explain:'}
                      </label>
                      <textarea
                        id="aiPrompt"
                        name="aiPrompt"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder={
                          aiMode === 'first-aid' 
                            ? 'e.g., "How to treat a burn from hot water"' 
                            : aiMode === 'symptoms' 
                            ? 'e.g., "Persistent headache, fever, and fatigue for 3 days"' 
                            : 'e.g., "What does elevated ALT and AST in liver function test mean?"'
                        }
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        disabled={processingAi}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={processingAi}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {processingAi ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Ask AI Assistant'
                      )}
                    </button>
                  </form>
                )}
                
                {/* AI Response */}
                {aiResponse && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-md font-medium text-gray-900 mb-2">AI Assistant Response:</h4>
                    <div className="prose prose-sm text-gray-800 whitespace-pre-line">
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Appointments</h3>
                {!user ? (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Please <Link to="/login" className="text-primary hover:underline">sign in</Link> to view your appointments.</p>
                  </div>
                ) : loadingAppointments ? (
                  <div className="mt-6 flex justify-center">
                    <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
                  </div>
                ) : appointmentError ? (
                  <p className="mt-4 text-sm text-red-600">{appointmentError}</p>
                ) : appointments.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">You have no upcoming appointments.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-200">
                    {appointments
                      .filter(appointment => appointment.status === 'scheduled')
                      .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
                      .slice(0, 5)
                      .map((appointment) => (
                        <li key={appointment.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.date} at {appointment.time}
                              </p>
                              <p className="text-sm text-gray-500">{appointment.reason}</p>
                            </div>
                            <Link
                              to={`/ai-assistance/video-call/${appointment.id}`}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Join Call
                            </Link>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && user && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">All Appointments</h3>
              {loadingAppointments ? (
                <div className="mt-6 flex justify-center">
                  <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
                </div>
              ) : appointmentError ? (
                <p className="mt-4 text-sm text-red-600">{appointmentError}</p>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="mt-4 text-sm text-gray-500">You have no appointments scheduled.</p>
                  <div className="mt-5">
                    <Link
                      to="/ai-assistance/book-appointment"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Book Your First Appointment
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-gray-200">
                    {appointments
                      .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
                      .map((appointment) => (
                        <li key={appointment.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.date} at {appointment.time}
                              </p>
                              <div className="flex items-center mt-1">
                                <span 
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    appointment.status === 'scheduled' 
                                      ? 'bg-green-100 text-green-800' 
                                      : appointment.status === 'completed' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                                <p className="ml-2 text-sm text-gray-500">{appointment.reason}</p>
                              </div>
                            </div>
                            {appointment.status === 'scheduled' && (
                              <Link
                                to={`/ai-assistance/video-call/${appointment.id}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Join Call
                              </Link>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                  <div className="mt-6 text-center">
                    <Link
                      to="/ai-assistance/book-appointment"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Book New Appointment
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* video calls */}
        <Routes>
          <Route path="book-appointment" element={<BookAppointment user={user} />} />
          <Route path="video-call/:appointmentId" element={<VideoCall user={user} />} />
        </Routes>
      </div>
    </div>
  );
};

export default AIAssistance;