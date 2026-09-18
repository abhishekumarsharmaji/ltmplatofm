import { useState, useEffect, useRef } from "react";
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  ParticipantTile,
  useLocalParticipant,
  useTracks
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { 
  useJoinLiveClass, 
  useRecordLiveClassJoin, 
  useRecordLiveClassLeave,
  useStartLiveClassRecording,
  useStopLiveClassRecording,
  useCompleteLiveClass
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Circle, Square, AlertCircle, Loader2, MonitorUp, MonitorX } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function LiveClassroom({ id, backUrl }: { id: number, backUrl: string }) {
  const { toast } = useToast();
  const joinClass = useJoinLiveClass();
  const recordJoin = useRecordLiveClassJoin();
  const recordLeave = useRecordLiveClassLeave();
  
  const [tokenInfo, setTokenInfo] = useState<{ token: string, serverUrl: string, isHost: boolean, classTitle: string, status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  
  const leaveRecordedRef = useRef(false);

  useEffect(() => {
    // Only fetch once
    if (tokenInfo || joinClass.isPending || error) return;
    
    joinClass.mutate({ id }, {
      onSuccess: (data) => {
        setTokenInfo({
          token: data.token,
          serverUrl: data.serverUrl,
          isHost: data.participantRole === 'host',
          classTitle: data.class.title,
          status: data.class.status
        });
      },
      onError: (err) => {
        setError(err.message || "Failed to join classroom.");
      }
    });
  }, [id, joinClass, tokenInfo, error]);

  const handleConnected = () => {
    setDisconnected(false);
    recordJoin.mutate({ id }, {
      onError: (err) => console.error("Failed to record join:", err)
    });
  };

  const handleDisconnected = () => {
    setDisconnected(true);
    if (!leaveRecordedRef.current) {
      leaveRecordedRef.current = true;
      recordLeave.mutate({ id }, {
        onError: (err) => console.error("Failed to record leave:", err)
      });
    }
  };

  // Ensure leave is recorded on unmount if we connected
  useEffect(() => {
    return () => {
      if (tokenInfo && !leaveRecordedRef.current) {
        leaveRecordedRef.current = true;
        recordLeave.mutate({ id });
      }
    };
  }, [tokenInfo, id, recordLeave]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Cannot Access Classroom</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link href={backUrl}><Button className="mt-4">Go Back</Button></Link>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">Preparing your classroom...</p>
      </div>
    );
  }

  if (disconnected) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Video className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Live class disconnected</h2>
        <p className="max-w-md text-muted-foreground">The creator may have ended the live class, or your connection was interrupted.</p>
        <Link href={backUrl}><Button>Back to live classes</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
      {/* Custom Header */}
      <div className="h-16 px-6 bg-card border-b border-border flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="ghost" size="icon" className="hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="w-8 h-8 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{tokenInfo.classTitle}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Secure LMS classroom</span>
              <Badge variant="outline" className="text-[10px] h-4 py-0 uppercase bg-primary/10 text-primary border-primary/20">
                {tokenInfo.status === 'live' ? 'Live' : tokenInfo.status}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {tokenInfo.isHost && <HostControls classId={id} backUrl={backUrl} />}
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1 relative bg-background" data-theme="dark">
        <LiveKitRoom
          video={tokenInfo.isHost}
          audio={tokenInfo.isHost}
          token={tokenInfo.token}
          serverUrl={tokenInfo.serverUrl}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <BroadcastRoomContent isHost={tokenInfo.isHost} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}

function BroadcastRoomContent({ isHost }: { isHost: boolean }) {
  if (isHost) {
    return (
      <div className="relative h-full">
        <VideoConference />
        <ScreenShareControl />
      </div>
    );
  }

  return <StudentBroadcastView />;
}

