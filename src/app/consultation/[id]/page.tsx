'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const doctorImage = placeholderImages.find((img) => img.id === 'consultation-doctor');
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        setIsCameraOn(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraOn(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  const toggleMic = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
     if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white">
      <div className="grid flex-1 grid-cols-1 grid-rows-2 gap-2 p-2 lg:grid-cols-2 lg:grid-rows-1">
        <div className="relative overflow-hidden rounded-lg bg-gray-900">
          {doctorImage && (
            <Image
              src={doctorImage.imageUrl}
              alt={doctorImage.description}
              fill
              className="object-cover"
              data-ai-hint={doctorImage.imageHint}
            />
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
            Dr. Emily Carter
          </div>
        </div>
        <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-900">
           <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted />
            {!hasCameraPermission && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4">
                <Alert variant="destructive" className="max-w-sm">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser to use this feature. You may need to refresh the page after granting permission.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {hasCameraPermission && !isCameraOn && (
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

      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
        <div className="flex items-center gap-2 rounded-full bg-gray-800/80 p-2 backdrop-blur-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 hover:text-white" onClick={toggleMic}>
                  {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMicOn ? 'Mute' : 'Unmute'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 hover:text-white" onClick={toggleCamera}>
                   {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isCameraOn ? 'Stop Video' : 'Start Video'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 hover:text-white">
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 hover:text-white">
                  <Users className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Participants</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="destructive" size="icon" className="rounded-full h-12 w-12">
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
