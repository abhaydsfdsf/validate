import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Code, 
  Copy, 
  Cpu, 
  BarChart3, 
  Layers, 
  RotateCcw,
  Zap
} from "lucide-react";

interface Phase {
  phaseTitle: string;
  details: string;
}

interface Blueprint {
  solutionName: string;
  concept: string;
  effortScore: number;
  impactScore: number;
  timelineWeeks: number;
  implementationPhases: Phase[];
  roiMetrics: string;
  customPrompt: string;
}

// Highly detailed pre-made fallback templates in case the API key is not configured or fails
const LOCAL_FALLBACKS: Record<string, Blueprint> = {
  travel: {
    solutionName: "Cognitive Lifestyle Trip & Itinerary Planner",
    concept: "Synthesize dynamic user travel dates, climate data, personal budget tiers, and target hobbies into structured, micro-detailed visual itineraries.",
    effortScore: 2,
    impactScore: 8,
    timelineWeeks: 1,
    implementationPhases: [
      {
        phaseTitle: "Phase 1: Lifestyle Profile Ingestion",
        details: "Assemble client travel dates, budget limits, activity pacing preferences, and past destinations into a clean JSON memory state."
      },
      {
        phaseTitle: "Phase 2: Semantic Google Maps & Weather Fusion",
        details: "Route structured inputs through Gemini Flash to generate daily logistics, weather-safe alternate plans, and local packing checklists."
      },
      {
        phaseTitle: "Phase 3: Interactive Itinerary Share",
        details: "Export clean markdown schedules and calendar files (.ics) directly to user mobile screens or email feeds."
      }
    ],
    roiMetrics: "Saves 10-15 hours of manual, fragmented search-engine planning for each single vacation or business travel route.",
    customPrompt: "Act as a luxury lifestyle and travel architect. Generate a highly structured 3-day itinerary for [DESTINATION] during [SEASON]. Budget Level: [BUDGET]. Include exact morning, afternoon, and evening slots with local transit notes. Travel: [INSERT_TRAVELERS_INFO_HERE]"
  },
  education: {
    solutionName: "Adaptive Study Planner & Flashcard Synthesizer",
    concept: "Generate customized high-impact weekly study timelines, topic flashcards, and concept-check questions based on course syllabus uploads.",
    effortScore: 2,
    impactScore: 9,
    timelineWeeks: 2,
    implementationPhases: [
      {
        phaseTitle: "Phase 1: Syllabus & Document Ingestion",
        details: "Deploy a lightweight secure upload field to ingest course curriculum guidelines, textbooks chapters, or lecture PDFs."
      },
      {
        phaseTitle: "Phase 2: Cognitive Topic Breakdown",
        details: "Utilize Gemini to parse exam dates, classify concepts from simple to complex, and generate structured daily study sprints."
      },
      {
        phaseTitle: "Phase 3: Adaptive Q&A Active Recall",
        details: "Deliver dynamic daily study cards and mini-quizzes to the student, adjusting retention curves based on incorrect answers."
      }
    ],
    roiMetrics: "Boosts exam preparation efficiency by 40% while eliminating exam prep anxiety through structured daily checkpoints.",
    customPrompt: "Act as an academic coach. Below is a course syllabus outline. Generate a structured 4-week preparation schedule with daily study milestones, 3 core focus concepts, and 2 flashcard recall prompts for each. Syllabus: [INSERT_SYLLABUS_HERE]"
  },
  healthcare: {
    solutionName: "Doctor's Patient List & Triage Priority Organizer",
    concept: "Consolidate raw intake notes, symptoms, and appointment requests into a clean, prioritized, HIPPA-compliant daily doctor triage sheet.",
    effortScore: 3,
    impactScore: 9,
    timelineWeeks: 2,
    implementationPhases: [
      {
        phaseTitle: "Phase 1: Secure Intake Gateway",
        details: "Establish a secure, encrypted intake form for recording raw symptom notes, emergency risk thresholds, and patient requests."
      },
      {
        phaseTitle: "Phase 2: Cognitive Triage Prioritization",
        details: "Leverage private AI classifiers to group client requests by urgency, flag potential red flags, and summarize cases in under 20 words."
      },
      {
        phaseTitle: "Phase 3: Clean Daily Dashboard Sync",
        details: "Render a high-contrast, distraction-free daily list for clinical staff to check off completed consultations and next steps."
      }
    ],
    roiMetrics: "Reduces clinical administrative triage time by 2 hours daily, giving doctors more high-quality time with active patients.",
    customPrompt: "Act as a clinical operations nurse. Read these raw patient check-in notes. Summarize each patient into a clean list with: 1) Medical urgency level (Low/Medium/High), 2) Primary symptom highlight, 3) Recommended diagnostic prep questions. Notes: [INSERT_PATIENT_NOTES_HERE]"
  },
  billing: {
    solutionName: "Automated B2B Email Billing & Follow-up Node",
    concept: "Parse monthly completed client deliverables, draft professional formatted invoice notifications, and auto-queue reminders for outstanding payments.",
    effortScore: 2,
    impactScore: 9,
    timelineWeeks: 1,
    implementationPhases: [
      {
        phaseTitle: "Phase 1: Deliverable Tracking Sync",
        details: "Fetch completed work items or timesheets directly from your CRM, spreadsheet, or simple local tracking records."
      },
      {
        phaseTitle: "Phase 2: Intelligent Invoice Drafting",
        details: "Use Gemini to calculate summary cost subtotals and auto-generate highly professional billing cover emails personalized for each client."
      },
      {
        phaseTitle: "Phase 3: Dispatch & Follow-up Queue",
        details: "Deploy n8n/Make webhooks to dispatch invoices automatically and queue soft-reminder nudges for overdue accounts after 15 days."
      }
    ],
    roiMetrics: "Decreases accounts receivable collection cycles (DSO) by 8 days while saving 10 hours a month of awkward billing emails drafting.",
    customPrompt: "Act as a polite, executive accounts billing manager. Generate a high-contrast, professional, and friendly invoice notification email for [CLIENT] outlining the fee of [AMOUNT] for [SERVICES_RENDERED]. Include payment details. Details: [INSERT_BILLING_DETAILS_HERE]"
  }
};

