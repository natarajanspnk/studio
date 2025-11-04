
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConsultationPreview } from './preview';
import { useFirestore } from '@/firebase';
import { createPeerConnection, startCall, joinCall } from '@/lib/webrtc';
import { doc, getDoc } from 'firebase/firestore';

export default function ConsultationPage({
  params,
}: {
  params: { id: string };
}) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callJoined, setCallJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const firestore = useFirestore();

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callJoined]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callJoined]);


  const handleJoinCall = async (stream: MediaStream, callId: string) => {
    setLocalStream(stream);
    setCallJoined(true);

    if (!firestore) {
      console.error("Firestore is not available");
      return;
    }

    createPeerConnection(firestore, callId, setRemoteStream);

    // Determine role (caller vs joiner) by checking for an existing offer
    const callDocRef = doc(firestore, 'calls', callId);
    const callDoc = await getDoc(callDocRef);

    if (callDoc.exists() && callDoc.data().offer) {
        // Offer exists, so we are the joiner
        await joinCall(firestore, callId, stream);
    } else {
        // No offer, so we are the caller
        await startCall(firestore, callId, stream);
    }
  };

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

  if (!callJoined) {
    return (
      <ConsultationPreview
        onJoinCall={(stream) => handleJoinCall(stream, params.id)}
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        setIsMicOn={setIsMicOn}
        setIsCameraOn={setIsCameraOn}
      />
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white">
      {/* Main video grid */}
      <div className="grid flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-2">
        {/* Remote video (Doctor/Other person) */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-900">
           <video
            ref={remoteVideoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
          />
          {!remoteStream && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4">
              <p className="mt-2 text-white/70">Waiting for the other person to join...</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
            Remote
          </div>
        </div>

        {/* Local video (You) */}
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
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-white hover:bg-white/10 hover:text-white"
                >
                  <Users className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Participants</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                >
                  <Link href="/dashboard">
                    <PhoneOff className="h-6 w-6" />
                  </Link>
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
