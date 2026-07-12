import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Send, 
  Search, 
  RefreshCw, 
  Inbox, 
  CornerUpLeft, 
  User as UserIcon, 
  Loader2, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  X, 
  FileText,
  Clock,
  ArrowRight
} from "lucide-react";
import { auth, googleAuthProvider, signInWithPopup, GoogleAuthProvider } from "../lib/firebase.ts";

interface GmailHubProps {
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
  setParentToken: (token: string | null) => void;
  userEmail?: string;
  onSendBillingEmail?: (email: { subject: string; body: string }) => void;
}

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  unread: boolean;
}

// High-fidelity mock emails for simulation/bypass mode
const MOCK_EMAILS: GmailMessage[] = [
  {
    id: "mock-1",
    threadId: "thread-1",
    subject: "Pending Billing Inquiry: Milestone 2 Deliverables",
    from: "Abhay Ghodeswar <abhayghodeswar81@gmail.com>",
    to: "client-services@validate.labs",
    date: new Date(Date.now() - 3600000 * 2).toLocaleString(),
    snippet: "Hi Team, I reviewed the Python API integrations and the Hippo clinical triage flow drafts. Everything looks secure! Can you generate the invoice milestone 2 cover email so I can clear the payment?",
    body: "Hi Team,\n\nI reviewed the Python API integrations and the Hippo clinical triage flow drafts. Everything looks secure! Can you generate the invoice milestone 2 cover email so I can clear the payment?\n\nAlso, let me know if we need to schedule a final sync before moving to production.\n\nBest regards,\nAbhay Ghodeswar\nPrincipal Architect, Validate",
    unread: true
  },
  {
    id: "mock-2",
    threadId: "thread-2",
    subject: "Urgent Patient Symptoms Update - Priority Red",
    from: "Dr. Sarah Jenkins <s.jenkins@metropolitan-medical.org>",
    to: "triage-coordinator@validate.labs",
    date: new Date(Date.now() - 3600000 * 5).toLocaleString(),
    snippet: "Warning: Patient registered symptoms of acute pain coupled with high blood pressure. Requesting an instant automated summary from the Intake Organizer node immediately.",
    body: "Warning:\n\nPatient registered symptoms of acute pain coupled with high blood pressure. Requesting an instant automated summary from the Intake Organizer node immediately to prepare the critical diagnostics sequence.\n\nThanks,\nDr. Jenkins",
    unread: true
  },
  {
    id: "mock-3",
    threadId: "thread-3",
    subject: "Travel Reservation Confirmation: Tokyo Flight & Lodging",
    from: "Eco Flight Jetliner Support <support@ecojet.travel>",
    to: "traveler-node@validate.labs",
    date: new Date(Date.now() - 3600000 * 24).toLocaleString(),
    snippet: "Your reservation for Tokyo Grand Regal suites and flight eco-jet is confirmed. Click here to sync your multi-day itinerary directly on Google Calendar.",
    body: "Dear Traveler,\n\nYour reservation for Tokyo Grand Regal suites and flight eco-jet is confirmed. Click here to sync your multi-day itinerary directly on Google Calendar.\n\nBooking ID: TX-88219A\nStart Date: 2026-08-15\n\nSafe travels!\nEco Jetliner Team",
    unread: false
  },
  {
    id: "mock-4",
    threadId: "thread-4",
    subject: "Syllabus Milestone Check-in: Advanced Algorithms prep",
    from: "Prof. Alan Turing <a.turing@cambridge-institute.edu>",
    to: "student-node@validate.labs",
    date: new Date(Date.now() - 3600000 * 48).toLocaleString(),
    snippet: "The preparation flashcards have been synchronized. Please review the binary tree optimizations and recursive chunking structures before Monday's review session.",
    body: "Hello,\n\nThe preparation flashcards have been synchronized. Please review the binary tree optimizations and recursive chunking structures before Monday's review session.\n\nEnsure you active-recall test yourself using the simulator.\n\nWarmly,\nProf. Turing",
    unread: false
  }
];

