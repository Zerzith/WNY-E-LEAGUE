import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [userPhotoURL, setUserPhotoURL] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if user is admin and get user photo
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();
          setIsAdmin(userData?.role === "admin");
          setUserPhotoURL(userData?.photoURL || user.photoURL || "");
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      };
      checkAdmin();
    }
  }, [user]);

  // Fetch live stream configuration
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "live_stream"), (doc) => {
      if (doc.exists()) {
        setLiveStream(doc.data() as LiveStreamConfig);
        setEditStreamUrl(doc.data().liveUrl || "");
        setEditStreamTitle(doc.data().title || "");
      }
    }, (error) => {
      console.error("Error fetching live stream config:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch chat messages with user photos
  useEffect(() => {
    const q = query(
      collection(db, "live_chat"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)).reverse();
      setMessages(msgs);
      setViewerCount(Math.floor(Math.random() * 500) + 50); // Simulate viewer count
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "live_chat"), {
        text: newMessage,
        displayName: user.displayName || "Anonymous",
        userId: user.uid,
        userPhotoURL: userPhotoURL || user.photoURL || "",
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
      setShowEmoji(false);
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
    const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (match) {
      return `https://player.twitch.tv/?channel=${match[1]}&parent=${window.location.hostname}`;
    }
    return url;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl text-white mb-4">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</h2>
        <Button onClick={() => setLocation("/login")}>ไปที่หน้าเข้าสู่ระบบ</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Live Stream Section - YouTube/Twitch Style */}
      {liveStream?.isActive && liveStream?.liveUrl ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Video Player (Left/Top) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="bg-black border-white/10 overflow-hidden flex-1">
              {/* Video Player Header */}
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
                    scrolling="no"
                    allow="autoplay"
                  />
                ) : (
                  <video
                    width="100%"
                    height="100%"
                    controls
                    src={liveStream.liveUrl}
                  />
                )}
                
                {/* Live Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                  <span className="text-sm font-bold text-white">LIVE</span>
                </div>

                {/* Viewer Count */}
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">{viewerCount.toLocaleString()}</span>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-2">{liveStream.title || "Live Stream"}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{viewerCount.toLocaleString()} คนกำลังดู</span>
                  </div>
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsEditingStream(true)}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Admin Stream Management */}
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
                      placeholder="เช่น https://www.youtube.com/watch?v=... หรือ https://www.twitch.tv/..."
                      className="bg-background/50 border-white/10"
                    />
                    <p className="text-xs text-muted-foreground mt-2">รองรับ: YouTube, Twitch, หรือ URL วิดีโอทั่วไป</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpdateStream}
                      className="bg-primary hover:bg-primary/90 flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      บันทึก
                    </Button>
                    <Button 
                      onClick={handleRemoveStream}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      ลบ
                    </Button>
                    <Button 
                      onClick={() => setIsEditingStream(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Chat Section (Right/Bottom) */}
          <Card className="flex flex-col bg-card/50 border-white/10 backdrop-blur-sm overflow-hidden lg:col-span-1">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/20">
              <h2 className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                Live Chat
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.userId === user.uid;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <img
                      src={msg.userPhotoURL || "https://via.placeholder.com/32"}
                      alt={msg.displayName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    
                    {/* Message */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-muted-foreground px-2">{msg.displayName}</span>
                      <div className={`rounded-lg px-3 py-1 text-sm max-w-[150px] break-words ${
                        isMe 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-secondary text-white rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/20 relative">
              {showEmoji && (
                <div className="absolute bottom-16 left-0 z-50">
                  <EmojiPicker onEmojiClick={(emojiObject: any) => setNewMessage(prev => prev + emojiObject.emoji)} theme="dark" width={250} height={300} />
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="text-muted-foreground hover:text-accent flex-shrink-0"
                >
                  <Smile className="w-4 h-4" />
                </Button>
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความ..."
                  className="bg-background/50 border-white/10 text-sm"
                />
                <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      ) : (
        // No Stream Active
        <div className="flex-1 flex flex-col items-center justify-center">
          <Card className="bg-card/50 border-white/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">ยังไม่มีการถ่ายทอดสดในขณะนี้</h2>
            <p className="text-muted-foreground mb-6">กรุณารอการเริ่มต้นการถ่ายทอดสดของการแข่งขัน</p>
            {isAdmin && (
              <Button 
                onClick={() => setIsEditingStream(true)}
                className="bg-accent hover:bg-accent/90"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                เพิ่มลิงก์ Live Streaming
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