function ScreenShareControl() {
  const { localParticipant } = useLocalParticipant();
  const [sharing, setSharing] = useState(localParticipant.isScreenShareEnabled);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const toggleScreenShare = async () => {
    setPending(true);
    try {
      const next = !localParticipant.isScreenShareEnabled;
      await Promise.race([
        localParticipant.setScreenShareEnabled(next),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Screen sharing did not start. Check browser permission and try again.")), 12_000);
        }),
      ]);
      setSharing(next);
      toast({
        title: next ? "Screen sharing started" : "Screen sharing stopped",
        description: next ? "Students can now see your shared screen live." : "Your camera remains visible to students.",
      });
    } catch (error) {
      toast({
        title: "Could not share screen",
        description: error instanceof Error ? error.message : "Please allow screen-sharing permission and try again.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={toggleScreenShare}
      disabled={pending}
      className="absolute right-4 top-4 z-20 shadow-lg"
      variant={sharing ? "destructive" : "default"}
    >
      {sharing ? <MonitorX className="mr-2 h-4 w-4" /> : <MonitorUp className="mr-2 h-4 w-4" />}
      {pending ? "Please wait..." : sharing ? "Stop sharing" : "Share screen live"}
    </Button>
  );
}

function StudentBroadcastView() {
  const screenTracks = useTracks([Track.Source.ScreenShare]);
  const cameraTracks = useTracks([Track.Source.Camera]);
  const featuredTrack = screenTracks[0] ?? cameraTracks[0];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-semibold">Live course broadcast</p>
          <p className="text-xs text-white/60">
            {screenTracks.length ? "The instructor is sharing their screen." : "Waiting for the instructor to share their screen."}
          </p>
        </div>
        <Badge className="border-red-400/30 bg-red-500/15 text-red-200">LIVE</Badge>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-3 md:p-6">
        {featuredTrack ? (
          <ParticipantTile trackRef={featuredTrack} className="h-full w-full overflow-hidden rounded-xl bg-black [&_video]:object-contain" />
        ) : (
          <div className="max-w-md text-center">
            <MonitorUp className="mx-auto mb-4 h-12 w-12 text-white/30" />
            <h2 className="text-xl font-semibold">The live class will appear here</h2>
            <p className="mt-2 text-sm text-white/60">You are connected. The instructor has not started camera or screen sharing yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HostControls({ classId, backUrl }: { classId: number; backUrl: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const startRecording = useStartLiveClassRecording();
  const stopRecording = useStopLiveClassRecording();
  const completeClass = useCompleteLiveClass();
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = () => {
    startRecording.mutate({ id: classId }, {
      onSuccess: () => {
        setIsRecording(true);
        toast({ title: "Recording Started", description: "This session is now being recorded." });
      },
      onError: (err) => {
        toast({ title: "Recording Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleStopRecording = () => {
    stopRecording.mutate({ id: classId }, {
      onSuccess: () => {
        setIsRecording(false);
        toast({ title: "Recording Stopped", description: "The recording will be processed and available soon." });
      },
      onError: (err) => {
        toast({ title: "Could not stop recording", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleEndClass = () => {
    if (!confirm("End this live class now? All connected students will be disconnected.")) return;
    completeClass.mutate({ id: classId }, {
      onSuccess: () => {
        toast({ title: "Live class ended", description: "Students have been disconnected from this classroom." });
        setLocation(backUrl);
      },
      onError: (err) => toast({ title: "Could not end class", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={handleEndClass} disabled={completeClass.isPending}>
        <Square className="mr-2 h-4 w-4 fill-current" />
        {completeClass.isPending ? "Ending..." : "End Live Class"}
      </Button>
      {isRecording ? (
        <Button variant="destructive" size="sm" onClick={handleStopRecording} disabled={stopRecording.isPending}>
          <Square className="w-4 h-4 mr-2 fill-current" />
          {stopRecording.isPending ? "Stopping..." : "Stop Recording"}
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handleStartRecording} disabled={startRecording.isPending} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
          <Circle className="w-4 h-4 mr-2 text-destructive fill-destructive" />
          {startRecording.isPending ? "Starting..." : "Record Session"}
        </Button>
      )}
    </div>
  );
}