export default function GmailHub({ 
  googleToken, 
  setGoogleToken, 
  setParentToken,
  userEmail,
  onSendBillingEmail 
}: GmailHubProps) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMsg, setSelectedMsg] = useState<GmailMessage | null>(null);
  
  // Compose modal/drawer state
  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [toInput, setToInput] = useState<string>("");
  const [subjectInput, setSubjectInput] = useState<string>("");
  const [bodyInput, setBodyInput] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const isBypass = localStorage.getItem("mock_user_active") === "true";

  useEffect(() => {
    fetchEmails();
  }, [googleToken]);

  const fetchEmails = async () => {
    setErrorMsg(null);
    setLoading(true);

    if (isBypass || !googleToken) {
      // Simulate slow network request for high-fidelity loading effect
      setTimeout(() => {
        const customEmailsStr = localStorage.getItem("custom_gmail_emails");
        const customEmails: GmailMessage[] = customEmailsStr ? JSON.parse(customEmailsStr) : [];
        const mergedEmails = [...customEmails, ...MOCK_EMAILS];
        let filtered = mergedEmails;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = mergedEmails.filter(
            m => m.subject.toLowerCase().includes(query) || 
                 m.snippet.toLowerCase().includes(query) || 
                 m.from.toLowerCase().includes(query)
          );
        }
        setMessages(filtered);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      // Step 1: List the messages
      let url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10";
      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }

      const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });

      if (listRes.status === 401) {
        setGoogleToken(null);
        throw new Error("Google Session expired. Please authorize Calendar & Gmail again.");
      }

      if (!listRes.ok) {
        throw new Error(`Gmail API listed error: ${listRes.statusText}`);
      }

      const listData = await listRes.json();
      
      if (!listData.messages || listData.messages.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch details for each message
      const detailedMessages = await Promise.all(
        listData.messages.map(async (msgSummary: any) => {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSummary.id}`, {
            headers: { Authorization: `Bearer ${googleToken}` }
          });
          
          if (!detailRes.ok) return null;
          const msg = await detailRes.json();
          
          // Parse headers
          const headers = msg.payload.headers || [];
          const getHeader = (name: string) => {
            const h = headers.find((header: any) => header.name.toLowerCase() === name.toLowerCase());
            return h ? h.value : "";
          };

          // Decode body
          const getBodyText = (payload: any): string => {
            if (payload.body && payload.body.data) {
              return decodeBase64Url(payload.body.data);
            }
            if (payload.parts) {
              for (const part of payload.parts) {
                if (part.mimeType === "text/plain" && part.body && part.body.data) {
                  return decodeBase64Url(part.body.data);
                }
              }
              for (const part of payload.parts) {
                if (part.parts) {
                  const nested = getBodyText(part);
                  if (nested) return nested;
                }
              }
            }
            return payload.snippet || "";
          };

          const decodeBase64Url = (str: string) => {
            try {
              const cleaned = str.replace(/-/g, "+").replace(/_/g, "/");
              return decodeURIComponent(escape(atob(cleaned)));
            } catch {
              return "";
            }
          };

          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader("subject") || "(No Subject)",
            from: getHeader("from") || "Unknown Sender",
            to: getHeader("to") || "Me",
            date: new Date(parseInt(msg.internalDate)).toLocaleString(),
            snippet: msg.snippet || "",
            body: getBodyText(msg.payload),
            unread: msg.labelIds ? msg.labelIds.includes("UNREAD") : false
          };
        })
      );

      setMessages(detailedMessages.filter((m): m is GmailMessage => m !== null));
    } catch (err: any) {
      console.error("Gmail fetch error:", err);
      setErrorMsg("Failed to synchronize inbox: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const tokenToUse = credential?.accessToken || null;
      if (tokenToUse) {
        setGoogleToken(tokenToUse);
        setParentToken(await result.user.getIdToken());
        setSuccessMsg("Secure Gmail Link Nodal Connection Active!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error("Failed to extract authorization token.");
      }
    } catch (err: any) {
      setErrorMsg("Authorization declined: " + err.message);
    }
  };

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toInput || !subjectInput || !bodyInput) return;

    setErrorMsg(null);
    setSendingEmail(true);

    const confirmed = window.confirm(
      `Send this email via Gmail to ${toInput} with subject "${subjectInput}"?`
    );
    if (!confirmed) {
      setSendingEmail(false);
      return;
    }

    if (isBypass || !googleToken) {
      // Simulate real mailing sequence
      setTimeout(() => {
        setSendingEmail(false);
        setComposeOpen(false);
        setSuccessMsg(`Simulated Email dispatched cleanly to ${toInput}!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        
        // Append simulated email to mock list
        const newMock: GmailMessage = {
          id: `mock-${Date.now()}`,
          threadId: `thread-${Date.now()}`,
          subject: subjectInput,
          from: "Me <me@validate.labs>",
          to: toInput,
          date: new Date().toLocaleString(),
          snippet: bodyInput.substring(0, 100),
          body: bodyInput,
          unread: false
        };

        const customEmailsStr = localStorage.getItem("custom_gmail_emails");
        const customEmails: GmailMessage[] = customEmailsStr ? JSON.parse(customEmailsStr) : [];
        localStorage.setItem("custom_gmail_emails", JSON.stringify([newMock, ...customEmails]));

        setMessages([newMock, ...messages]);
        
        // Reset compose
        setToInput("");
        setSubjectInput("");
        setBodyInput("");
      }, 1200);
      return;
    }

    try {
      // Construct raw RFC 2822 email base64url encoded
      const mailLines = [
        `To: ${toInput}`,
        `Subject: ${subjectInput}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        bodyInput
      ].join("\r\n");

      const encodedMail = btoa(unescape(encodeURIComponent(mailLines)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: encodedMail })
      });

      if (!res.ok) {
        throw new Error(`Gmail API delivery failure: ${res.statusText}`);
      }

      setSuccessMsg(`Email dispatched successfully to ${toInput}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setComposeOpen(false);
      
      // Reset fields
      setToInput("");
      setSubjectInput("");
      setBodyInput("");
      
      // Refresh
      fetchEmails();
    } catch (err: any) {
      setErrorMsg("Delivery failed: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!toInput || !subjectInput || !bodyInput) return;
    setErrorMsg(null);
    setSendingEmail(true);

    const confirmed = window.confirm(`Save this message as a Gmail draft?`);
    if (!confirmed) {
      setSendingEmail(false);
      return;
    }

    if (isBypass || !googleToken) {
      setTimeout(() => {
        setSendingEmail(false);
        setComposeOpen(false);
        setSuccessMsg("Simulated Draft successfully staged in Gmail drafts folder!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }, 1000);
      return;
    }

    try {
      const mailLines = [
        `To: ${toInput}`,
        `Subject: ${subjectInput}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        bodyInput
      ].join("\r\n");

      const encodedMail = btoa(unescape(encodeURIComponent(mailLines)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: { raw: encodedMail }
        })
      });

      if (!res.ok) {
        throw new Error(`Gmail API stage failure: ${res.statusText}`);
      }

      setSuccessMsg("Draft successfully staged in your Gmail drafts!");
      setTimeout(() => setSuccessMsg(null), 4000);
      setComposeOpen(false);
      setToInput("");
      setSubjectInput("");
      setBodyInput("");
    } catch (err: any) {
      setErrorMsg("Draft staging failed: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReply = (msg: GmailMessage) => {
    setToInput(msg.from.replace(/.*<(.+)>/, "$1").trim());
    setSubjectInput(msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`);
    setBodyInput(`\n\nOn ${msg.date}, ${msg.from} wrote:\n> ${msg.body.split("\n").join("\n> ")}`);
    setSelectedMsg(null);
    setComposeOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
            System Communication Hub
          </span>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mt-1">
            <Mail className="text-blue-400" size={18} />
            Gmail Inbox Node
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2">
          {googleToken ? (
            <button
              onClick={() => setComposeOpen(true)}
              className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold tracking-wider uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send size={12} />
              Compose Email
            </button>
          ) : (
            <button
              onClick={handleAuthorize}
              className="px-4 py-2 border border-blue-500/30 hover:border-blue-500 bg-blue-950/20 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles size={12} />
              Link Gmail Account
            </button>
          )}

          <button
            onClick={fetchEmails}
            disabled={loading}
            className="p-2 border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-40 cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Notifications bar */}
      {errorMsg && (
        <div className="p-3 border border-red-500/20 bg-red-950/10 text-red-400 text-xs font-mono rounded flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 border border-emerald-500/20 bg-emerald-950/10 text-emerald-400 text-xs font-mono rounded flex items-center gap-2">
          <Check size={14} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Demo simulation warning */}
      {isBypass && (
        <div className="p-3 border border-yellow-500/15 bg-yellow-950/5 text-yellow-400 text-xs font-mono rounded flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping shrink-0" />
            <span>Developer Bypass Active: Currently utilizing standard local communications mockup.</span>
          </div>
          <button 
            onClick={handleAuthorize}
            className="text-[9px] text-white underline font-bold uppercase cursor-pointer shrink-0 hover:text-blue-300"
          >
            [Authenticate Real Gmail]
          </button>
        </div>
      )}

      {/* Main Mail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Inbox List (Col: 5) */}
        <div className="lg:col-span-5 bg-neutral-950/30 border border-neutral-900 rounded p-4 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-neutral-600" size={14} />
            <form onSubmit={(e) => { e.preventDefault(); fetchEmails(); }}>
              <input
                type="text"
                placeholder="Search mail (e.g. subject, body, or from)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-black border border-neutral-900 text-xs text-white placeholder-neutral-700 rounded focus:outline-none focus:border-neutral-700 transition-colors"
              />
            </form>
          </div>

          {/* Mail Threads */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500 text-xs font-mono">
                <Loader2 size={24} className="animate-spin text-white" />
                <span>SYNCHRONIZING SECURE NODE COMMUNICATIONS...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-neutral-600 text-xs italic font-mono flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-900 p-4">
                <Inbox size={18} />
                <span>Your mailbox node is completely clean.</span>
              </div>
            ) : (
              messages.filter((msg, index, self) => self.findIndex(m => m.id === msg.id) === index).map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMsg(msg)}
                  className={`w-full text-left p-3 border rounded transition-all cursor-pointer flex flex-col space-y-1.5 ${
                    selectedMsg?.id === msg.id
                      ? "border-white bg-neutral-900/50"
                      : "border-neutral-900/40 bg-neutral-950/10 hover:border-neutral-800"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[140px] flex items-center gap-1">
                      <UserIcon size={10} className="shrink-0" />
                      {msg.from.replace(/ <.*/, "")}
                    </span>
                    <span className="text-[9px] text-neutral-600 font-mono whitespace-nowrap">
                      {msg.date.split(",")[0]}
                    </span>
                  </div>

                  <h4 className={`text-xs uppercase font-bold tracking-tight truncate ${msg.unread ? 'text-blue-400' : 'text-white'}`}>
                    {msg.unread && <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5" />}
                    {msg.subject}
                  </h4>

                  <p className="text-[10px] text-neutral-500 font-light line-clamp-2 leading-relaxed">
                    {msg.snippet}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Details Pane (Col: 7) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-white/10 p-6 rounded min-h-[400px] flex flex-col justify-between">
          {selectedMsg ? (
            <div className="space-y-6">
              {/* Message Header details */}
              <div className="border-b border-neutral-900 pb-4 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                      Secure Node Ingestion Header
                    </span>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight font-display mt-1">
                      {selectedMsg.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleReply(selectedMsg)}
                    className="px-3 py-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-[10px] font-mono text-neutral-300 hover:text-white uppercase flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CornerUpLeft size={10} />
                    Reply
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-1.5">
                  <div>
                    <span className="text-neutral-600">FROM:</span> {selectedMsg.from}
                  </div>
                  <div className="sm:text-right">
                    <span className="text-neutral-600">DATE:</span> {selectedMsg.date}
                  </div>
                  <div>
                    <span className="text-neutral-600">TO:</span> {selectedMsg.to}
                  </div>
                </div>
              </div>

              {/* Message Body details */}
              <div className="text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-2 bg-black/40 p-4 border border-neutral-900">
                {selectedMsg.body || selectedMsg.snippet}
              </div>

              <div className="pt-4 border-t border-neutral-900 flex justify-between items-center text-[9px] font-mono text-neutral-600 uppercase">
                <span>Thread ID: {selectedMsg.threadId}</span>
                <span>Security: SOC2 Verified Ingress</span>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center space-y-4 py-16">
              <div className="h-10 w-10 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600 mx-auto">
                <Mail size={18} />
              </div>
              <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                No Message Selected
              </h3>
              <p className="text-[11px] text-neutral-600 font-light max-w-xs mx-auto leading-normal">
                Select an intake transmission from your inbox sidebar node to read the full payload body, or compose a new notification.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Compose Email Modal Drawer */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-2xl w-full p-6 space-y-6 relative rounded shadow-2xl">
            
            {/* Close */}
            <button
              onClick={() => setComposeOpen(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header info */}
            <div>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                Stage Transmitter Payload
              </span>
              <h3 className="text-lg font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mt-1">
                <Send className="text-emerald-400" size={16} />
                Compose Transmission
              </h3>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <label className="sm:col-span-2 block text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Recipient To
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@domain.com"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  className="sm:col-span-10 w-full px-3 py-2 bg-black border border-neutral-900 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-neutral-700 transition-colors rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <label className="sm:col-span-2 block text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="Billing covers, clinical intakes..."
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="sm:col-span-10 w-full px-3 py-2 bg-black border border-neutral-900 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-neutral-700 transition-colors rounded"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  Transmitter Payload Body
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Draft your professional cover email, report summary, or response..."
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-neutral-900 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-neutral-700 transition-colors rounded font-mono resize-none"
                />
              </div>

              {/* Footer actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleCreateDraft}
                  disabled={sendingEmail}
                  className="px-4 py-2 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-xs font-mono font-bold tracking-wider text-neutral-400 hover:text-white uppercase rounded flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
                >
                  <FileText size={12} />
                  Save as Draft
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2 border border-neutral-900 bg-black text-xs font-mono tracking-wider text-neutral-500 hover:text-white uppercase rounded cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-6 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold tracking-wider uppercase rounded flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Disbursing...
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        Disburse Node
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
