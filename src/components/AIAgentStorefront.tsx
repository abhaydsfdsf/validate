import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, googleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "../lib/firebase.ts";
import { 
  Sparkles, 
  Lock, 
  Check, 
  CreditCard, 
  Key, 
  Layers, 
  ShieldCheck, 
  Loader2, 
  CheckCircle, 
  ArrowRight, 
  TrendingUp,
  Percent
} from "lucide-react";

interface Subscription {
  id: number;
  agentId: string;
  planName: string;
  status: string;
  licenseKey: string;
  priceCharged: string;
  createdAt: string;
}

const AGENTS_LIST = [
  {
    id: "email_sorter",
    name: "Chronos AI Email Agent",
    tagline: "Automated Inbox Management & Routing",
    icon: ShieldCheck,
    description: "Connects to inbound mailboxes, classifies urgent requests, filters out spam, routes invoices, and prepares structured response drafts automatically.",
    features: [
      "Real-time semantic routing",
      "Dynamic auto-replies",
      "Net-15 client invoices filtering",
      "Spam & telemetry exclusion",
    ],
    pricing: {
      starter: {
        monthly: { name: "Chronos Starter (Monthly)", price: "₹750", interval: "mo", description: "Up to 1,000 routed emails / month" },
        yearly: { name: "Chronos Starter (Yearly)", price: "₹7,500", interval: "yr", description: "Up to 1,000 routed emails / month (Billed ₹7,500/year - Saves ₹1,500)" }
      },
      professional: {
        monthly: { name: "Chronos Pro (Monthly)", price: "₹2,000", interval: "mo", description: "Unlimited routed emails, custom context learning" },
        yearly: { name: "Chronos Pro (Yearly)", price: "₹20,000", interval: "yr", description: "Unlimited routed emails, custom context learning (Billed ₹20,000/year - Saves ₹4,000)" }
      }
    },
  },
  {
    id: "travel_planner",
    name: "Atlas AI Travel Agent",
    tagline: "Precision Lifestyle & Itinerary Planner",
    icon: Sparkles,
    description: "Designs bespoke, weatherproof, active-pace travel schedules with luxury food pairings and transit recommendations customized to localized seasons.",
    features: [
      "Interactive multi-day routing",
      "Weather-proof alternative planning",
      "Curated lifestyle experiences",
      "Direct transit maps estimation",
    ],
    pricing: {
      starter: {
        monthly: { name: "Atlas Starter (Monthly)", price: "₹950", interval: "mo", description: "Up to 15 compiled travel nodes / month" },
        yearly: { name: "Atlas Starter (Yearly)", price: "₹9,500", interval: "yr", description: "Up to 15 compiled travel nodes / month (Billed ₹9,500/year - Saves ₹1,900)" }
      },
      professional: {
        monthly: { name: "Atlas Pro (Monthly)", price: "₹2,500", interval: "mo", description: "Unlimited travel compilations, live weather integrations" },
        yearly: { name: "Atlas Pro (Yearly)", price: "₹25,000", interval: "yr", description: "Unlimited travel compilations, live weather integrations (Billed ₹25,000/year - Saves ₹5,000)" }
      }
    },
  },
  {
    id: "patient_triage",
    name: "Asclepius AI Triage Agent",
    tagline: "Symptom Classification & Intake Prep",
    icon: Layers,
    description: "Helps medical practitioners check in patients securely, grading the urgency level (Low/Medium/High) and generating clinical preparation sheets.",
    features: [
      "High-contrast urgency warning system",
      "Secure patient-record intake notes",
      "Diagnostic check-up preparation queries",
      "Strict data classification compliant layout",
    ],
    pricing: {
      starter: {
        monthly: { name: "Asclepius Starter (Monthly)", price: "₹1,500", interval: "mo", description: "Up to 100 patient entries / month" },
        yearly: { name: "Asclepius Starter (Yearly)", price: "₹15,000", interval: "yr", description: "Up to 100 patient entries / month (Billed ₹15,000/year - Saves ₹3,000)" }
      },
      professional: {
        monthly: { name: "Asclepius Pro (Monthly)", price: "₹4,000", interval: "mo", description: "Unlimited patient intake sheets, premium security tier" },
        yearly: { name: "Asclepius Pro (Yearly)", price: "₹40,000", interval: "yr", description: "Unlimited patient intake sheets, premium security tier (Billed ₹40,000/year - Saves ₹8,000)" }
      }
    },
  },
  {
    id: "auto_billing",
    name: "Scribe AI Billing Agent",
    tagline: "Automated Deliverable Invoicing",
    icon: Key,
    description: "Injest project bullet points, calculates subtotals automatically, and generates custom Net-15 payment request cover emails.",
    features: [
      "Instant invoice calculations",
      "Professional template compilation",
      "Recurring reminder triggers",
      "Simultaneous client delivery notes",
    ],
    pricing: {
      starter: {
        monthly: { name: "Scribe Starter (Monthly)", price: "₹850", interval: "mo", description: "Up to 50 active billing invoices / month" },
        yearly: { name: "Scribe Starter (Yearly)", price: "₹8,500", interval: "yr", description: "Up to 50 active billing invoices / month (Billed ₹8,500/year - Saves ₹1,700)" }
      },
      professional: {
        monthly: { name: "Scribe Pro (Monthly)", price: "₹2,200", interval: "mo", description: "Unlimited billing compilation, dual currency conversions" },
        yearly: { name: "Scribe Pro (Yearly)", price: "₹22,000", interval: "yr", description: "Unlimited billing compilation, dual currency conversions (Billed ₹22,000/year - Saves ₹4,400)" }
      }
    },
  },
];

