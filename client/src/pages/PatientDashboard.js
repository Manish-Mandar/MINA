import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { aiService, appointmentService } from '../services/api';

import BookAppointment from '../components/BookAppointment';
import VideoCall from '../components/VideoCall';

const PatientDashboard = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiMode, setAiMode] = useState(''); 
  const [processingAi, setProcessingAi] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (user && user.uid) {
          const response = await appointmentService.getPatientAppointments(user.uid);
          setAppointments(response.appointments || []);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Patient Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.displayName}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="book-appointment"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Book Appointment
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* AI Assistant Section */}
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
              {loading ? (
                <div className="mt-6 flex justify-center">
                  <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <p className="mt-4 text-sm text-red-600">{error}</p>
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
                            to={`/patient-dashboard/video-call/${appointment.id}`}
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

        {/* Nested Routes */}
        <Routes>
          <Route path="book-appointment" element={<BookAppointment user={user} />} />
          <Route path="video-call/:appointmentId" element={<VideoCall user={user} />} />
        </Routes>
      </div>
    </div>
  );
};

export default PatientDashboard;