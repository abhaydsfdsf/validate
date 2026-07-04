import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Lock, 
  Mail, 
  User, 
  Loader2, 
  Shield, 
  Sparkles, 
  LogOut, 
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export interface ChatMessage {
  sender: "user" | "system";
  text: string;
  timestamp: string;
}

export interface UserSession {
  email: string;
  name: string;
  verified: boolean;
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  
  // Auth state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
  
  // Async statuses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Chat state
  const [user, setUser] = useState<UserSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("validate_user_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        // Load chat history
        loadChatHistory(parsed.email);
      } catch (e) {
        console.error("Error parsing saved session:", e);
      }
    }
  }, []);

  // Auto scroll to bottom of chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAiTyping]);

  const loadChatHistory = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please specify your email address.");
      return;
    }
    if (activeTab === "register" && !name.trim()) {
      setError("Please specify your business or personal name.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setDebugOtp(null);
    setEmailPreviewUrl(null);

    const endpoint = activeTab === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload = activeTab === "register" ? { email, name } : { email };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to transmit OTP request.");
      }

      setIsOtpSent(true);
      setSuccessMessage(data.message || "OTP access key dispatched!");
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      }
      if (data.previewUrl) {
        setEmailPreviewUrl(data.previewUrl);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the 6-digit OTP verification key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "OTP verification failed.");
      }

      const sessionUser: UserSession = {
        email: data.user.email,
        name: data.user.name,
        verified: data.user.verified
      };

      setUser(sessionUser);
      localStorage.setItem("validate_user_session", JSON.stringify(sessionUser));
      setSuccessMessage("Authenticated successfully.");
      
      // Load or clear previous messages
      loadChatHistory(sessionUser.email);
    } catch (err: any) {
      setError(err.message || "Failed to verify key.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user) return;

    const textToSend = newMessageText;
    setNewMessageText("");
    
    // Add temporary optimistic client message to the stream
    const tempUserMsg: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempUserMsg]);
    setIsAiTyping(true);

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(user.email)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setChatMessages(data.messages);
    } catch (err: any) {
      setError("Failed to route message block. Retrying...");
      console.error(err);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("validate_user_session");
    setUser(null);
    setChatMessages([]);
    setIsOtpSent(false);
    setOtpCode("");
    setSuccessMessage(null);
    setError(null);
  };

  return (
    <>
      {/* PERSISTENT FLOATING BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-white text-black hover:bg-neutral-200 px-5 py-3.5 border-4 border-neutral-900 font-sans font-bold text-xs uppercase tracking-widest transition-all shadow-[6px_6px_0px_#111] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_#111] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#111] cursor-pointer"
        >
          <div className="relative">
            <MessageSquare size={16} />
            {user && (
              <span className="absolute -top-1.5 -right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <span>{isOpen ? "Close Console" : "Live AI Consultant"}</span>
        </button>
      </div>

      {/* FLOATING PANEL DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[550px] bg-black border-4 border-[#111] text-white z-50 flex flex-col shadow-[10px_10px_0px_#111] font-sans overflow-hidden"
          >
            {/* Upper Info / Header Bar */}
            <div className="bg-black border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
                  COGNITIVE DIALOGUE SYSTEM
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white text-neutral-500 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Main Area: Conditionally render Authentication or Active Chat */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-black relative">
              
              {!user ? (
                /* AUTH FLOW IN PANEL */
                <div className="p-6 flex flex-col justify-between h-full">
                  <div>
                    {/* Header Intro */}
                    <div className="text-center mb-6">
                      <h4 className="text-lg font-display font-black tracking-tighter uppercase text-white">
                        Access Secured Console
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-light mt-1">
                        Authenticate via secure OTP to access live chat.
                      </p>
                    </div>

                    {/* Tab Navigation if not awaiting OTP */}
                    {!isOtpSent && (
                      <div className="grid grid-cols-2 border border-white/10 p-0.5 mb-6 bg-neutral-950">
                        <button
                          onClick={() => { setActiveTab("register"); setError(null); }}
                          className={`py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
                            activeTab === "register" 
                              ? "bg-white text-black font-bold" 
                              : "text-neutral-500 hover:text-white"
                          }`}
                        >
                          Register
                        </button>
                        <button
                          onClick={() => { setActiveTab("login"); setError(null); }}
                          className={`py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
                            activeTab === "login" 
                              ? "bg-white text-black font-bold" 
                              : "text-neutral-500 hover:text-white"
                          }`}
                        >
                          Login
                        </button>
                      </div>
                    )}

                    {/* Notice Messages */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs flex gap-2 items-start rounded-none">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-start rounded-none">
                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {/* Step 1: Send OTP Form */}
                    {!isOtpSent ? (
                      <form onSubmit={handleSendOTP} className="space-y-4">
                        {activeTab === "register" && (
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block flex items-center gap-1">
                              <User size={10} /> Name or Company
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g., Summit Agency"
                              className="w-full px-3 py-2 bg-black border border-white/10 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block flex items-center gap-1">
                            <Mail size={10} /> Corporate Email
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g., founder@summit.com"
                            className="w-full px-3 py-2 bg-black border border-white/10 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-mono font-bold text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" /> DISPATCHING...
                            </span>
                          ) : (
                            "DISPATCH OTP ACCESS KEY"
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Step 2: Verify OTP Form */
                      <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block flex items-center gap-1">
                            <Lock size={10} /> 6-Digit OTP Key
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="Enter 6-digit key"
                            className="w-full px-3 py-2.5 bg-black border border-white/10 text-center text-lg font-mono tracking-[0.5em] text-white focus:outline-none focus:border-white transition-colors"
                          />
                        </div>

                        {/* Sandbox debug helper */}
                        {debugOtp && (
                          <div className="p-3 bg-neutral-900 border border-white/5 space-y-1 text-center">
                            <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider block">
                              SANDBOX TEST OTP DISPATCHED
                            </span>
                            <code className="text-xs text-white font-mono font-bold tracking-widest bg-neutral-950 px-2 py-0.5 border border-white/10">
                              {debugOtp}
                            </code>
                            {emailPreviewUrl && (
                              <a
                                href={emailPreviewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[8px] font-mono text-neutral-400 hover:text-white underline mt-1.5 flex items-center justify-center gap-1"
                              >
                                View Dispatched HTML Mail <ExternalLink size={8} />
                              </a>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-mono font-bold text-[10px] tracking-widest uppercase transition-colors cursor-pointer"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" /> SECURING...
                            </span>
                          ) : (
                            "AUTHENTICATE ACCESS SESSION"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpSent(false);
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="w-full py-1 text-center text-[9px] font-mono text-neutral-500 hover:text-white uppercase tracking-widest block"
                        >
                          &larr; Request New Email Dispatched
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="text-center pt-4 border-t border-white/5">
                    <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-wider">
                      Secured by SHA256-OTP Node / Validate Security Core
                    </span>
                  </div>
                </div>
              ) : (
                /* CHAT INTERFACE */
                <div className="flex flex-col h-full bg-neutral-950">
                  {/* Active session bar */}
                  <div className="px-4 py-2 bg-black border-b border-white/10 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                    <span className="truncate">
                      SECURE CLIENT: {user.name} ({user.email})
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 uppercase"
                      title="Log Out Session"
                    >
                      <span>Signout</span>
                      <LogOut size={10} />
                    </button>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      /* Welcome system message */
                      <div className="p-4 border border-white/5 bg-black rounded-none space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-white" />
                          <span className="text-[10px] font-mono font-bold uppercase text-white">
                            ABHAY GHODESWAR
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-light leading-relaxed">
                          Welcome, <strong className="text-white">{user.name}</strong>. I'm Abhay Ghodeswar, Founder of VALIDATE. Let's talk architecture. What operational friction or manual bottleneck can we automate to stop capital waste in your operations?
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex flex-col ${
                            msg.sender === "user" ? "items-end" : "items-start"
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[8px] font-mono text-neutral-500 uppercase mb-1">
                            <span>
                              {msg.sender === "user" ? "CLIENT" : "ABHAY GHODESWAR"}
                            </span>
                            <span>&bull;</span>
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <div
                            className={`px-3 py-2 text-xs leading-relaxed max-w-[85%] border font-light ${
                              msg.sender === "user"
                                ? "bg-white text-black border-white"
                                : "bg-black text-white border-white/10"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}

                    {/* typing state */}
                    {isAiTyping && (
                      <div className="flex flex-col items-start">
                        <div className="text-[8px] font-mono text-neutral-500 uppercase mb-1">
                          ABHAY GHODESWAR IS ENGAGING...
                        </div>
                        <div className="px-3 py-2 text-xs bg-black text-neutral-500 border border-white/10 rounded-none italic flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          Formulating core validation architecture...
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Messaging panel form */}
                  <form 
                    onSubmit={handleSendMessage}
                    className="p-3 bg-black border-t border-white/10 flex gap-2"
                  >
                    <input
                      type="text"
                      required
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Ask for automation ideas, workflow scopes..."
                      className="flex-1 bg-neutral-950 border border-white/10 px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isAiTyping}
                      className="bg-white text-black p-2 hover:bg-neutral-200 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center border border-white"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
