import { useState, useEffect, useRef } from "react";
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer
} from "@livekit/components-react";
import "@livekit/components-styles";
import { 
  useJoinLiveClass, 
  useRecordLiveClassJoin, 
  useRecordLiveClassLeave,
  useStartLiveClassRecording,
  useStopLiveClassRecording
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Circle, Square, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function LiveClassroom({ id, backUrl }: { id: number, backUrl: string }) {
  const { toast } = useToast();
  const joinClass = useJoinLiveClass();
  const recordJoin = useRecordLiveClassJoin();
  const recordLeave = useRecordLiveClassLeave();
  
  const [tokenInfo, setTokenInfo] = useState<{ token: string, serverUrl: string, isHost: boolean, classTitle: string, status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    recordJoin.mutate({ id }, {
      onError: (err) => console.error("Failed to record join:", err)
    });
  };

  const handleDisconnected = () => {
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
          {tokenInfo.isHost && <HostControls classId={id} />}
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
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}

function HostControls({ classId }: { classId: number }) {
  const { toast } = useToast();
  const startRecording = useStartLiveClassRecording();
  const stopRecording = useStopLiveClassRecording();
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

  return (
    <div className="flex items-center gap-2">
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
