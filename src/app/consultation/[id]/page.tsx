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

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const patientImage = placeholderImages.find((img) => img.id === 'consultation-patient');
  const doctorImage = placeholderImages.find((img) => img.id === 'consultation-doctor');

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
        <div className="relative overflow-hidden rounded-lg bg-gray-900">
           {patientImage && (
            <Image
              src={patientImage.imageUrl}
              alt={patientImage.description}
              fill
              className="object-cover"
              data-ai-hint={patientImage.imageHint}
            />
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
            You (Jane Doe)
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
        <div className="flex items-center gap-2 rounded-full bg-gray-800/80 p-2 backdrop-blur-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 hover:text-white">
                  <Mic className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mute</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 hover:text-white">
                  <Video className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop Video</TooltipContent>
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
