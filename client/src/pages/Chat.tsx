import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Smile, Edit2, X, Check } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  text: string;
  displayName: string;
  userId: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();
          setIsAdmin(userData?.role === "admin");
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

  // Fetch chat messages
  useEffect(() => {
    const q = query(
      collection(db, "live_chat"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)).reverse();
      setMessages(msgs);
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
      {/* Live Stream Section */}
      {liveStream?.isActive && liveStream?.liveUrl && (
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
              <h3 className="font-bold text-white">{liveStream.title || "Live Stream"}</h3>
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
          
          <div className="aspect-video bg-black flex items-center justify-center">
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
          </div>
        </Card>
      )}

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

      {/* Add Stream Button for Admin */}
      {isAdmin && !liveStream?.isActive && !isEditingStream && (
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-4">
          <Button 
            onClick={() => setIsEditingStream(true)}
            className="w-full bg-accent hover:bg-accent/90"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            เพิ่มลิงก์ Live Streaming
          </Button>
        </Card>
      )}

      {/* Chat Section */}
      <Card className="flex-1 bg-card/50 border-white/10 backdrop-blur-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h2 className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            Live Chat Room
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.userId === user.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-secondary text-white rounded-bl-none'
                }`}>
                  <div className="text-xs opacity-50 mb-1">{msg.displayName}</div>
                  <div className="break-words">{msg.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/20 relative">
          {showEmoji && (
            <div className="absolute bottom-20 left-4 z-50">
              <EmojiPicker onEmojiClick={(emojiObject: any) => setNewMessage(prev => prev + emojiObject.emoji)} theme="dark" width={300} height={400} />
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowEmoji(!showEmoji)}
              className="text-muted-foreground hover:text-accent"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="bg-background/50 border-white/10"
            />
            <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
