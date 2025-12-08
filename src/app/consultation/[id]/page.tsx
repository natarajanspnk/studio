// server component dont change

import { collection, getDocs } from 'firebase/firestore'; 
import { firestore } from '@/firebase';
import ConsultationClient from './client'; // Import the Client Component

export async function generateStaticParams() {
  const callsCollectionRef = collection(firestore, 'calls');
  const snapshot = await getDocs(callsCollectionRef);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id, 
  }));
}
// 🔑 FIX: Define the expected props interface explicitly
interface ConsultationPageProps {
  params: {
    id: string;
  };
}

// This is the Server Component wrapper
export default function ConsultationPage({ 
    params, 
}: ConsultationPageProps) {
    // Extracts the ID from the URL parameters
    const callId = params.id; 

    // Renders the Client Component, passing the URL ID as a prop
    return (
        <ConsultationClient callId={callId} /> 
    );
}