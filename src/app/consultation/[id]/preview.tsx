
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface ConsultationPreviewProps {
  onJoinCall: (stream: MediaStream) => void;
  isMicOn: boolean;
  isCameraOn: boolean;
  setIsMicOn: (isOn: boolean) => void;
  setIsCameraOn: (isOn: boolean) => void;
}

export function ConsultationPreview({
  onJoinCall,
  isMicOn,
  isCameraOn,
  setIsMicOn,
  setIsCameraOn,
}: ConsultationPreviewProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getMedia = async () => {
      setIsLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
        
        // Ensure initial state from parent is respected, but only if stream is active
        if (stream) {
          stream.getAudioTracks().forEach(track => track.enabled = isMicOn);
          stream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
        }

      } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description:
            'Please allow camera and microphone access to join the call.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    getMedia();

    return () => {
      // This cleanup runs when the component unmounts.
      // If the user navigates away from the preview without joining, stop the media tracks.
      if (streamRef.current) {
         streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  // The dependency array is updated to re-run the effect if the mic/camera state changes from the parent,
  // which can indicate a "reset" or re-entry into the preview state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      const newMicState = !isMicOn;
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newMicState;
      });
      setIsMicOn(newMicState);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
        const newCameraState = !isCameraOn;
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = newCameraState;
      });
      setIsCameraOn(newCameraState);
    }
  };

  const handleJoin = () => {
    if (streamRef.current) {
      // Pass the active stream to the parent component to use in the call
      onJoinCall(streamRef.current);
      // Nullify the stream ref here so the cleanup function doesn't stop the tracks,
      // as they are now being managed by the parent component.
      streamRef.current = null;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
            {isLoading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Starting camera...</p>
              </div>
            )}
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${!isLoading && hasPermission ? 'block' : 'hidden'} -scale-x-100`}
              autoPlay
              muted
              playsInline
            />
             {!isLoading && !hasPermission && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 p-4 text-center">
                 <Alert variant="destructive" className="max-w-sm border-0">
                  <VideoOff className="h-4 w-4" />
                   <AlertTitle>Camera & Mic Required</AlertTitle>
                   <AlertDescription>
                     Please grant permission to use your camera and microphone to continue. You may need to refresh.
                   </AlertDescription>
                 </Alert>
               </div>
            )}
            {!isLoading && hasPermission && !isCameraOn && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4">
                  <VideoOff className="h-16 w-16 text-white/70" />
                  <p className="mt-2 text-white/70">Your camera is off</p>
               </div>
            )}
          </div>
          <div className="flex flex-col justify-center space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Ready to join?</h1>
                <p className="text-muted-foreground">Check your audio and video before starting the call.</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant={isMicOn ? 'outline' : 'destructive'}
                size="icon"
                onClick={toggleMic}
                className="h-12 w-12 rounded-full"
                disabled={!hasPermission}
              >
                {isMicOn ? <Mic /> : <MicOff />}
              </Button>
              <Button
                variant={isCameraOn ? 'outline' : 'destructive'}
                size="icon"
                onClick={toggleCamera}
                className="h-12 w-12 rounded-full"
                disabled={!hasPermission}
              >
                {isCameraOn ? <Video /> : <VideoOff />}
              </Button>
            </div>
            <Button
              size="lg"
              onClick={handleJoin}
              disabled={!hasPermission}
              className="w-full"
            >
              <MonitorUp className="mr-2" />
              Join Call
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
