import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Sliders, HelpCircle, Shield, Check, Zap, Gauge } from "lucide-react";

type ObjectiveType = "automation" | "agents" | "analytics";

export default function EngagementPlanner() {
  const [headcount, setHeadcount] = useState<number>(12);
  const [objective, setObjective] = useState<ObjectiveType>("automation");
  const [complianceNeeded, setComplianceNeeded] = useState<boolean>(false);

  const planningResults = useMemo(() => {
    let tierName = "VALIDATE PILOT";
    let timelineDays = 14;
    let baselineCost = "$2,400";
    let deliverables: string[] = [];
    let complexityScore = 2; // out of 10

    // Core logic
    if (objective === "automation") {
      complexityScore = headcount < 15 ? 3 : 5;
      timelineDays = headcount < 15 ? 10 : 18;
      tierName = headcount < 15 ? "VALIDATE PILOT" : "VALIDATE GROWTH AUTO";
      deliverables = [
        "Interactive Webhook integration (Make/n8n/Zapier)",
        "Raw email/document extraction pipeline",
        "Weekly status reporting and error tracking dashboard",
        "2 hours of video operational training"
      ];
    } else if (objective === "agents") {
      complexityScore = headcount < 15 ? 5 : 7;
      timelineDays = headcount < 15 ? 15 : 24;
      tierName = headcount < 15 ? "VALIDATE COGNITIVE NODE" : "VALIDATE COGNITIVE SCALE";
      deliverables = [
        "Advanced conversational flow architect (Gemini Flash/Pro)",
        "Human-in-the-loop review portal (guarantees tone safety)",
        "Slack, WhatsApp, or Web Widget integration",
        "Weekly prompt tuning and continuous behavioral alignment"
      ];
    } else {
      complexityScore = headcount < 15 ? 4 : 6;
      timelineDays = headcount < 15 ? 12 : 20;
      tierName = headcount < 15 ? "VALIDATE INSIGHTS SOLO" : "VALIDATE ANALYTICS HUB";
      deliverables = [
        "Automated PDF/XLS structured scraper & database ingestion",
        "Dynamic executive brief generator (Markdown/Slack-delivered)",
        "Interactive anomaly-alert parameters & flags",
        "Custom D3 visual chart output config"
      ];
    }

    if (complianceNeeded) {
      complexityScore += 2;
      timelineDays += 5;
      tierName += " + SECURE";
      deliverables.push("SOC2-compliant audit-ready logging layer");
    }

    return {
      tierName,
      timelineDays,
      complexityScore,
      deliverables
    };
  }, [headcount, objective, complianceNeeded]);

  return (
    <div id="planner-section" className="w-full bg-[#000000] py-16 px-4 md:px-8 font-sans border-b border-white/10">
      <div className="max-w-4xl mx-auto border border-white/10 bg-neutral-950/30 p-6 md:p-8 rounded-none">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="text-[10px] tracking-widest font-mono text-neutral-500 uppercase border border-white/10 px-2.5 py-1 bg-black rounded-none">
            ENGAGEMENT CALCULATOR
          </span>
          <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase mt-4 mb-2 tracking-[-0.03em]">
            SCOPE YOUR AI INTEGRATION
          </h3>
          <div className="h-0.5 w-16 bg-white mt-4 mb-4 opacity-50"></div>
          <p className="text-neutral-400 text-xs md:text-sm font-light">
            Adjust the sliders to view structural requirements, complexity rating, and validation scope.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Controls column */}
          <div className="space-y-8">
            
            {/* Slider: Headcount */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Sliders size={12} />
                  OPERATIONAL SCALE
                </span>
                <span className="text-white font-bold">{headcount} Employees</span>
              </div>
              <input
                id="headcount-range"
                type="range"
                min="1"
                max="150"
                value={headcount}
                onChange={(e) => setHeadcount(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-600">
                <span>1 (Solo)</span>
                <span>75 (Growing)</span>
                <span>150 (Enterprise)</span>
              </div>
            </div>

            {/* Objective Selection Cards */}
            <div className="space-y-3">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                INTEGRATION OBJECTIVE
              </label>
              
              <div className="space-y-2">
                {[
                  {
                    id: "automation",
                    title: "Process Automation",
                    desc: "Replace manual spreadsheet work, scraping, email notifications, & workflows."
                  },
                  {
                    id: "agents",
                    title: "Intelligent Assistants",
                    desc: "Human-grade email agents, custom-trained web bots, customer assistance."
                  },
                  {
                    id: "analytics",
                    title: "Cognitive Insights",
                    desc: "Analyze incoming contracts, legal forms, and database records in bulk."
                  }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setObjective(item.id as ObjectiveType)}
                    className={`w-full text-left p-4 rounded-none border transition-all cursor-pointer flex justify-between items-center ${
                      objective === item.id
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black hover:border-white/20 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold font-display uppercase tracking-wider">{item.title}</div>
                      <div className={`text-[11px] font-light leading-relaxed ${objective === item.id ? "text-neutral-800" : "text-neutral-500"}`}>
                        {item.desc}
                      </div>
                    </div>
                    {objective === item.id && <Zap size={14} className="text-black fill-black flex-shrink-0 ml-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance Secure Toggle */}
            <div className="flex items-center justify-between p-4 border border-white/10 bg-black rounded-none">
              <div className="flex items-center gap-3">
                <Shield size={16} className={complianceNeeded ? "text-white animate-pulse" : "text-neutral-600"} />
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-white block uppercase">Enterprise Secure Mode</span>
                  <span className="text-[10px] text-neutral-500 block">Isolate data, strict local hostings, SOC2 logs.</span>
                </div>
              </div>
              <button
                id="compliance-toggle-btn"
                type="button"
                onClick={() => setComplianceNeeded(!complianceNeeded)}
                className={`w-10 h-5 rounded-none p-0.5 transition-colors cursor-pointer flex ${
                  complianceNeeded ? "bg-white justify-end" : "bg-neutral-800 justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-none bg-black block" />
              </button>
            </div>

          </div>

          {/* Planning output details column */}
          <div className="bg-black border border-white/10 p-6 rounded-none flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              
              {/* Scope Title Header */}
              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] font-mono text-neutral-500 block tracking-widest uppercase">
                  RECOMMENDED DEPLOYMENT TIER
                </span>
                <div className="text-xl font-display font-black text-white uppercase tracking-tight mt-1">
                  {planningResults.tierName}
                </div>
              </div>

              {/* Timeline and Complexity rating */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Est. Validate Timeline</span>
                  <span className="text-2xl font-bold text-white font-mono">{planningResults.timelineDays} Days</span>
                  <span className="text-[10px] text-neutral-600 block">From kickoff to demo</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Architectural Complexity</span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-white font-mono">{planningResults.complexityScore}</span>
                    <span className="text-neutral-600 text-sm">/10</span>
                  </div>
                  {/* Metric Bar */}
                  <div className="w-full bg-neutral-900 h-1 rounded-none overflow-hidden">
                    <div className="bg-white h-full" style={{ width: `${planningResults.complexityScore * 10}%` }} />
                  </div>
                </div>
              </div>

              {/* Scope Checklist */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">
                  Core Validated Architecture Deliverables
                </span>
                <ul className="space-y-2">
                  {planningResults.deliverables.map((del, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-400 font-light">
                      <Check size={12} className="text-white mt-1 flex-shrink-0 border border-white/20 p-0.5 rounded-none" />
                      <span>{del}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Bottom info banner */}
            <div className="border-t border-white/10 pt-4 flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase">
              <Gauge size={12} />
              <span>Calibrated for lean budgets and operational simplicity.</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