const SUGGESTED_CHALLENGES = [
  {
    industry: "Travel & Lifestyle",
    challenge: "Planning dynamic personalized itineraries, climates, and packing lists for modern travelers.",
    slug: "travel"
  },
  {
    industry: "Students & Academia",
    challenge: "Organizing fragmented course syllabi, files, and lectures into structured weekly study schedules.",
    slug: "education"
  },
  {
    industry: "Doctors & Healthcare",
    challenge: "Manually triaging incoming client symptom forms and managing high-stress patient priority lists.",
    slug: "healthcare"
  },
  {
    industry: "Small Businesses",
    challenge: "Spending hours writing individual invoice cover emails, calculating fees, and chasing unpaid bills.",
    slug: "billing"
  }
];

export default function AIBlueprintGenerator() {
  const [industry, setIndustry] = useState("");
  const [challenge, setChallenge] = useState("");
  const [scale, setScale] = useState("Under 25 employees");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleApplySuggestion = (sug: typeof SUGGESTED_CHALLENGES[0]) => {
    setIndustry(sug.industry);
    setChallenge(sug.challenge);
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!industry.trim() || !challenge.trim()) return;

    setLoading(true);
    setLoadingStep(0);
    setBlueprint(null);
    setErrorNotice(null);

    // Dynamic terminal loading visual cues
    const steps = [
      "ESTABLISHING DIAGNOSTIC PROBE ON CHALLENGE...",
      "HARVESTING SEGMENT DATA & ROBUST BENCHMARKS...",
      "CONSTRUCTING COGNITIVE MODEL PIPELINE (GEMINI-3.5-FLASH)...",
      "VALIDATING ROI PROFILE & SECURITY ENVELOPE...",
      "FORMULATING ZERO-WASTE IMPLEMENTATION PATHWAYS..."
    ];

    const stepIntervals = steps.map((_, index) => {
      return setTimeout(() => {
        setLoadingStep(index);
      }, index * 800);
    });

    try {
      const response = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, challenge, scale }),
      });

      // Clear any steps loading timer
      stepIntervals.forEach(clearTimeout);

      if (response.ok) {
        const data = await response.json();
        setBlueprint(data);
      } else {
        // Fallback gracefully in case backend key is missing or API limits hit
        const responseData = await response.json().catch(() => ({}));
        console.warn("Backend API returned error, falling back to clean structured local response:", responseData.error);
        
        // Match slug for fallback
        let fallbackKey = "billing";
        const indLower = industry.toLowerCase() + " " + challenge.toLowerCase();
        if (indLower.includes("travel") || indLower.includes("trip") || indLower.includes("itinerary") || indLower.includes("pack") || indLower.includes("lifestyle")) fallbackKey = "travel";
        else if (indLower.includes("student") || indLower.includes("study") || indLower.includes("syllabus") || indLower.includes("class") || indLower.includes("academic") || indLower.includes("school") || indLower.includes("educat")) fallbackKey = "education";
        else if (indLower.includes("doctor") || indLower.includes("patient") || indLower.includes("health") || indLower.includes("medic") || indLower.includes("triage") || indLower.includes("clinic") || indLower.includes("patience")) fallbackKey = "healthcare";
        else if (indLower.includes("bill") || indLower.includes("invoice") || indLower.includes("pay") || indLower.includes("account") || indLower.includes("fee") || indLower.includes("buisness") || indLower.includes("business")) fallbackKey = "billing";

        setErrorNotice(responseData.error || "Using high-fidelity pre-modeled blueprint due to local trial environment constraints.");
        
        // Wait another 300ms for natural animation pacing
        await new Promise(resolve => setTimeout(resolve, 600));
        setBlueprint(LOCAL_FALLBACKS[fallbackKey]);
      }
    } catch (err) {
      stepIntervals.forEach(clearTimeout);
      console.error("Connection failed, loading high-quality local fallback:", err);
      setErrorNotice("Using offline-ready blueprint engine.");
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setBlueprint(LOCAL_FALLBACKS.billing);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!blueprint) return;
    navigator.clipboard.writeText(blueprint.customPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleReset = () => {
    setBlueprint(null);
    setIndustry("");
    setChallenge("");
    setErrorNotice(null);
  };

  return (
    <div id="blueprint-section" className="w-full bg-[#000000] border-y border-white/10 py-16 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header section */}
        <div className="text-center mb-12 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-neutral-950 mb-4">
            <Cpu size={14} className="text-white animate-pulse" />
            <span className="text-[10px] tracking-widest font-mono text-neutral-400 uppercase">
              INTERACTIVE DIAGNOSTICS DEMO
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-[-0.04em] text-white uppercase mb-4">
            VALIDATE YOUR AI BLUEPRINT
          </h2>
          <div className="h-0.5 w-16 bg-white mx-auto mt-4 mb-4 opacity-50"></div>
          <p className="max-w-xl mx-auto text-lg font-light text-neutral-300 leading-relaxed tracking-wide italic">
            "Tell us about your operational friction. Our validated engine will architect a zero-waste deployment strategy in real-time."
          </p>
        </div>

        {/* Dynamic State Management Interface */}
        <AnimatePresence mode="wait">
          {!loading && !blueprint && (
            <motion.form
              key="blueprint-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleGenerate}
              className="space-y-6 bg-neutral-950 border border-white/10 p-6 md:p-8 rounded-none"
            >
              {/* Row 1: Industry and scale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Building2 size={12} />
                    YOUR INDUSTRY
                  </label>
                  <input
                    id="industry-input"
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Local Dental Clinic, Retail Logistics"
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-none text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Layers size={12} />
                    BUSINESS SCALE
                  </label>
                  <select
                    id="scale-select"
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-none text-sm text-white focus:outline-none focus:border-white transition-colors appearance-none"
                  >
                    <option value="Solo Operator (1 person)">Solo Operator (1 person)</option>
                    <option value="Small Team (2-10 people)">Small Team (2-10 people)</option>
                    <option value="Growing Enterprise (11-50 people)">Growing Enterprise (11-50 people)</option>
                    <option value="Mid-Market Enterprise (51-250 people)">Mid-Market Corporate (51-250 people)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Operational Challenge */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <HelpCircle size={12} />
                  MAIN OPERATIONAL FRICTION / MANUAL BOTTLENECK
                </label>
                <textarea
                  id="challenge-textarea"
                  required
                  rows={3}
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  placeholder="Describe what manual process takes your team too much time (e.g., categorizing 200 client support spreadsheets, answering repetitive email tracking requests, etc.)"
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-none text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              {/* Suggestions Chips */}
              <div>
                <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2.5">
                  Or click an example to test immediately:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_CHALLENGES.map((sug, i) => (
                    <button
                       key={i}
                       type="button"
                       onClick={() => handleApplySuggestion(sug)}
                       className="px-3 py-1.5 border border-white/10 bg-black text-[11px] text-neutral-400 hover:text-white hover:bg-white/5 transition-all text-left max-w-full rounded-none"
                    >
                      <span className="font-mono text-neutral-600 mr-1">[{sug.industry}]</span>
                      <span className="truncate inline-block max-w-[250px] align-bottom">{sug.challenge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2">
                <button
                  id="submit-blueprint-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-neutral-200 text-black font-bold text-xs tracking-widest uppercase rounded-none transition-all cursor-pointer"
                >
                  CONSTRUCT CUSTOM AI BLUEPRINT
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.form>
          )}

          {/* Loading state - Terminal diagnostic screen */}
          {loading && (
            <motion.div
              key="blueprint-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-neutral-950 border border-neutral-900 p-8 rounded-xl font-mono text-xs text-neutral-400 space-y-6 min-h-[300px] flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-white font-bold uppercase tracking-wider">VALIDATE AGENT CORE DIAGNOSTIC</span>
              </div>

              <div className="space-y-2.5 flex-1 font-mono text-[11px]">
                <div className="text-neutral-600">Initializing connection to Gemini architecture...</div>
                
                {loadingStep >= 0 && (
                  <div className="text-white flex items-center gap-1.5 animate-pulse">
                    <span className="text-neutral-600 font-bold">▶</span> [0.1s] ESTABLISHING DIAGNOSTIC PROBE ON CHALLENGE...
                  </div>
                )}
                {loadingStep >= 1 && (
                  <div className="text-white flex items-center gap-1.5 animate-pulse">
                    <span className="text-neutral-600 font-bold">▶</span> [0.9s] HARVESTING SEGMENT DATA & ROBUST BENCHMARKS...
                  </div>
                )}
                {loadingStep >= 2 && (
                  <div className="text-white flex items-center gap-1.5 animate-pulse">
                    <span className="text-neutral-600 font-bold">▶</span> [1.8s] CONSTRUCTING COGNITIVE MODEL PIPELINE (GEMINI-3.5-FLASH)...
                  </div>
                )}
                {loadingStep >= 3 && (
                  <div className="text-white flex items-center gap-1.5 animate-pulse">
                    <span className="text-neutral-600 font-bold">▶</span> [2.7s] VALIDATING ROI PROFILE & SECURITY ENVELOPE...
                  </div>
                )}
                {loadingStep >= 4 && (
                  <div className="text-white flex items-center gap-1.5 animate-pulse">
                    <span className="text-neutral-600 font-bold">▶</span> [3.6s] FORMULATING ZERO-WASTE IMPLEMENTATION PATHWAYS...
                  </div>
                )}
              </div>

              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-white h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.0, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}

          {/* Result view */}
          {!loading && blueprint && (
            <motion.div
              key="blueprint-result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-neutral-950 border border-white/10 rounded-none overflow-hidden font-sans"
            >
              {/* Header bar */}
              <div className="border-b border-white/10 bg-black px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                    BLUEPRINT SYSTEM GENERATED
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white text-black font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-none">
                    STATUS: COGNITIVELY VALIDATED
                  </span>
                </div>
              </div>

              {/* Main Blueprint details */}
              <div className="p-6 md:p-8 space-y-8">
                {/* Title and summary */}
                <div className="space-y-3">
                  <h3 id="blueprint-title" className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight uppercase">
                    {blueprint.solutionName}
                  </h3>
                  <p className="text-neutral-300 text-sm md:text-base leading-relaxed font-light">
                    {blueprint.concept}
                  </p>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-white/10 py-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                      TIMELINE TO PROTO
                    </span>
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {blueprint.timelineWeeks} {blueprint.timelineWeeks === 1 ? "Week" : "Weeks"}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">Fast validation speed</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                      IMPLEMENTATION EFFORT
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {blueprint.effortScore}
                      </span>
                      <span className="text-neutral-600 text-sm">/10</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-neutral-900 h-1.5 rounded-none overflow-hidden">
                      <div className="bg-white h-full" style={{ width: `${blueprint.effortScore * 10}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                      OPERATIONAL IMPACT
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {blueprint.impactScore}
                      </span>
                      <span className="text-neutral-600 text-sm">/10</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-neutral-900 h-1.5 rounded-none overflow-hidden">
                      <div className="bg-white h-full" style={{ width: `${blueprint.impactScore * 10}%` }} />
                    </div>
                  </div>
                </div>

                {/* ROI Assessment */}
                <div className="bg-neutral-900/40 border border-white/10 p-5 rounded-none flex items-start gap-4">
                  <div className="p-2 border border-white/10 bg-black rounded-none text-white mt-0.5">
                    <BarChart3 size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">Estimated Immediate Business ROI</h4>
                    <p className="text-neutral-400 text-sm font-light leading-relaxed">{blueprint.roiMetrics}</p>
                  </div>
                </div>

                {/* Steps Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Layers size={14} />
                    Validation Phase Blueprint
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {blueprint.implementationPhases.map((phase, i) => (
                      <div key={i} className="p-4 border border-white/10 bg-neutral-950/40 rounded-none flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-neutral-500 mb-2 font-bold">{phase.phaseTitle}</div>
                          <p className="text-neutral-400 text-xs font-light leading-relaxed">{phase.details}</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <CheckCircle size={14} className="text-neutral-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Tool / Copy Paste Prompts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <Code size={14} />
                      Executable Tone Prompt
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-500">Copy to paste immediately in Gemini/ChatGPT</span>
                  </div>

                  <div className="relative group bg-black border border-white/10 rounded-none p-4 font-mono text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
                    {blueprint.customPrompt}
                    
                    <button
                      id="copy-prompt-btn"
                      onClick={handleCopyPrompt}
                      className="absolute top-3 right-3 p-1.5 bg-neutral-900/90 border border-white/10 hover:bg-neutral-800 rounded-none transition-colors text-neutral-400 hover:text-white flex items-center gap-1 font-mono text-[10px]"
                      title="Copy Prompt"
                    >
                      {copiedPrompt ? (
                        <>Copied!</>
                      ) : (
                        <>
                          <Copy size={11} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  {errorNotice && (
                    <span className="text-[10px] font-mono text-neutral-500 max-w-[300px]">
                      {errorNotice.includes("trial") ? "Local trial node active. Connect GEMINI_API_KEY in Secrets for unlimited tailored blueprints." : errorNotice}
                    </span>
                  )}
                  {!errorNotice && (
                    <span className="text-[10px] font-mono text-neutral-500">
                      Successfully synthesized using real-time generative models.
                    </span>
                  )}
                  <button
                    id="reset-blueprint-btn"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 py-2 border border-white/10 bg-neutral-950 hover:bg-neutral-900 text-xs text-neutral-400 hover:text-white rounded-none transition-colors font-mono uppercase tracking-widest cursor-pointer ml-auto"
                  >
                    <RotateCcw size={12} />
                    Reset & Run New Diagnosis
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
