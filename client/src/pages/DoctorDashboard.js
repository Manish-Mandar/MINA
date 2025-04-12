import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { appointmentService, messageService } from '../services/api';
import { format } from 'date-fns';

import VideoCall from '../components/VideoCall';

const DoctorDashboard = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (user && user.uid) {
          const response = await appointmentService.getDoctorAppointments(user.uid);
        
          setAppointments(response || []);
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

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (user && user.uid) {
          const messagesData = await messageService.getDoctorMessages(user.uid);
          
          setMessages(Array.isArray(messagesData) ? messagesData : []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessagesError('Failed to load messages');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, status);
      
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status } 
          : appointment
      ));
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      if (!user || !user.uid) {
        console.error('User not found');
        return;
      }
      
      await messageService.markAsRead(user.uid, messageId);
      
      setMessages(messages.map(message => 
        message.id === messageId 
          ? { ...message, read: true } 
          : message
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'MMM dd, yyyy h:mm a');
      }
      
      return format(new Date(timestamp), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getAppointmentDetails = (appointmentId) => {
    if (!appointmentId) return null;
    
    const appointment = appointments.find(app => app.id === appointmentId);
    if (!appointment) return null;
    
    return {
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason
    };
  };

  const unreadMessagesCount = messages.filter(message => !message.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Doctor Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, Dr. {user?.displayName}
            </p>
          </div>
        </div>

        {/* Messages Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Patient Messages
              {unreadMessagesCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadMessagesCount} new
                </span>
              )}
            </h3>
          </div>
          <div className="mt-3 bg-white shadow overflow-hidden sm:rounded-md">
            {messagesLoading ? (
              <div className="py-10 flex justify-center">
                <div className="w-12 h-12 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
              </div>
            ) : messagesError ? (
              <p className="py-6 px-4 text-sm text-red-600">{messagesError}</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {messages.length > 0 ? messages
                  .sort((a, b) => {
                    if (a.read !== b.read) return a.read ? 1 : -1;
                    return b.createdAt?.seconds - a.createdAt?.seconds || 0;
                  })
                  .map((message) => (
                    <li key={message.id} className={`hover:bg-gray-50 ${!message.read ? 'bg-blue-50' : ''}`}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!message.read ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  From: {message.patientName || 'Patient'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(message.createdAt)}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {message.content}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {message.appointmentId && (
                                  <>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {message.subject || "Related to appointment"}
                                    </span>
                                    {getAppointmentDetails(message.appointmentId) && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        Appt: {getAppointmentDetails(message.appointmentId).date} at {getAppointmentDetails(message.appointmentId).time}
                                      </span>
                                    )}
                                  </>
                                )}
                                {!message.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(message.id)}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  >
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )) : (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">
                      No messages from patients yet.
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
          <div className="mt-3 bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="w-12 h-12 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <p className="py-6 px-4 text-sm text-red-600">{error}</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {appointments
                  .filter(appointment => {
                    const today = new Date().toISOString().split('T')[0];
                    return appointment.date === today && appointment.status === 'scheduled';
                  })
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment) => (
                    <li key={appointment.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.time}
                              </p>
                              <p className="text-sm text-gray-500">
                                Patient ID: {appointment.patientId}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              to={`/doctor-dashboard/video-call/${appointment.id}`}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Start Call
                            </Link>
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Reason: {appointment.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                {appointments.filter(appointment => {
                  const today = new Date().toISOString().split('T')[0];
                  return appointment.date === today && appointment.status === 'scheduled';
                }).length === 0 && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                      No appointments scheduled for today.
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
          <div className="mt-3 bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="w-12 h-12 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <p className="py-6 px-4 text-sm text-red-600">{error}</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {appointments
                  .filter(appointment => {
                    const today = new Date().toISOString().split('T')[0];
                    return appointment.date > today && appointment.status === 'scheduled';
                  })
                  .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time))
                  .map((appointment) => (
                    <li key={appointment.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.date} at {appointment.time}
                              </p>
                              <p className="text-sm text-gray-500">
                                Patient ID: {appointment.patientId}
                              </p>
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Reason: {appointment.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                {appointments.filter(appointment => {
                  const today = new Date().toISOString().split('T')[0];
                  return appointment.date > today && appointment.status === 'scheduled';
                }).length === 0 && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                      No upcoming appointments scheduled.
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Nested Routes */}
        <Routes>
          <Route path="video-call/:appointmentId" element={<VideoCall user={user} />} />
        </Routes>
      </div>
    </div>
  );
};

export default DoctorDashboard;