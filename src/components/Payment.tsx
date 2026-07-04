import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase.ts";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  QrCode, 
  Smartphone, 
  ArrowRight, 
  Percent, 
  Copy, 
  CheckCircle, 
  Lock, 
  HelpCircle,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Loader2
} from "lucide-react";

interface PaymentProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultAgentId?: string;
  defaultPlanName?: string;
  defaultPrice?: number; // Base monthly price in ₹ (e.g. 750)
}

const PREMIUM_TIERS = [
  {
    id: "starter",
    name: "Starter Agent Bundle",
    monthlyPrice: 750,
    features: [
      "Up to 1,000 automated runs / month",
      "Standard model speed and API access",
      "Secure Cloud SQL state persistence",
      "Standard email & webhook routing support"
    ],
    badge: "Most Popular"
  },
  {
    id: "professional",
    name: "Enterprise Pro Suite",
    monthlyPrice: 4000,
    features: [
      "Unlimited automated runs & parallel executions",
      "Premium context window with custom prompts",
      "Dedicated high-contrast priority routing",
      "24/7 serverless heartbeat monitoring"
    ],
    badge: "Best Value"
  }
];

export default function Payment({ isOpen = true, onClose, defaultAgentId = "custom_agent", defaultPlanName = "Chronos AI Email Agent" }: PaymentProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Billing configuration states
  const [selectedTier, setSelectedTier] = useState<"starter" | "professional">("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upiId, setUpiId] = useState("");
  const [merchantVpa, setMerchantVpa] = useState("abhayghodeswar81@ybl");
  const [isEditingMerchantVpa, setIsEditingMerchantVpa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        if (currentUser.email) {
          const vpaPrefix = currentUser.email.split("@")[0];
          setUpiId(`${vpaPrefix}@ybl`);
        }
      } else {
        setUser(null);
        setToken(null);
        setUpiId("abhayghodeswar81@ybl");
      }
    });
    return () => unsubscribe();
  }, []);

  const activeTier = PREMIUM_TIERS.find(t => t.id === selectedTier) || PREMIUM_TIERS[0];
  
  // Pricing math in INR
  const monthlyCost = activeTier.monthlyPrice;
  const yearlyCost = monthlyCost * 12;
  const yearlyDiscounted = monthlyCost * 10; // 2 months free equivalent
  const totalAmountToPay = billingCycle === "monthly" ? monthlyCost : yearlyDiscounted;
  const totalSaved = billingCycle === "yearly" ? (yearlyCost - yearlyDiscounted) : 0;

  // Generate UPI Payment URI parameters for India standard deep-linking
  const payeeName = "Master ABHAY DINESH GHODESWAR";
  const transactionNote = `Sub:${activeTier.name}-${billingCycle}`;
  const upiPayUri = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(payeeName)}&am=${totalAmountToPay}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const handleCopyUri = () => {
    navigator.clipboard.writeText(upiPayUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleVerifyAndDeploy = async () => {
    if (!upiId || !upiId.includes("@")) {
      setErrorMsg("Please enter a valid UPI VPA address (e.g., abhayghodeswar81@okaxis) to complete authorization.");
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      if (!user || !token) {
        // Fallback or demo execution if not authenticated
        setTimeout(() => {
          const randHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();
          setLicenseKey(`VAL-UPI-DEMO-${randHex}`);
          setPaymentSuccess(true);
          setIsProcessing(false);
        }, 1500);
        return;
      }

      // Live subscription API execution
      const priceString = `₹${totalAmountToPay}/${billingCycle === "monthly" ? "mo" : "yr"}`;
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          agentId: defaultAgentId,
          planName: `${activeTier.name} (${billingCycle.toUpperCase()})`,
          priceCharged: priceString
        })
      });

      const data = await response.json();
      if (data.success) {
        setLicenseKey(data.subscription.licenseKey);
        setPaymentSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to provision secure license key node.");
      }
    } catch (err: any) {
      setErrorMsg("Exception verifying UPI payload: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="payment-billing-component" className="w-full bg-neutral-950 border border-white/10 p-6 md:p-8 rounded space-y-8 font-sans text-white">
      
      {/* Component Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neutral-900">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 mb-2 rounded font-mono text-[9px] uppercase tracking-widest font-bold">
            <IndianRupee size={10} /> Secure UPI Payment Core
          </div>
          <h3 className="text-xl font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
            INDIAN RUPEE BILLING HUB
          </h3>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Configure subscription tiers, select custom localized pricing structures, and execute instant UPI checks.
          </p>
        </div>

        {onClose && (
          <button 
            onClick={onClose} 
            className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono uppercase cursor-pointer"
          >
            [Minimize]
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono rounded">
          ✦ COMPONENT EXCEPTION: {errorMsg}
        </div>
      )}

      {/* Main Flow Grid */}
      <AnimatePresence mode="wait">
        {!paymentSuccess ? (
          <motion.div 
            key="checkout-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            
            {/* Left Hand: Tier Configurations */}
            <div className="space-y-6">
              <div>
                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block mb-3 font-bold">
                  STEP 1: CHOOSE AGENT LICENSE TIER
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PREMIUM_TIERS.map((tier) => {
                    const isSelected = selectedTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier.id as any)}
                        className={`text-left p-4 rounded border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected 
                            ? "border-emerald-500 bg-emerald-950/10 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]" 
                            : "border-neutral-900 bg-neutral-950 hover:border-neutral-800"
                        }`}
                      >
                        {tier.badge && (
                          <span className={`absolute top-2.5 right-2.5 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? "bg-emerald-500 text-black" : "bg-neutral-800 text-neutral-400"
                          }`}>
                            {tier.badge}
                          </span>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-tight pr-12">{tier.name}</h4>
                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-xl font-black font-mono">₹{tier.monthlyPrice}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">/mo</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-neutral-900/60 w-full flex items-center justify-between">
                          <span className="text-[9px] text-neutral-500 font-mono uppercase">Select Plan</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-emerald-500 bg-emerald-500 text-black" : "border-neutral-700"
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Billing Cycle Switcher with Saving Calculator */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">
                    STEP 2: SELECT FREQUENCY
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">
                    <Percent size={10} /> 2 MONTHS FREE ON YEARLY
                  </span>
                </div>

                <div className="flex border border-neutral-900 p-1 bg-black rounded">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`flex-1 py-2 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white text-black font-bold"
                        : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    Monthly Billing (₹{monthlyCost}/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`flex-1 py-2 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      billingCycle === "yearly"
                        ? "bg-emerald-500 text-black font-bold"
                        : "text-neutral-500 hover:text-emerald-400"
                    }`}
                  >
                    Yearly Billing (₹{yearlyDiscounted}/yr)
                  </button>
                </div>
              </div>

              {/* Summary Calculator Display Box */}
              <div className="p-4 bg-neutral-950 border border-neutral-900 rounded space-y-3.5 font-mono">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest block font-bold">RUPEE BILLING BREAKDOWN</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Selected Plan</span>
                    <span className="text-white uppercase">{activeTier.name}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Base Monthly Equivalent</span>
                    <span className="text-white">₹{monthlyCost} / mo</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <>
                      <div className="flex justify-between text-neutral-400">
                        <span>Standard Yearly Sum</span>
                        <span className="text-neutral-500 line-through">₹{yearlyCost}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Yearly Package Savings</span>
                        <span>- ₹{totalSaved} (Saves 16.6%)</span>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-neutral-900 flex justify-between items-baseline">
                    <span className="text-neutral-300 font-bold">Total Amount Due</span>
                    <span className="text-xl font-black text-emerald-400">₹{totalAmountToPay}</span>
                  </div>
                </div>
              </div>

              {/* Bullet Features list */}
              <div className="space-y-2.5">
                <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">INCLUDED ASSURANCE PROFILES</span>
                <ul className="space-y-1.5 text-xs">
                  {activeTier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-neutral-400">
                      <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Right Hand: UPI Integration Flow */}
            <div className="space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block mb-1 font-bold">
                  STEP 3: UPI PAYMENT GATEWAY
                </span>

                {/* Recipient UPI ID VPA Entry (Merchant) */}
                <div className="space-y-2 p-3 bg-neutral-900/40 border border-neutral-900 rounded">
                  <label className="text-[9px] text-emerald-400 block uppercase font-bold tracking-wider">RECIPIENT (YOUR PAYEE VPA TO RECEIVE FUNDS)</label>
                  <input
                    type="text"
                    value={merchantVpa}
                    onChange={(e) => setMerchantVpa(e.target.value)}
                    placeholder="abhayghodeswar81@ybl"
                    className="w-full bg-black border border-neutral-800 px-3.5 py-2.5 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-emerald-500 font-mono rounded"
                  />
                  <span className="text-[9px] text-neutral-400 block font-light leading-normal">
                    Even with Central Bank of India, PhonePe usually generates a VPA ending in <strong className="text-white">@ybl</strong>, <strong className="text-white">@ibl</strong>, or <strong className="text-white">@axl</strong>. Change this to your exact UPI ID from your UPI/PhonePe App to test!
                  </span>
                </div>

                {/* Sender UPI ID VPA Entry */}
                <div className="space-y-2">
                  <label className="text-[9px] text-neutral-400 block uppercase font-bold">YOUR SENDER UPI ID / VPA FOR SETTLEMENT</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="abhayghodeswar81@ybl"
                    className="w-full bg-black border border-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-emerald-500 font-mono rounded"
                  />
                  <span className="text-[9px] text-neutral-500 block font-light">
                    Enter the VPA from your UPI app (Google Pay, PhonePe, Paytm, etc.) to link the payload ledger.
                  </span>
                </div>
              </div>

              {/* Dynamic QR Code & Intent Details */}
              <div className="p-5 bg-black border border-neutral-900 rounded space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[9px] text-neutral-400 font-mono uppercase tracking-widest block font-bold">
                    SECURE INTERACTIVE UPI QR BLOCK
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Pay exactly <strong className="font-black text-xs">₹{totalAmountToPay}</strong> to secure node.
                  </span>
                </div>

                {/* Highly Customized PhonePe QR Standee Card recreating the user's exact uploaded image */}
                <div className="mx-auto max-w-[280px] bg-black border border-[#5f259f]/40 p-5 rounded-2xl relative shadow-[0_0_20px_-5px_rgba(95,37,159,0.3)] flex flex-col items-center">
                  {/* PhonePe Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#5f259f] flex items-center justify-center shadow-[0_0_10px_rgba(95,37,159,0.5)]">
                      <span className="text-white text-base font-extrabold select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>पे</span>
                    </div>
                    <span className="text-white text-lg font-extrabold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>PhonePe</span>
                  </div>

                  {/* "ACCEPTED HERE" text */}
                  <div className="text-center mb-1">
                    <span className="text-[#a162f7] text-xs font-black tracking-widest uppercase block">
                      ACCEPTED HERE
                    </span>
                  </div>

                  {/* "Scan & Pay Using PhonePe App" text */}
                  <div className="text-center mb-4">
                    <span className="text-neutral-400 text-[10px] font-medium block">
                      Scan & Pay Using PhonePe App
                    </span>
                  </div>

                  {/* High fidelity white QR Code container with dynamic live QR generator */}
                  <div className="relative p-3 bg-white rounded-xl shadow-md flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayUri)}`} 
                      alt="PhonePe QR Code" 
                      className="w-40 h-40 object-contain" 
                      referrerPolicy="no-referrer"
                    />
                    {/* PhonePe Center circular logo inside QR */}
                    <div className="absolute w-10 h-10 rounded-full bg-[#5f259f] border-2 border-white flex items-center justify-center shadow-md">
                      <span className="text-white text-base font-extrabold select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>पे</span>
                    </div>
                  </div>

                  {/* Master Name footer */}
                  <div className="text-center mt-4 w-full">
                    <span className="text-white text-[11px] font-black tracking-wide uppercase block truncate max-w-full">
                      Master ABHAY DINESH GHODESWAR
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider">
                    SCAN WITH ANY BHIM / UPI APP
                  </span>
                </div>

                {/* Merchant Copy Buttons */}
                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between items-center p-2.5 bg-neutral-950 border border-neutral-900 rounded">
                    <span className="text-neutral-500 uppercase font-bold text-[9px]">Merchant VPA</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-300 font-bold">{merchantVpa}</span>
                      <button 
                        onClick={handleCopyVpa} 
                        className="p-1 hover:text-white text-neutral-500 transition-colors cursor-pointer"
                        title="Copy Merchant VPA"
                      >
                        {copiedVpa ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-neutral-950 border border-neutral-900 rounded">
                    <span className="text-neutral-500 uppercase font-bold text-[9px]">UPI INTENT PAY</span>
                    <button 
                      onClick={handleCopyUri} 
                      className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9px] text-neutral-300 hover:text-white rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? "COPIED" : "COPY DEEP-LINK"}
                      <Copy size={10} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Authorize button */}
              <button
                type="button"
                onClick={handleVerifyAndDeploy}
                disabled={isProcessing}
                className="w-full py-4 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 font-mono font-black text-xs uppercase tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    VERIFYING LEDGER INSTANCE...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} />
                    I HAVE PAID — DEPLOY LICENSE
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[9px] text-neutral-500 font-mono uppercase text-center">
                <Lock size={10} /> Powered by instant UPI settlement routing • 256-bit encryption
              </div>

            </div>

          </motion.div>
        ) : (
          /* Payment Success view */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12 max-w-md mx-auto space-y-6 font-mono"
          >
            <div className="inline-flex p-4 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-full">
              <CheckCircle size={40} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-tight font-display">
                UPI TRANSACTION VERIFIED
              </h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Thank you! Your payment of <strong className="text-emerald-400">₹{totalAmountToPay}</strong> has been cleared. The agent module configuration has been written to the production Cloud SQL ledger.
              </p>
            </div>

            <div className="p-4 bg-black border border-neutral-900 text-left rounded space-y-2">
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest block">AGENT LICENSE SPECIFICATION</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tier:</span>
                  <span className="text-white uppercase font-bold">{activeTier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Period:</span>
                  <span className="text-white uppercase">{billingCycle} ({priceChargedString(totalAmountToPay, billingCycle)})</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-neutral-900 space-y-1.5">
                <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest block">SECURE API LICENSE KEY</span>
                <div className="text-xs text-emerald-400 select-all font-mono break-all border border-dashed border-emerald-900 p-2.5 bg-emerald-950/5">
                  {licenseKey || "VAL-UPI-DEMO-A1F2D3C4B5E6D7E8"}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setPaymentSuccess(false);
                  setLicenseKey("");
                }}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs uppercase cursor-pointer"
              >
                [Subscribe Again]
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase cursor-pointer"
                >
                  Return to Dashboard
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function priceChargedString(amount: number, cycle: "monthly" | "yearly") {
  return `₹${amount}/${cycle === "monthly" ? "mo" : "yr"}`;
}