export default function AIAgentStorefront() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Marketplace states
  const [selectedTier, setSelectedTier] = useState<"starter" | "professional">("starter");
  const [selectedFrequency, setSelectedFrequency] = useState<"monthly" | "yearly">("monthly");
  const [buyingAgent, setBuyingAgent] = useState<typeof AGENTS_LIST[0] | null>(null);
  const [submittingSubscription, setSubmittingSubscription] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"plan" | "payment" | "success">("plan");
  
  // Simulated Card Info
  const [cardNumber, setCardNumber] = useState("4000 1234 5678 9010");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCVC, setCardCVC] = useState("321");

  // UPI payment billing states
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("");
  const [storefrontMerchantVpa, setStorefrontMerchantVpa] = useState("abhayghodeswar81@ybl");

  // Pre-fill UPI ID when user signs in
  useEffect(() => {
    if (user && user.email) {
      const username = user.email.split("@")[0];
      setUpiId(`${username}@ybl`);
    } else {
      setUpiId("abhayghodeswar81@ybl");
    }
  }, [user]);

  const activePlanForUpi = buyingAgent ? buyingAgent.pricing[selectedTier][selectedFrequency] : null;
  const activePriceForUpi = activePlanForUpi ? parseInt(activePlanForUpi.price.replace(/[^0-9]/g, ""), 10) : 0;
  const storefrontUpiUri = buyingAgent 
    ? `upi://pay?pa=${storefrontMerchantVpa}&pn=Master%20ABHAY%20DINESH%20GHODESWAR&am=${activePriceForUpi}&cu=INR&tn=${encodeURIComponent(`Sub:${buyingAgent.name}-${selectedFrequency}`)}` 
    : `upi://pay?pa=${storefrontMerchantVpa}&pn=Master%20ABHAY%20DINESH%20GHODESWAR&am=750&cu=INR&tn=Agent-Sub`;

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        loadUserSubscriptions(idToken);
      } else {
        if (localStorage.getItem("mock_user_active") === "true") {
          return;
        }
        setUser(null);
        setToken(null);
        setSubscriptions([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserSubscriptions = async (idToken: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
      }
    } catch (e) {
      console.error("Failed to load subscription nodes:", e);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      
      // Sync user profile
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      setSuccessMsg("Google Identity verified successfully!");
      loadUserSubscriptions(idToken);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Identity verification aborted: " + err.message);
    }
  };

  const handleBypassLogin = async () => {
    setErrorMsg(null);
    try {
      localStorage.setItem("mock_user_active", "true");
      const mockUser = {
        uid: "mock-uid-abhayghodeswar81",
        email: "abhayghodeswar81@gmail.com",
        displayName: "Abhay Ghodeswar (Demo)",
        getIdToken: async () => "mock-secret-agent-bypass-token"
      } as any;
      setUser(mockUser);
      setToken("mock-secret-agent-bypass-token");
      setSuccessMsg("Developer Bypass active! Subscriptions unlocked.");
      setTimeout(() => setSuccessMsg(null), 3000);
      loadUserSubscriptions("mock-secret-agent-bypass-token");
    } catch (err: any) {
      setErrorMsg("Bypass initialization aborted: " + err.message);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg(null);
    try {
      localStorage.removeItem("mock_user_active");
      await signOut(auth);
      setUser(null);
      setToken(null);
      setSubscriptions([]);
      setSuccessMsg("Session signed out securely.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Failed to sign out cleanly: " + err.message);
    }
  };

  const handleCheckoutInit = (agent: typeof AGENTS_LIST[0]) => {
    if (!user) {
      setErrorMsg("Please Authenticate with Google above before initiating an agent subscription.");
      return;
    }
    setBuyingAgent(agent);
    setCheckoutStep("payment");
    setErrorMsg(null);
  };

  const handleProcessPurchase = async () => {
    if (!buyingAgent || !token) return;
    setSubmittingSubscription(true);
    setErrorMsg(null);

    const activePlan = buyingAgent.pricing[selectedTier][selectedFrequency];
    const priceString = `${activePlan.price}/${activePlan.interval}`;

    try {
      // Dispatch securely to our Cloud SQL back-end
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: buyingAgent.id,
          planName: activePlan.name,
          priceCharged: priceString,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCheckoutStep("success");
        setSuccessMsg(`Successfully subscribed to ${buyingAgent.name}!`);
        loadUserSubscriptions(token);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error || "Subscription initialization failed.");
      }
    } catch (err: any) {
      setErrorMsg("Secure checkout error: " + err.message);
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const isSubscribedTo = (agentId: string) => {
    return subscriptions.some(sub => sub.agentId === agentId && sub.status === "Active");
  };

  const getSubscriptionDetails = (agentId: string) => {
    return subscriptions.find(sub => sub.agentId === agentId && sub.status === "Active");
  };

  return (
    <section id="subscription-store-section" className="w-full bg-black border-b border-white/10 py-20 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-neutral-900 mb-4 animate-bounce">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-[10px] tracking-widest font-mono text-neutral-300 uppercase font-bold">
              AI AGENT SAAS STOREFRONT
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white uppercase">
            AGENT LICENSE MARKETPLACE
          </h2>
          <p className="max-w-2xl mx-auto text-sm text-neutral-400 font-light mt-3">
            Acquire and deploy secure AI agents natively in Indian Rupees (₹). Select your package tier, leverage 2 months free with Yearly billing, and receive a Cloud SQL persisted License Key immediately.
          </p>
        </div>

        {/* Global States */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono rounded"
            >
              ✦ SYSTEM EXCEPTION: {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded"
            >
              ✦ TELEMETRY LOCK: {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Gate and Billing Cycle Toggle */}
        <div className="bg-neutral-950 border border-white/10 p-6 md:p-8 rounded mb-12 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded border ${user ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-neutral-800 bg-neutral-900/50 text-neutral-500'}`}>
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-display tracking-tight">
                {user ? `IDENTITY LOCK ACTIVE: ${user.email}` : "GATEWAY AUTHENTICATION REQUIRED"}
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                {user ? "Cloud SQL active-tunnel sync completed. Ready to deploy subscription instances." : "Authenticate to acquire and persist active agent tokens."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Tier selection */}
            <div className="border border-neutral-800 p-1 rounded bg-black flex">
              <button
                onClick={() => setSelectedTier("starter")}
                className={`px-4 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                  selectedTier === "starter"
                    ? "bg-white text-black font-bold"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                Starter Tier
              </button>
              <button
                onClick={() => setSelectedTier("professional")}
                className={`px-4 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                  selectedTier === "professional"
                    ? "bg-white text-black font-bold"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                Professional Tier
              </button>
            </div>

            {/* Billing cycle frequency */}
            <div className="border border-neutral-800 p-1 rounded bg-black flex items-center">
              <button
                onClick={() => setSelectedFrequency("monthly")}
                className={`px-4 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                  selectedFrequency === "monthly"
                    ? "bg-white text-black font-bold"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedFrequency("yearly")}
                className={`px-4 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1 ${
                  selectedFrequency === "yearly"
                    ? "bg-emerald-500 text-black font-bold"
                    : "text-neutral-500 hover:text-emerald-400"
                }`}
              >
                Yearly
                <span className="text-[8px] bg-black/15 text-white px-1 py-0.5 rounded font-bold">SAVE ₹</span>
              </button>
            </div>

            {/* Auth Button */}
            {!user ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-5 py-2 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-wider uppercase rounded transition-all cursor-pointer"
                >
                  Secure Login with Google
                </button>
                <button
                  type="button"
                  onClick={handleBypassLogin}
                  className="px-5 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-yellow-400 text-[11px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer"
                >
                  Bypass Login
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-[11px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Interactive Payment Checkout Dialog */}
        <AnimatePresence>
          {buyingAgent && checkoutStep !== "plan" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-neutral-950 border border-white/10 w-full max-w-md p-6 rounded space-y-6 text-white font-mono"
              >
                
                {/* Checkout Header */}
                <div className="flex justify-between items-center pb-4 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-neutral-400" size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">SECURE INSTANCE PROVISIONING</span>
                  </div>
                  <button 
                    onClick={() => setBuyingAgent(null)} 
                    className="text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    [CLOSE]
                  </button>
                </div>

                {checkoutStep === "payment" && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">SELECTED CONFIGURATION</span>
                      <div className="p-3 bg-black border border-neutral-900 rounded">
                        <div className="text-xs font-bold uppercase text-white">{buyingAgent.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          Tier: <span className="text-white font-bold uppercase">{selectedTier}</span> | 
                          Billing: <span className="text-emerald-400 font-bold uppercase">{selectedFrequency}</span> | 
                          Charge: <span className="text-emerald-400 font-bold">{buyingAgent.pricing[selectedTier][selectedFrequency].price}/{buyingAgent.pricing[selectedTier][selectedFrequency].interval}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Selector Tabs */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">PAYMENT SYSTEM</span>
                      <div className="flex border border-neutral-900 rounded p-1 bg-black gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("upi");
                            setErrorMsg(null);
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                            paymentMethod === "upi"
                              ? "bg-emerald-500 text-black font-bold"
                              : "text-neutral-500 hover:text-white"
                          }`}
                        >
                          UPI (Instant ₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("card");
                            setErrorMsg(null);
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                            paymentMethod === "card"
                              ? "bg-white text-black font-bold"
                              : "text-neutral-500 hover:text-white"
                          }`}
                        >
                          Credit Card
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "upi" ? (
                      /* High-fidelity UPI billing view */
                      <div className="space-y-4 border-t border-neutral-900 pt-4">
                        {/* Recipient Payee VPA config */}
                        <div className="space-y-2 p-2.5 bg-neutral-900/40 border border-neutral-900 rounded">
                          <label className="text-[9px] text-emerald-400 block uppercase font-bold tracking-wider">RECIPIENT VPA (YOUR PAYEE ADDRESS)</label>
                          <input 
                            type="text" 
                            value={storefrontMerchantVpa} 
                            onChange={(e) => setStorefrontMerchantVpa(e.target.value)}
                            placeholder="abhayghodeswar81@ybl"
                            className="w-full bg-black border border-neutral-800 px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-emerald-500 font-mono rounded"
                          />
                          <span className="text-[8px] text-neutral-400 block leading-normal">
                            PhonePe UPI IDs usually end in <strong className="text-white">@ybl</strong>, <strong className="text-white">@ibl</strong>, or <strong className="text-white">@axl</strong> even if your linked account is with Central Bank of India. Modify to your exact active VPA!
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] text-neutral-400 block uppercase font-bold">ENTER SENDER UPI ID (VPA)</label>
                          <input 
                            type="text" 
                            value={upiId} 
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="abhayghodeswar81@ybl"
                            className="w-full bg-black border border-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {["@okaxis", "@oksbi", "@okicici", "@paytm", "@ybl"].map(suffix => (
                              <button
                                key={suffix}
                                type="button"
                                onClick={() => {
                                  const base = upiId.includes("@") ? upiId.split("@")[0] : upiId || "abhayghodeswar81";
                                  setUpiId(`${base}${suffix}`);
                                }}
                                className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9px] text-neutral-400 hover:text-white rounded font-mono transition-colors cursor-pointer"
                              >
                                {suffix}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* QR Code section */}
                        <div className="flex flex-col items-center justify-center p-4 bg-black border border-neutral-900 rounded space-y-3">
                          <span className="text-[8px] text-neutral-500 font-mono uppercase tracking-widest">OR SCAN SECURE MATCHING QR</span>
                          
                          {/* Highly Customized PhonePe QR Standee Card recreating the user's exact uploaded image */}
                          <div className="mx-auto w-full max-w-[240px] bg-black border border-[#5f259f]/40 p-4 rounded-xl relative shadow-[0_0_15px_-5px_rgba(95,37,159,0.3)] flex flex-col items-center">
                            {/* PhonePe Header */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-6 h-6 rounded-full bg-[#5f259f] flex items-center justify-center shadow-[0_0_8px_rgba(95,37,159,0.5)]">
                                <span className="text-white text-xs font-extrabold select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>पे</span>
                              </div>
                              <span className="text-white text-sm font-extrabold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>PhonePe</span>
                            </div>

                            {/* "ACCEPTED HERE" text */}
                            <div className="text-center mb-0.5">
                              <span className="text-[#a162f7] text-[10px] font-black tracking-widest uppercase block">
                                ACCEPTED HERE
                              </span>
                            </div>

                            {/* "Scan & Pay Using PhonePe App" text */}
                            <div className="text-center mb-3">
                              <span className="text-neutral-400 text-[8px] font-medium block">
                                Scan & Pay Using PhonePe App
                              </span>
                            </div>

                            {/* High fidelity white QR Code container with dynamic live QR generator */}
                            <div className="relative p-2.5 bg-white rounded-lg shadow-md flex items-center justify-center">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(storefrontUpiUri)}`} 
                                alt="PhonePe QR Code" 
                                className="w-28 h-28 object-contain" 
                                referrerPolicy="no-referrer"
                              />
                              {/* PhonePe Center circular logo inside QR */}
                              <div className="absolute w-7 h-7 rounded-full bg-[#5f259f] border-2 border-white flex items-center justify-center shadow-md">
                                <span className="text-white text-[10px] font-extrabold select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>पे</span>
                              </div>
                            </div>

                            {/* Master Name footer */}
                            <div className="text-center mt-3 w-full">
                              <span className="text-white text-[9px] font-black tracking-wide uppercase block truncate max-w-full">
                                Master ABHAY DINESH GHODESWAR
                              </span>
                            </div>
                          </div>

                          <span className="text-[9px] text-neutral-400 font-mono text-center">
                            Scan with Google Pay, PhonePe, Paytm, or BHIM
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Minimalist Card Simulator */
                      <div className="space-y-3 border-t border-neutral-900 pt-4">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">PROVISIONING LEDGER (DEMO CARD PRE-FILL)</span>
                        <div>
                          <label className="text-[9px] text-neutral-400 block mb-1">CREDIT CARD NUMBER</label>
                          <input 
                            type="text" 
                            value={cardNumber} 
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-black border border-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-neutral-400 block mb-1">EXPIRY DATE</label>
                            <input 
                              type="text" 
                              value={cardExpiry} 
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full bg-black border border-neutral-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-neutral-400 block mb-1">CVC SECURITY CODE</label>
                            <input 
                              type="password" 
                              value={cardCVC} 
                              onChange={(e) => setCardCVC(e.target.value)}
                              className="w-full bg-black border border-neutral-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleProcessPurchase}
                      disabled={submittingSubscription}
                      className="w-full py-3 bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {submittingSubscription ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                      {paymentMethod === "upi" ? "AUTHORIZE & VERIFY UPI" : "AUTHORIZE AND INITIATE KEY"}
                    </button>
                  </div>
                )}

                {checkoutStep === "success" && (
                  <div className="space-y-4 text-center py-6">
                    <div className="inline-flex p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-full mb-2">
                      <CheckCircle size={32} className="animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold uppercase text-white">AGENT DEPLOYED SUCCESSFULLY</h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Your unique secure API key has been generated and written permanently to your Cloud SQL Database block.
                    </p>

                    <div className="p-3 bg-black border border-neutral-900 text-left rounded space-y-1.5">
                      <span className="text-[9px] text-neutral-500">SECURE AGENT TOKEN</span>
                      <div className="text-xs text-emerald-400 font-mono select-all break-all border border-dashed border-emerald-900 p-2 bg-emerald-950/5">
                        {getSubscriptionDetails(buyingAgent.id)?.licenseKey || "GENERATING..."}
                      </div>
                    </div>

                    <button
                      onClick={() => setBuyingAgent(null)}
                      className="mt-4 px-6 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs uppercase cursor-pointer"
                    >
                      [RETURN TO MARKETPLACE]
                    </button>
                  </div>
                )}

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {AGENTS_LIST.map((agent) => {
            const hasLicense = isSubscribedTo(agent.id);
            const activeSub = getSubscriptionDetails(agent.id);
            const activePlan = agent.pricing[selectedTier][selectedFrequency];

            return (
              <div 
                key={agent.id} 
                className={`bg-neutral-950 border rounded p-6 md:p-8 flex flex-col justify-between transition-all ${
                  hasLicense 
                    ? "border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]" 
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded border ${
                        hasLicense 
                          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' 
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}>
                        <agent.icon size={22} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white uppercase tracking-tight font-display">{agent.name}</h3>
                        <p className="text-[10px] text-neutral-500 font-mono uppercase">{agent.tagline}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg md:text-2xl font-bold font-mono text-white">{activePlan.price}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">/{activePlan.interval}</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed font-light mb-6">
                    {agent.description}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2 mb-8 text-[11px] font-mono text-neutral-500">
                    {agent.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check size={12} className="text-neutral-400" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Button / Token Status */}
                <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left w-full sm:w-auto">
                    <span className="text-[9px] text-neutral-500 font-mono block uppercase">PLAN FOCUS</span>
                    <span className="text-xs text-white font-mono font-bold uppercase">{activePlan.name}</span>
                  </div>

                  {hasLicense ? (
                    <div className="w-full sm:w-auto flex flex-col items-end">
                      <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1 uppercase mb-1">
                        <CheckCircle size={10} /> ACTIVE LICENSE
                      </span>
                      <span className="text-[9px] text-neutral-500 font-mono select-all truncate max-w-[160px] border border-dashed border-neutral-800 p-1 bg-black">
                        {activeSub?.licenseKey}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckoutInit(agent)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      Deploy Agent
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* User Active Licenses Node List */}
        {user && subscriptions.length > 0 && (
          <div className="mt-16 bg-neutral-950 border border-emerald-500/10 p-6 md:p-8 rounded">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider pb-3 border-b border-neutral-900 flex items-center gap-2 mb-6">
              <Key size={14} className="text-emerald-400" />
              DEPLOYED ACTIVE LICENSES (CLOUD SQL PERSISTED)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-neutral-400">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500">
                    <th className="pb-3 uppercase tracking-wider font-bold">AGENT MODULE</th>
                    <th className="pb-3 uppercase tracking-wider font-bold">LICENSE PLAN</th>
                    <th className="pb-3 uppercase tracking-wider font-bold">SECURE TUNNEL KEY</th>
                    <th className="pb-3 uppercase tracking-wider font-bold">FEE SUBTOTAL</th>
                    <th className="pb-3 uppercase tracking-wider font-bold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {subscriptions.map((sub) => {
                    const matchedAgent = AGENTS_LIST.find(ag => ag.id === sub.agentId);
                    return (
                      <tr key={sub.id} className="hover:bg-neutral-900/40">
                        <td className="py-4 text-white font-bold font-display uppercase">{matchedAgent?.name || sub.agentId}</td>
                        <td className="py-4 uppercase text-neutral-300">{sub.planName}</td>
                        <td className="py-4 select-all text-neutral-400">{sub.licenseKey}</td>
                        <td className="py-4 text-emerald-400 font-bold">{sub.priceCharged}</td>
                        <td className="py-4">
                          <span className="inline-flex px-2 py-0.5 border border-emerald-500/20 bg-emerald-950/10 text-emerald-400 text-[9px] font-bold uppercase rounded">
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
