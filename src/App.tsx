import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Menu, 
  X, 
  Cpu, 
  Check, 
  ArrowUpRight, 
  ChevronDown, 
  MessageSquare, 
  Zap, 
  Play, 
  Activity, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText,
  Mail,
  Send,
  Info
} from "lucide-react";

import NetflixIntro from "./components/NetflixIntro";
import AIBlueprintGenerator from "./components/AIBlueprintGenerator";
import AISolutionsWorkspace from "./components/AISolutionsWorkspace";
import AIAgentStorefront from "./components/AIAgentStorefront";
import EngagementPlanner from "./components/EngagementPlanner";
import { LiveChatWidget } from "./components/LiveChatWidget";
import Payment from "./components/Payment";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<number | null>(0);
  
  // Contact Form State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientProblem, setClientProblem] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState("");

  // Auto-close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Session tracking state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const updateSession = () => {
      const saved = localStorage.getItem("validate_user_session");
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    
    updateSession();
    window.addEventListener("storage", updateSession);
    const interval = setInterval(updateSession, 2000);
    return () => {
      window.removeEventListener("storage", updateSession);
      clearInterval(interval);
    };
  }, []);

  // Form submission handler
  const handleInquirySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientProblem) return;

    setSubmittingInquiry(true);
    // Simulate high-fidelity network logging validation
    setTimeout(() => {
      setSubmittingInquiry(false);
      setSubmittedInquiry(true);
      const randomTicket = `VAL-${Math.floor(1000 + Math.random() * 9000)}-${clientName.substring(0, 3).toUpperCase()}`;
      setGeneratedTicket(randomTicket);
    }, 1500);
  };

  const handleScrollTo = (elementId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Pre-coded interactive solution categories
  const solutions = [
    {
      id: 0,
      title: "Automated Email Billing & Invoicing",
      subtitle: "Eliminate manual accounts tracking for small businesses with automated email billing.",
      roi: "Reduces DSO by 8 days & saves 10 hours/month of billing work.",
      problems: [
        "Chasing outstanding invoices and draft follow-up reminders manually.",
        "Synthesizing completed service hours or timesheet logs into customer-ready bills.",
        "Composing polite and professional cover emails manually for each single payment cycle."
      ],
      stack: "n8n, Make.com, n8n-webhooks, Stripe billing API, SendGrid Node"
    },
    {
      id: 1,
      title: "Doctors Patient Priority & Intake Organizer",
      subtitle: "Consolidate symptoms and clinical intake forms into a prioritized check-in priority sheet.",
      roi: "Reduces clinician intake triage times by 2 hours daily.",
      problems: [
        "Sorting patient intake requests manually under high operational pressure.",
        "Failing to immediately isolate critical symptoms or emergency red flags.",
        "Scattered clinical documents without a clean daily consult sequence tracker."
      ],
      stack: "Gemini Flash models, HIPAA-compliant encryption pipelines, human-in-the-loop clinical dashboards"
    },
    {
      id: 2,
      title: "Lifestyle Travel & Itinerary Planners",
      subtitle: "Plan tailored custom itineraries, localized packing lists, and local safety rules.",
      roi: "Saves 15+ hours of fragmented research and planning per trip.",
      problems: [
        "Manually organizing fragmented transit schedules, dinner reservations, and tours.",
        "Trying to match packing checklist lists with changing seasonal local climates.",
        "Missing crucial cultural nuances, transit options, and local guides during trips."
      ],
      stack: "Gemini models, Google Maps Platform SDK, OpenWeather API integrations"
    },
    {
      id: 3,
      title: "Adaptive Study Planners & Flashcard Synthesizer",
      subtitle: "Instantly translate course syllabi and lecture files into structured preparation schedules.",
      roi: "Boosts syllabus retention by 40% and eliminates test prep anxiety.",
      problems: [
        "Feeling overwhelmed by disorganized semester schedules and large exam topics.",
        "Spending hours drafting raw flashcards and practice test questions manually.",
        "Inefficient study pacing and lack of direct active-recall checkpoints."
      ],
      stack: "RAG index, concept chunking nodes, interactive recall simulators"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Intro Animation Layer */}
      <AnimatePresence>
        {showIntro && (
          <NetflixIntro onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* Main Landing Page View */}
      {!showIntro && (
        <motion.div
          id="main-landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col min-h-screen"
        >
          {/* Stark Navigation Header */}
          <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              
              {/* Brand Logo & Tag */}
              <div 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-4 cursor-pointer group"
              >
                <div className="bg-white text-black font-black px-2.5 py-0.5 text-lg tracking-tighter transition-transform group-hover:scale-95">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-display font-black tracking-[0.2em] text-white leading-none">
                    VALIDATE
                  </span>
                  <span className="text-[8px] font-mono tracking-[0.3em] text-neutral-500 uppercase mt-1">
                    EST. 2026 / LABS
                  </span>
                </div>
              </div>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-12 text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400">
                <button onClick={() => handleScrollTo("solutions-grid")} className="hover:text-white transition-colors cursor-pointer">
                  Solutions
                </button>
                <button onClick={() => handleScrollTo("blueprint-section")} className="hover:text-white transition-colors cursor-pointer">
                  AI Blueprint
                </button>
                <button onClick={() => handleScrollTo("workspace-section")} className="hover:text-white transition-colors cursor-pointer">
                  AI Workspace
                </button>
                <button onClick={() => handleScrollTo("subscription-store-section")} className="hover:text-white transition-colors cursor-pointer text-emerald-400 font-bold">
                  Agent Store
                </button>
                <button onClick={() => handleScrollTo("planner-section")} className="hover:text-white transition-colors cursor-pointer">
                  Scoping Planner
                </button>
                <button onClick={() => handleScrollTo("waitlist-section")} className="text-white border-b border-white pb-1 hover:text-neutral-300 hover:border-neutral-300 transition-colors cursor-pointer">
                  Contact & Waitlist
                </button>
              </nav>

              {/* Utility / Replay Trigger */}
              <div className="hidden md:flex items-center gap-4">
                {currentUser ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-emerald-500/30 bg-neutral-950 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="truncate max-w-[120px]">NODE: {currentUser.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-neutral-950 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                    <span className="h-1.5 w-1.5 bg-neutral-800 rounded-full" />
                    <span>GUEST SECURE-NODE</span>
                  </div>
                )}

                <button
                  id="header-replay-btn"
                  onClick={() => setShowIntro(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition-colors rounded-full text-[10px] font-mono tracking-widest text-neutral-400 uppercase"
                  title="Replay B&W Startup Animation"
                >
                  <Play size={10} className="fill-current" />
                  Replay Intro
                </button>

                <button 
                  id="header-diagnostics-btn"
                  onClick={() => handleScrollTo("blueprint-section")}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold tracking-widest uppercase rounded transition-all cursor-pointer"
                >
                  RUN DIAGNOSTICS
                </button>
              </div>

              {/* Mobile Burger Trigger */}
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

            </div>
          </header>

          {/* Mobile Sidebar Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                id="mobile-sidebar"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed inset-x-0 top-[69px] z-30 bg-neutral-950 border-b border-white/10 py-6 px-6 space-y-6 md:hidden font-mono"
              >
                <div className="flex flex-col gap-4 text-sm tracking-widest uppercase text-neutral-400">
                  <button onClick={() => handleScrollTo("solutions-grid")} className="text-left py-2 hover:text-white">
                    Solutions
                  </button>
                  <button onClick={() => handleScrollTo("blueprint-section")} className="text-left py-2 hover:text-white">
                    AI Blueprint
                  </button>
                  <button onClick={() => handleScrollTo("workspace-section")} className="text-left py-2 hover:text-white">
                    AI Workspace
                  </button>
                  <button onClick={() => handleScrollTo("subscription-store-section")} className="text-left py-2 text-emerald-400 font-bold">
                    Agent Store
                  </button>
                  <button onClick={() => handleScrollTo("planner-section")} className="text-left py-2 hover:text-white">
                    Scoping Planner
                  </button>
                  <button onClick={() => handleScrollTo("waitlist-section")} className="text-left py-2 hover:text-white">
                    Waitlist
                  </button>
                </div>
                
                <div className="h-[1px] bg-neutral-900" />

                <div className="flex flex-col gap-3">
                  <button
                    id="mobile-replay-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowIntro(true);
                    }}
                    className="w-full py-3 border border-neutral-800 bg-black text-center text-xs text-neutral-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} className="fill-current" />
                    Replay Logo Intro
                  </button>
                  
                  <button
                    id="mobile-diagnostics-btn"
                    onClick={() => handleScrollTo("blueprint-section")}
                    className="w-full py-3 bg-white text-black text-center text-xs font-bold uppercase tracking-widest"
                  >
                    RUN DIAGNOSTICS
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stark HERO Section */}
          <section id="hero-sec" className="w-full max-w-7xl mx-auto px-6 py-16 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-white/10 relative overflow-hidden">
            
            {/* Artistic Watermark V background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
              <div className="text-[25rem] md:text-[35rem] font-black leading-none">V</div>
            </div>

            {/* Left Main Slogan Column */}
            <div className="lg:col-span-7 space-y-8 relative z-10">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-neutral-950">
                <span className="h-1.5 w-1.5 bg-white animate-pulse" />
                <span className="text-[9px] tracking-[0.25em] font-mono text-neutral-400 uppercase">
                  AI DEPLOYMENT STABILITY SYSTEM
                </span>
              </div>

              <div className="relative">
                <h1 id="hero-heading" className="text-5xl md:text-7xl xl:text-8xl font-display font-black tracking-[-0.04em] leading-[0.85] uppercase text-white">
                  WE VALIDATE <br />
                  <span className="text-neutral-500 text-outline">AI INTEGRATIONS</span> <br />
                  TO STOP WASTE
                </h1>
                <div className="h-1 w-full bg-white mt-6 opacity-30"></div>
              </div>

              <p className="max-w-xl text-lg font-light text-neutral-300 leading-relaxed tracking-wide italic">
                "90% of AI solutions fail because businesses chase hype instead of operational constraints. We design, validate, and launch lean, secure, and human-in-the-loop automations tailored specifically for small businesses."
              </p>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  id="hero-primary-btn"
                  onClick={() => handleScrollTo("blueprint-section")}
                  className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2 group"
                >
                  AI DIAGNOSTICS FOR FREE
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button 
                  id="hero-secondary-btn"
                  onClick={() => handleScrollTo("solutions-grid")}
                  className="px-8 py-3 border border-white text-white hover:bg-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  VIEW SOLUTIONS
                </button>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-900 font-mono text-left">
                <div>
                  <div className="text-2xl font-bold text-white tracking-tight">100%</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Zero-Waste Standard</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white tracking-tight">&lt; 14d</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">First Prototype Launch</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white tracking-tight">SOC2</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Security Enforced</div>
                </div>
              </div>

            </div>

            {/* Right Interactive Animated Pipeline Visualizer */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm aspect-square bg-neutral-950/60 border border-neutral-900 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between font-mono text-xs text-neutral-400">
                
                {/* Visualizer header */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-white animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">SYSTEM STABILITY BUS</span>
                  </div>
                  <span className="text-[9px] text-neutral-600 uppercase">ONLINE</span>
                </div>

                {/* Animated Pipeline Nodes */}
                <div className="my-6 space-y-6 relative py-4">
                  
                  {/* Background vertical connecting line */}
                  <div className="absolute left-[13px] top-4 bottom-4 w-[1px] bg-neutral-900" />
                  
                  {/* Dynamic pulsing path dot */}
                  <motion.div
                    className="absolute left-[12px] w-1 h-1 bg-white rounded-full"
                    animate={{
                      top: ["10%", "90%"],
                    }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Node 1: Input ingestion */}
                  <div className="flex items-center gap-4 pl-0.5">
                    <div className="h-6 w-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                      1
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-white block uppercase">Raw Trigger Ingestion</span>
                      <span className="text-[10px] text-neutral-500 block">PDFs, Webhooks, Google Sheets, emails</span>
                    </div>
                  </div>

                  {/* Node 2: Cognitive reasoning */}
                  <div className="flex items-center gap-4 pl-0.5">
                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-black animate-pulse">
                      2
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-white block uppercase">Cognitive Process</span>
                      <span className="text-[10px] text-neutral-400 block">Structured parsing & validation with LLMs</span>
                    </div>
                  </div>

                  {/* Node 3: Human validation gate */}
                  <div className="flex items-center gap-4 pl-0.5">
                    <div className="h-6 w-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                      3
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-white block uppercase">Verification Gate</span>
                      <span className="text-[10px] text-neutral-500 block">Human review portal preventing hallucinations</span>
                    </div>
                  </div>

                </div>

                {/* Simulated Telemetry Log ticker */}
                <div className="bg-black border border-neutral-900 p-3 rounded text-[10px] leading-relaxed space-y-1 text-neutral-500 font-mono">
                  <div className="text-neutral-400 flex justify-between">
                    <span>SYS_LOAD: NORMAL</span>
                    <span>PING: 14ms</span>
                  </div>
                  <div className="h-[1px] bg-neutral-900 my-1" />
                  <div className="text-white flex items-center gap-1">
                    <CheckCircle size={10} className="text-neutral-400" />
                    <span>Validated client payload processed</span>
                  </div>
                </div>

              </div>
            </div>

          </section>

          {/* Expandable Core Offerings Grid */}
          <section id="solutions-grid" className="w-full max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-white/10">
            
            <div className="text-center md:text-left mb-12">
              <span className="text-[10px] tracking-widest font-mono text-neutral-500 uppercase">
                WHAT WE BUILD
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mt-2 mb-3">
                Validated AI Core Solutions
              </h2>
              <p className="text-neutral-400 text-xs md:text-sm max-w-md font-light leading-relaxed">
                Click on any architecture segment to review specific business use cases, target ROIs, and our configured software stacks.
              </p>
            </div>

            {/* Interactive Grid & Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Selectors (Lg: col-span-5) */}
              <div className="lg:col-span-5 space-y-3">
                {solutions.map((sol, index) => (
                  <button
                    key={sol.id}
                    id={`solution-tab-${index}`}
                    onClick={() => setSelectedSolution(sol.id)}
                    className={`w-full text-left p-5 border rounded-lg transition-all cursor-pointer flex flex-col space-y-1.5 ${
                      selectedSolution === sol.id
                        ? "border-white bg-white text-black"
                        : "border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-wider">SEGMENT 0{sol.id + 1}</span>
                      {selectedSolution === sol.id && <Zap size={14} className="text-black" />}
                    </div>
                    <h3 className="text-lg font-display font-black tracking-tight uppercase">
                      {sol.title}
                    </h3>
                    <p className={`text-xs font-light leading-relaxed ${selectedSolution === sol.id ? "text-neutral-700" : "text-neutral-500"}`}>
                      {sol.subtitle}
                    </p>
                  </button>
                ))}
              </div>

              {/* Right Detail Panel (Lg: col-span-7) */}
              <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-lg p-6 md:p-8 min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {selectedSolution !== null && (
                    <motion.div
                      key={selectedSolution}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6"
                    >
                      
                      {/* Segment Title Info */}
                      <div className="border-b border-neutral-900 pb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Cpu size={14} className="text-neutral-400" />
                          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                            TECHNICAL PROTOCOL DETAIL
                          </span>
                        </div>
                        <h4 className="text-xl md:text-2xl font-display font-extrabold text-white uppercase tracking-tight">
                          {solutions[selectedSolution].title}
                        </h4>
                      </div>

                      {/* ROI Banner */}
                      <div className="px-4 py-2.5 border border-neutral-900 bg-black text-xs font-mono text-neutral-300 rounded flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        <span className="font-bold text-white uppercase">TARGET ROI:</span>
                        <span>{solutions[selectedSolution].roi}</span>
                      </div>

                      {/* Targeted business bottlenecks */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                          Solves Recurring Friction:
                        </span>
                        <ul className="space-y-2">
                          {solutions[selectedSolution].problems.map((prob, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-400 font-light">
                              <span className="text-neutral-600 mt-1 font-bold">▶</span>
                              <span>{prob}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* System Stack */}
                      <div className="pt-4 border-t border-neutral-900 space-y-2">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                          Engineered Software Stack:
                        </span>
                        <div className="font-mono text-xs text-neutral-300 bg-black px-3 py-2 border border-neutral-900 rounded inline-block">
                          {solutions[selectedSolution].stack}
                        </div>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 pt-4 border-t border-neutral-900 flex justify-between items-center text-[10px] font-mono text-neutral-600 uppercase">
                  <span>VALIDATE CORE PIPELINE</span>
                  <span>SECURE LAYER ACTIVE</span>
                </div>
              </div>

            </div>

          </section>

          {/* Interactive AI Blueprint Section */}
          <AIBlueprintGenerator />

          {/* Secure Workspace (Travelers, Students, Doctors, Small Businesses) */}
          <AISolutionsWorkspace />

          {/* AI Agents Storefront Subscription Hub */}
          <AIAgentStorefront />

          {/* Secure Rupee Subscription UPI billing section */}
          <section id="upi-billing-hub" className="w-full max-w-7xl mx-auto px-6 py-8 border-b border-white/10">
            <Payment />
          </section>

          {/* Scoping Calculator Section */}
          <EngagementPlanner />

          {/* Stark Client Success / Bento Grid */}
          <section id="cases-section" className="w-full max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-white/10">
            
            <div className="mb-12 text-center md:text-left">
              <span className="text-[10px] tracking-widest font-mono text-neutral-500 uppercase">
                BATTLE TESTED PROOFS
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white uppercase mt-2 mb-2">
                Operational Success Audits
              </h2>
              <p className="text-neutral-400 text-xs md:text-sm max-w-md font-light leading-relaxed">
                Clean, real-world case studies detailing structural validation parameters and performance metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-white/10 md:divide-x divide-white/10">
              
              {/* Case Card 1 */}
              <div className="p-8 flex flex-col justify-between hover:bg-white/5 transition-colors min-h-[280px] group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                    <span>01 / RETAIL & E-COMMERCE</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">CASE STUDY 01</span>
                  </div>
                  
                  <h3 className="text-xl font-medium tracking-tight text-white uppercase font-display">
                    Custom Returns Auto-Triage Node
                  </h3>
                  
                  <p className="text-xs text-neutral-400 leading-normal font-light">
                    Eliminate operational friction through automated review systems that parse size/refund queries from customer emails, compare against historical purchase logs, and queue drafts.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-baseline">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">TIME TO VALUE</span>
                  <span className="text-lg font-bold text-white font-mono">10 DAYS</span>
                </div>
              </div>

              {/* Case Card 2 */}
              <div className="p-8 flex flex-col justify-between hover:bg-white/5 transition-colors min-h-[280px] group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                    <span>02 / PROFESSIONAL SERVICES</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">CASE STUDY 02</span>
                  </div>
                  
                  <h3 className="text-xl font-medium tracking-tight text-white uppercase font-display">
                    PDF Document Extractor Hub
                  </h3>
                  
                  <p className="text-xs text-neutral-400 leading-normal font-light">
                    High-fidelity data analysis that scans 100+ page contractor guidelines, isolates compliance liabilities, and populates secure structured sheets.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-baseline">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">PARTNER HOURS SAVED</span>
                  <span className="text-lg font-bold text-white font-mono">18 HRS/WK</span>
                </div>
              </div>

              {/* Case Card 3 */}
              <div className="p-8 flex flex-col justify-between hover:bg-white/5 transition-colors min-h-[280px] group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                    <span>03 / CREATIVE AGENCY</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">CASE STUDY 03</span>
                  </div>
                  
                  <h3 className="text-xl font-medium tracking-tight text-white uppercase font-display">
                    Multi-Channel Campaign Draft Node
                  </h3>
                  
                  <p className="text-xs text-neutral-400 leading-normal font-light">
                    Sophisticated prompt orchestration layer prompting creators with core update files, auto-producing alt tags, descriptions, and taglines instantly.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-baseline">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">DRAFT SPEED MULTIPLIER</span>
                  <span className="text-lg font-bold text-white font-mono">3.5X</span>
                </div>
              </div>

            </div>

          </section>

          {/* Founder Section */}
          <section id="founder-section" className="w-full max-w-7xl mx-auto px-6 py-24 border-b border-white/10 font-sans relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
              <div className="text-[20rem] md:text-[30rem] font-black leading-none uppercase">FOUNDER</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              {/* Left Column: Quote / Philosophy */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-neutral-950">
                  <span className="h-1.5 w-1.5 bg-white animate-pulse" />
                  <span className="text-[9px] tracking-[0.25em] font-mono text-neutral-400 uppercase">
                    LEADERSHIP & VISION
                  </span>
                </div>
                <h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight leading-tight">
                  ENGINEERING SECURE <br />
                  <span className="text-neutral-500 text-outline">AUTOMATION CORES</span>
                </h3>
                <div className="h-[1px] w-full bg-white opacity-20 my-4"></div>
                <p className="text-lg font-light text-neutral-300 leading-relaxed italic">
                  "Artificial intelligence shouldn't be an expensive, speculative experiment. We focus entirely on architectural stability, bulletproof data privacy, and measurable return on investment. Our workflows are designed to scale with your business without introducing operational complexity."
                </p>
                <div className="pt-2">
                  <div className="text-white font-bold text-lg font-display uppercase tracking-wider">
                    Abhay Ghodeswar
                  </div>
                  <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mt-1">
                    FOUNDER & PRINCIPAL ARCHITECT, VALIDATE
                  </div>
                </div>
              </div>

              {/* Right Column: Key Commitments */}
              <div className="lg:col-span-5 bg-neutral-950 border border-white/10 p-8 rounded-none space-y-6">
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                  FOUNDER'S COMMITMENT
                </div>
                
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">01 / NO-RISK PROTOTYPING</h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-light">
                      We model every operational challenge and validate it interactively before any production deployment takes place.
                    </p>
                  </div>

                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">02 / HUMAN-CENTRIC CORE</h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-light">
                      All solutions prioritize user control, featuring robust draft queues, secondary feedback gates, and analog failsafes.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">03 / COMPLIANT BY ARCHITECTURE</h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-light">
                      Deep sandboxing and security come standard. Your proprietary operational data never trains public base models.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Waitlist and Contact Intake Form */}
          <section id="waitlist-section" className="w-full max-w-3xl mx-auto px-6 py-20 border-b border-white/10 font-sans">
            <div className="border border-white/10 bg-neutral-950 p-6 md:p-10 rounded-none space-y-8 relative overflow-hidden">
              
              {/* Graphic watermark background element */}
              <div className="absolute right-[-30px] bottom-[-20px] text-[15vw] font-display font-black text-white/[0.02] pointer-events-none select-none">
                V
              </div>

              {/* State handling container */}
              <AnimatePresence mode="wait">
                {!submittedInquiry ? (
                  <motion.div
                     key="waitlist-input-form"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="space-y-6"
                  >
                    
                    {/* Header info */}
                    <div className="text-center space-y-2">
                      <span className="text-[10px] tracking-widest font-mono text-neutral-500 uppercase">
                        SECURE INTAKE GATEWAY
                      </span>
                      <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight">
                        Register For Consultation
                      </h3>
                      <div className="h-0.5 w-12 bg-white mx-auto mt-2 mb-2 opacity-50"></div>
                      <p className="text-neutral-400 text-xs md:text-sm font-light max-w-md mx-auto">
                        We review registrations weekly. Submit your business name and bottleneck to reserve an engineering slot.
                      </p>
                    </div>

                    {/* Simple, gorgeous B&W form */}
                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                            Company or Name
                          </label>
                          <input
                            id="waitlist-name"
                            type="text"
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="e.g., Summit Dental Studio"
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-none text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                            Direct Email
                          </label>
                          <input
                            id="waitlist-email"
                            type="email"
                            required
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="e.g., founder@summitdental.com"
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-none text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                          Briefly Describe the Friction Area
                        </label>
                        <textarea
                          id="waitlist-friction"
                          required
                          rows={3}
                          value={clientProblem}
                          onChange={(e) => setClientProblem(e.target.value)}
                          placeholder="What process is currently slow, repetitive, or manual?"
                          className="w-full px-4 py-3 bg-black border border-white/10 rounded-none text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white transition-colors resize-none"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        id="submit-waitlist-btn"
                        type="submit"
                        disabled={submittingInquiry}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs tracking-widest uppercase rounded-none transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submittingInquiry ? (
                          <>VAL-NODE SECURING LINK...</>
                        ) : (
                          <>
                            SUBMIT CONSULTATION REQUEST
                            <Send size={12} />
                          </>
                        )}
                      </button>

                    </form>

                  </motion.div>
                ) : (
                  <motion.div
                    key="waitlist-success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 md:p-8 space-y-6 text-center"
                  >
                    
                    {/* Tick Mark Icon inside visual B&W target */}
                    <div className="mx-auto h-12 w-12 rounded-none border border-white flex items-center justify-center text-white bg-black">
                      <Check size={20} />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                        INTAKE CONFIRMED & PARSED
                      </span>
                      <h4 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight">
                        Your Slot Is Locked
                      </h4>
                      <p className="text-neutral-400 text-xs font-light max-w-sm mx-auto leading-relaxed">
                        We have parsed your core bottleneck and assigned an automation architect to audit your use-case.
                      </p>
                    </div>

                    {/* Stark validated ticket */}
                    <div className="border border-white/10 bg-black/80 px-6 py-4 rounded-none font-mono text-xs max-w-sm mx-auto space-y-2">
                      <div className="text-neutral-500 text-[10px] flex justify-between">
                        <span>INTAKE SLATE</span>
                        <span>REG: 2026</span>
                      </div>
                      <div className="text-white font-bold tracking-widest text-sm text-center">
                        {generatedTicket}
                      </div>
                      <div className="h-[1px] bg-white/10 my-1" />
                      <div className="text-[9px] text-neutral-600 uppercase flex justify-between">
                        <span>COGNITIVE MATCH: QUEUED</span>
                        <span>WAIT: ~48 HOURS</span>
                      </div>
                    </div>

                    <button
                      id="reset-waitlist-btn"
                      onClick={() => {
                        setSubmittedInquiry(false);
                        setClientName("");
                        setClientEmail("");
                        setClientProblem("");
                      }}
                      className="text-[10px] font-mono text-neutral-500 hover:text-white uppercase tracking-widest underline decoration-white/20 hover:decoration-white transition-all cursor-pointer"
                    >
                      Submit Another Diagnostic Inquiry
                    </button>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </section>

          {/* Stark, Clean Footer */}
          <footer className="w-full bg-black border-t border-white/10 px-6 py-12 font-sans mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left footer logo */}
              <div className="md:col-span-4 space-y-3 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="bg-white text-black font-black px-2 py-0.5 text-sm tracking-tighter">
                    V
                  </div>
                  <span className="text-sm font-display font-black tracking-widest text-white uppercase">
                    VALIDATE
                  </span>
                </div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  AI Solutions For Real Business Operations.<br />
                  Zero Waste. Zero Noise. SOC2 Audited.
                </p>
              </div>

              {/* Center replay navigation */}
              <div className="md:col-span-4 flex justify-center">
                <button
                  id="footer-replay-btn"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "instant" });
                    setShowIntro(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 border border-neutral-900 bg-neutral-950 hover:bg-neutral-900 text-xs font-mono text-neutral-400 hover:text-white rounded-full uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <Play size={12} className="fill-current text-white" />
                  REPLAY STARTUP ANIMATION
                </button>
              </div>

              {/* Right copy block */}
              <div className="md:col-span-4 text-center md:text-right font-mono text-[10px] text-neutral-600 uppercase tracking-widest">
                <span>© 2026 VALIDATE SOLUTIONS INC.</span>
                <span className="block mt-1">ALL PROTOCOLS REGISTERED.</span>
              </div>

            </div>
          </footer>

        </motion.div>
      )}

      <LiveChatWidget />
      <SpeedInsights />

    </div>
  );
}
