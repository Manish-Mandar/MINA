import { auth, db } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

/**
 * Helper function to get the current user's auth token
 */
const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  return await currentUser.getIdToken();
};

/**
 * AI Chatbot Services - Client-side implementation
 * Using a free third-party API for medical advice
 */
export const aiService = {
  // First Aid emergency assistance
  getFirstAidAssistance: async (emergency) => {
    try {
      // Mock AI response since we're removing the backend
      return {
        response: `For ${emergency}, here are some first aid steps: 1. Stay calm. 2. Assess the situation. 3. Call emergency services if needed. 4. Provide basic first aid while waiting for help.`,
        disclaimer: "This is a simulated response. In a real emergency, please call emergency services immediately."
      };
    } catch (error) {
      console.error('First Aid Service Error:', error);
      throw error;
    }
  },
  
  analyzeSymptomsAssistance: async (symptoms) => {
    try {
      return {
        response: `Based on your symptoms (${symptoms}), you might be experiencing: common cold, allergies, or fatigue. It's recommended to consult with a healthcare professional for proper diagnosis.`,
        disclaimer: "This is a simulated response. Always consult a medical professional for proper diagnosis."
      };
    } catch (error) {
      console.error('Symptoms Service Error:', error);
      throw error;
    }
  },
  
  interpretHealthReport: async (report) => {
    try {
      return {
        response: `Your health report indicates normal values for most measurements. Your cholesterol and blood pressure appear to be within normal ranges. Continue maintaining a healthy diet and regular exercise.`,
        disclaimer: "This is a simulated response. Please have your health reports reviewed by a medical professional."
      };
    } catch (error) {
      console.error('Health Report Service Error:', error);
      throw error;
    }
  }
};


export const appointmentService = {
  getPatientAppointments: async (patientId) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(appointmentsRef, where("patientId", "==", patientId));
      const querySnapshot = await getDocs(q);
      
      const appointments = [];
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return appointments;
    } catch (error) {
      console.error('Get Patient Appointments Error:', error);
      throw error;
    }
  },
  
  getDoctorAppointments: async (doctorId) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(appointmentsRef, where("doctorId", "==", doctorId));
      const querySnapshot = await getDocs(q);
      
      const appointments = [];
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return appointments;
    } catch (error) {
      console.error('Get Doctor Appointments Error:', error);
      throw error;
    }
  },
  
  createAppointment: async (appointmentData) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const newAppointment = {
        ...appointmentData,
        status: appointmentData.status || 'pending',
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(appointmentsRef, newAppointment);
      return {
        id: docRef.id,
        ...newAppointment
      };
    } catch (error) {
      console.error('Create Appointment Error:', error);
      throw error;
    }
  },
  
  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { 
        status,
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await getDoc(appointmentRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Update Appointment Error:', error);
      throw error;
    }
  }
};