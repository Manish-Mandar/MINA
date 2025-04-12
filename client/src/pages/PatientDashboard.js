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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Patient Dashboard
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Welcome back, {user?.displayName}
          </p>
          
          <div className="mt-10 pb-12 bg-white sm:pb-16">
            <div className="relative">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto">
                  <p className="text-lg text-gray-500">
                    All your health management features have been moved to our AI Assistance page for a better integrated experience.
                  </p>
                  
                  <div className="mt-8">
                    <Link
                      to="/ai-assistance"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Go to AI Assistance
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;