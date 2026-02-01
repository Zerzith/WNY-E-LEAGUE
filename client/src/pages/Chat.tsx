import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Smile, Edit2, X, Check, Users, Eye } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  text: string;
  displayName: string;
  userId: string;
  userPhotoURL?: string;
  timestamp: any;
}

interface LiveStreamConfig {
  liveUrl: string;
  title: string;
  isActive: boolean;
}

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [liveStream, setLiveStream] = useState<LiveStreamConfig | null>(null);
  const [isEditingStream, setIsEditingStream] = useState(false);
  const [editStreamUrl, setEditStreamUrl] = useState("");
  const [editStreamTitle, setEditStreamTitle] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [userPhotoURL, setUserPhotoURL] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Get user photo
  useEffect(() => {
    if (user) {
      setUserPhotoURL(user.photoURL || "");
    }
  }, [user]);

  // Fetch live stream configuration
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "live_stream"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLiveStream(data as LiveStreamConfig);
        setEditStreamUrl(data.liveUrl || "");
        setEditStreamTitle(data.title || "");
      }
    }, (error) => {
      console.error("Error fetching live stream config:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch chat messages
  useEffect(() => {
    const q = query(
      collection(db, "live_chat"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as ChatMessage));
      setMessages(msgs.reverse());
      setViewerCount(new Set(msgs.map((m) => m.userId)).size);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "live_chat"), {
        text: newMessage,
        displayName: user.displayName || "Anonymous",
        userId: user.uid,
        userPhotoURL: userPhotoURL,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleUpdateStream = async () => {
    if (!editStreamUrl.trim()) return;

    try {
      await setDoc(doc(db, "config", "live_stream"), {
        liveUrl: editStreamUrl,
        title: editStreamTitle || "Live Stream",
        isActive: true,
        updatedAt: serverTimestamp(),
      });
      setIsEditingStream(false);
    } catch (error) {
      console.error("Error updating stream:", error);
    }
  };

  const handleRemoveStream = async () => {
    try {
      await setDoc(doc(db, "config", "live_stream"), {
        liveUrl: "",
        title: "",
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      setIsEditingStream(false);
    } catch (error) {
      console.error("Error removing stream:", error);
    }
  };

  const isYoutubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getTwitchEmbedUrl = (url: string) => {
    const channelMatch = url.match(/twitch\.tv\/([^/?]+)/);
    if (channelMatch) {
      return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${window.location.hostname}`;
    }
    return url;
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {liveStream?.isActive && liveStream?.liveUrl ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="bg-black border-white/10 overflow-hidden flex-1">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {isYoutubeUrl(liveStream.liveUrl) ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={liveStream.liveUrl.replace("watch?v=", "embed/").split("&")[0]}
                    title="Live Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : liveStream.liveUrl.includes("twitch.tv") ? (
                  <iframe
                    src={getTwitchEmbedUrl(liveStream.liveUrl)}
                    height="100%"
                    width="100%"
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="w-full h-full"
                    width="100%"
                    height="100%"
                    controls
                    src={liveStream.liveUrl}
                  />
                )}
                
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>

                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {viewerCount} ผู้ชม
                </div>
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{liveStream.title || "Live Stream"}</h2>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{viewerCount} ผู้ชมออนไลน์</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsEditingStream(!isEditingStream)}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {isAdmin && isEditingStream && (
              <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">ชื่อการแข่งขัน</label>
                    <Input 
                      value={editStreamTitle}
                      onChange={(e) => setEditStreamTitle(e.target.value)}
                      placeholder="เช่น Valorant Final"
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">ลิงก์ Live Streaming</label>
                    <Input 
                      value={editStreamUrl}
                      onChange={(e) => setEditStreamUrl(e.target.value)}
                      placeholder="เช่น https://www.youtube.com/watch?v=..."
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateStream} className="bg-primary flex-1">
                      <Check className="w-4 h-4 mr-2" /> บันทึก
                    </Button>
                    <Button onClick={handleRemoveStream} variant="destructive" className="flex-1">
                      <X className="w-4 h-4 mr-2" /> ลบ
                    </Button>
                    <Button onClick={() => setIsEditingStream(false)} variant="outline" className="flex-1">
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 flex flex-col">
            <Card className="bg-card/50 border-white/10 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">แชทสด</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {viewerCount} ออนไลน์
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 overflow-hidden border border-white/10">
                      {msg.userPhotoURL ? (
                        <img src={msg.userPhotoURL} alt={msg.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                          {msg.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-accent truncate">{msg.displayName}</span>
                        <span className="text-[10px] text-white/20">
                          {msg.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 break-words leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 bg-black/20 relative">
                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        setNewMessage(prev => prev + emojiData.emoji);
                        setShowEmoji(false);
                      }}
                      theme={"dark" as any}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-white"
                    onClick={() => setShowEmoji(!showEmoji)}
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="พิมพ์ข้อความ..."
                    className="bg-white/5 border-white/10 focus:ring-primary/50"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    size="icon"
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-12 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-10 h-10 text-primary opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">ไม่มีการถ่ายทอดสด</h2>
            <p className="text-muted-foreground mb-8">ขณะนี้ยังไม่มีการแข่งขันที่กำลังถ่ายทอดสด คุณสามารถพูดคุยกับเพื่อนๆ ในแชทได้</p>
            
            {isAdmin && !isEditingStream && (
              <Button 
                onClick={() => setIsEditingStream(true)}
                className="bg-accent text-black hover:bg-accent/90 font-bold"
              >
                <Edit2 className="w-4 h-4 mr-2" /> เพิ่มลิงก์ไลฟ์สด
              </Button>
            )}
          </Card>
          
          {isAdmin && isEditingStream && (
            <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-6 max-w-2xl w-full">
              <h3 className="text-lg font-bold text-white mb-4">เพิ่มลิงก์ Live Streaming</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">ชื่อการแข่งขัน</label>
                  <Input 
                    value={editStreamTitle}
                    onChange={(e) => setEditStreamTitle(e.target.value)}
                    placeholder="เช่น Valorant Final"
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">ลิงก์ Live Streaming</label>
                  <Input 
                    value={editStreamUrl}
                    onChange={(e) => setEditStreamUrl(e.target.value)}
                    placeholder="เช่น https://www.youtube.com/watch?v=..."
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateStream} className="bg-primary flex-1">
                    <Check className="w-4 h-4 mr-2" /> บันทึก
                  </Button>
                  <Button onClick={() => setIsEditingStream(false)} variant="outline" className="flex-1">
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
