
'use client';

import { useEffect, useRef, useState, useMemo, use } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConsultationPreview } from './preview';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import {
  joinCall,
  startCall,
} from '@/lib/webrtc';
import {
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  addDoc,
  Unsubscribe,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';

type Message = {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
};

type CallData = {
    patientPresent?: boolean;
    doctorPresent?: boolean;
    patientName?: string;
    doctorName?: string;
}

export default function ConsultationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: callId } = use(params);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callJoined, setCallJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
  const [appointment, setAppointment] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const unsubscribeListenersRef = useRef<(() => void)[]>([]);

  // Determine user role and get appointment
  const patientDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'patients', user.uid) : null), [user, firestore]);
  const doctorDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'doctors', user.uid) : null), [user, firestore]);

  useEffect(() => {
    const determineRoleAndGetAppointment = async () => {
        if (!user || !firestore) return;
        
        let foundRole: 'patient' | 'doctor' | null = null;
        let appointmentDoc;
        
        try {
            const doctorDocSnap = await getDoc(doctorDocRef!);
            if (doctorDocSnap.exists()) {
                foundRole = 'doctor';
                const appointmentRef = doc(firestore, 'doctors', user.uid, 'appointments', callId);
                appointmentDoc = await getDoc(appointmentRef);
            } else {
                const patientDocSnap = await getDoc(patientDocRef!);
                if (patientDocSnap.exists()) {
                    foundRole = 'patient';
                    const appointmentRef = doc(firestore, 'patients', user.uid, 'appointments', callId);
                    appointmentDoc = await getDoc(appointmentRef);
                }
            }
            
            setUserRole(foundRole);
            if (appointmentDoc?.exists()) {
                setAppointment(appointmentDoc.data());
            }
        } catch (error) {
            console.error("Error determining role or fetching appointment: ", error);
        }
    }
    
    determineRoleAndGetAppointment();

  }, [user, firestore, callId, doctorDocRef, patientDocRef]);

  // Presence and Notification Logic
  const callDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'calls', callId) : null), [firestore, callId]);
  const callDataRef = useRef<CallData | null>(null);

  useEffect(() => {
    if (!callDocRef || !userRole) return;
  
    const unsubscribe = onSnapshot(callDocRef, (snapshot) => {
      const newCallData = snapshot.data() as CallData;
      const oldCallData = callDataRef.current;
  
      if (oldCallData) { // Only show notifications after initial state is set
        if (userRole === 'doctor' && newCallData.patientPresent && !oldCallData.patientPresent) {
          toast({ title: `${newCallData.patientName || 'Patient'} has joined the call.` });
        } else if (userRole === 'doctor' && !newCallData.patientPresent && oldCallData.patientPresent) {
          toast({ title: `${newCallData.patientName || 'Patient'} has left the call.`, variant: 'destructive' });
        }
  
        if (userRole === 'patient' && newCallData.doctorPresent && !oldCallData.doctorPresent) {
          toast({ title: `${newCallData.doctorName || 'Doctor'} has joined the call.` });
        } else if (userRole === 'patient' && !newCallData.doctorPresent && oldCallData.doctorPresent) {
          toast({ title: `${newCallData.doctorName || 'Doctor'} has left the call.`, variant: 'destructive' });
        }
      }
  
      callDataRef.current = newCallData;
    });
  
    return () => unsubscribe();
  }, [callDocRef, userRole, toast]);
  
  const updatePresence = (isPresent: boolean) => {
    if (!callDocRef || !userRole || !user?.displayName) return;
  
    const presenceUpdate: Partial<CallData> = isPresent
      ? {
          [`${userRole}Present`]: true,
          [`${userRole}Name`]: user.displayName,
        }
      : {
          [`${userRole}Present`]: false,
        };
  
    setDocumentNonBlocking(callDocRef, presenceUpdate, { merge: true });
  };
  
  // Handle user leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callJoined) {
        updatePresence(false);
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final attempt to set presence to false on component unmount
      if (callJoined) {
        updatePresence(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callJoined, userRole]);


  // --- WebRTC Logic ---
  useEffect(() => {
    if (callJoined && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callJoined]);

  useEffect(() => {
    if (callJoined && remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callJoined]);

  const handleJoinCall = async (stream: MediaStream) => {
    setLocalStream(stream);
    setCallJoined(true);

    if (!firestore || !userRole) {
      console.error('Firestore or user role is not available');
      return;
    }
    
    updatePresence(true);

    // Clean up previous listeners
    hangUp();

    peerConnectionRef.current = new RTCPeerConnection(undefined);
    
    peerConnectionRef.current.ontrack = (event) => {
        const newRemoteStream = event.streams[0];
        setRemoteStream(newRemoteStream);
    };

    if (!callDocRef) return;
    const callDoc = await getDoc(callDocRef);
    
    const onIceCandidate = (candidate: RTCIceCandidate) => {
        const candidatesCollection = collection(firestore, 'calls', callId, userRole === 'doctor' ? 'answerCandidates' : 'offerCandidates');
        addDoc(candidatesCollection, candidate.toJSON());
    }

    if (callDoc.exists() && callDoc.data().offer && userRole === 'doctor') {
      const cleanup = await joinCall(peerConnectionRef.current, firestore, callId, stream, onIceCandidate);
      unsubscribeListenersRef.current.push(cleanup);
    } else {
      const cleanup = await startCall(peerConnectionRef.current, firestore, callId, stream, onIceCandidate);
      unsubscribeListenersRef.current.push(cleanup);
    }
  };

  const hangUp = () => {
    unsubscribeListenersRef.current.forEach(unsub => unsub());
    unsubscribeListenersRef.current = [];

    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }
  }

  const endCall = () => {
    updatePresence(false);

    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);

    hangUp();
    
    if (userRole === 'doctor') {
      window.location.href = '/dashboard/staff';
    } else {
      window.location.href = '/dashboard/consultations';
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
      return () => {
        hangUp();
        localStream?.getTracks().forEach(track => track.stop());
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // --- End WebRTC Logic ---


  // --- Chat Logic ---
  const messagesCollectionRef = useMemoFirebase(
    () =>
      firestore && callId
        ? collection(firestore, 'calls', callId, 'messages')
        : null,
    [firestore, callId]
  );

  const messagesQuery = useMemoFirebase(
    () =>
      messagesCollectionRef
        ? query(messagesCollectionRef, orderBy('timestamp', 'asc'))
        : null,
    [messagesCollectionRef]
  );

  const { data: messages } = useCollection<Message>(messagesQuery, { enabled: isChatOpen });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !messagesCollectionRef) return;

    const messageData = {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      timestamp: serverTimestamp(),
    };

    addDocumentNonBlocking(messagesCollectionRef, messageData);
    setNewMessage('');
  };
  // --- End Chat Logic ---


  // --- Media Controls ---
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };
  // --- End Media Controls ---


  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const isLoading = isUserLoading || !userRole;

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><LoadingSpinner /></div>
  }

  if (!callJoined) {
    return (
      <ConsultationPreview
        onJoinCall={handleJoinCall}
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        setIsMicOn={setIsMicOn}
        setIsCameraOn={setIsCameraOn}
      />
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white">
      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 transition-all duration-300")}>
          <div className="grid h-full flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-2">
            <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-900">
              <video
                ref={remoteVideoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
              />
              {!remoteStream?.active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4">
                   <div className="flex flex-col items-center gap-2 text-center">
                    <LoadingSpinner className='text-white' />
                    <p className="mt-2 text-white/70">
                        Waiting for the other person to join...
                    </p>
                   </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
                {userRole === 'patient' ? appointment?.doctorName : appointment?.patientName}
              </div>
            </div>

            <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-900">
              <video
                ref={localVideoRef}
                className="h-full w-full -scale-x-100 object-cover"
                autoPlay
                muted
                playsInline
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4">
                  <VideoOff className="h-16 w-16 text-white/70" />
                  <p className="mt-2 text-white/70">Your camera is off</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
                You
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={cn(
            'flex h-full flex-col bg-gray-900/80 backdrop-blur-sm transition-all duration-300',
            isChatOpen ? 'w-full max-w-sm border-l border-gray-700' : 'w-0'
          )}
        >
          <div className="flex-1 overflow-hidden">
             {isChatOpen && (
                 <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-700 p-4">
                        <h2 className="text-xl font-bold">Chat</h2>
                        <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                            <X className="h-6 w-6"/>
                        </Button>
                    </div>
                     <ScrollArea className="flex-1 p-4">
                       <div className="flex flex-col gap-4">
                        {messages?.map((msg, index) => (
                          <div
                            key={index}
                            className={cn(
                              'flex items-start gap-3',
                              msg.senderId === user?.uid ? 'flex-row-reverse' : ''
                            )}
                          >
                             <Avatar className="h-8 w-8">
                                <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                'max-w-xs rounded-lg p-3 text-sm',
                                msg.senderId === user?.uid
                                  ? 'rounded-br-none bg-primary text-primary-foreground'
                                  : 'rounded-bl-none bg-gray-700'
                              )}
                            >
                              <p className="font-bold">{msg.senderName}</p>
                              <p>{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        </div>
                    </ScrollArea>
                    <div className="border-t border-gray-700 p-4">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-800 border-gray-700 text-white"
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
        <div className="flex items-center gap-2 rounded-full bg-gray-800/80 p-2 backdrop-blur-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-white hover:bg-white/10 hover:text-white"
                  onClick={toggleMic}
                >
                  {isMicOn ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMicOn ? 'Mute' : 'Unmute'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-white hover:bg-white/10 hover:text-white"
                  onClick={toggleCamera}
                >
                  {isCameraOn ? (
                    <Video className="h-6 w-6" />
                  ) : (
                    <VideoOff className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCameraOn ? 'Stop Video' : 'Start Video'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-white hover:bg-white/10 hover:text-white"
                   onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

    