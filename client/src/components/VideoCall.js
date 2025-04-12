import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Peer from 'simple-peer';

const VideoCall = ({ user }) => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, connecting, connected, error, ended
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  
  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
        
        if (!appointmentDoc.exists()) {
          setError('Appointment not found');
          setLoading(false);
          return;
        }
        
        const appointmentData = {
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        };
        
        // Check if user is authorized to join this call
        const isDoctor = user.uid === appointmentData.doctorId;
        const isPatient = user.uid === appointmentData.patientId;
        
        if (!isDoctor && !isPatient) {
          setError('You are not authorized to join this call');
          setLoading(false);
          return;
        }
        
        setAppointment(appointmentData);
        
        if (appointmentData.status === 'scheduled') {
          await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'in-progress',
            updatedAt: new Date().toISOString()
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        setError('Failed to load appointment details');
        setLoading(false);
      }
    };
    
    fetchAppointment();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [appointmentId, user]);
  
  useEffect(() => {
    if (!appointment || loading) return;
    
    const initWebRTC = async () => {
      try {
        setCallStatus('connecting');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setLocalStream(stream);
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        const peer = new Peer({
          initiator: user.uid === appointment.patientId,
          trickle: false,
          stream: stream
        });
        
        peer.on('signal', data => {
         
          console.log('Signal data to send:', data);
            });
        
        peer.on('stream', stream => {
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setCallStatus('connected');
        });
        
        peer.on('error', err => {
          console.error('Peer error:', err);
          setCallStatus('error');
          setError('Video call connection error');
        });
        
        peerRef.current = peer;
       }
        catch (err) {
        console.error('WebRTC initialization error:', err);
        setCallStatus('error');
        setError('Failed to access camera and microphone');
      }
    };
    
    initWebRTC();
  }, [appointment, loading, user]);
  
  const endCall = async () => {

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
    
    setCallStatus('ended');
    
    navigate(user.uid === appointment?.doctorId 
      ? '/doctor-dashboard' 
      : '/patient-dashboard'
    );
  };
  
  useEffect(() => {
    if (callStatus === 'error') {
     
      const timer = setTimeout(() => {
       
        if (window.confirm('Connection error. Would you like to try reconnecting?')) {
          window.location.reload();
        } else {
          endCall();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [callStatus]);
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Initializing video call...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg w-full">
          <h3 className="text-lg font-medium text-red-600">Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Call header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-white font-medium">
            {user.uid === appointment?.doctorId 
              ? `Call with Patient: ${appointment?.patientId}` 
              : `Call with Dr. ${appointment?.doctorId}`
            }
          </span>
          
          <span className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${
            callStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : callStatus === 'connecting' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {callStatus === 'connected' 
              ? 'Connected' 
              : callStatus === 'connecting' 
              ? 'Connecting...'
              : 'Connection Issue'
            }
          </span>
        </div>
        
        <button
          onClick={endCall}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          End Call
        </button>
      </div>
      
      {/* Video streams */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Remote video (large) */}
        <div className="flex-1 bg-black relative">
          {remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-t-4 border-white border-solid rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-white">Waiting for other participant...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Local video (small) */}
        <div className="md:absolute md:bottom-4 md:right-4 md:w-1/4 md:max-w-xs h-1/4 md:h-auto bg-gray-800 border-2 border-gray-700">
          {localStream ? (
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-white">Loading your video...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Call controls */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-center space-x-4">
        <button
          onClick={() => {
            if (localStream) {
              const audioTrack = localStream.getAudioTracks()[0];
              if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
               
                setLocalStream(prev => ({ ...prev }));
              }
            }
          }}
          className={`p-3 rounded-full ${
            localStream?.getAudioTracks()[0]?.enabled !== false 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {localStream?.getAudioTracks()[0]?.enabled !== false ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
        </button>
        
        <button
          onClick={() => {
            if (localStream) {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
               
                setLocalStream(prev => ({ ...prev }));
              }
            }
          }}
          className={`p-3 rounded-full ${
            localStream?.getVideoTracks()[0]?.enabled !== false 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {localStream?.getVideoTracks()[0]?.enabled !== false ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            )}
          </svg>
        </button>
        
        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;