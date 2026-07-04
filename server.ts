import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";
import { 
  getUsers, 
  getUser, 
  saveUser, 
  saveOTP, 
  verifyOTP, 
  getChatHistory, 
  addChatMessage,
  setVerified
} from "./server_db.js";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import {
  getOrCreateUser,
  saveTravelItinerary,
  getTravelItineraries,
  saveStudyPlan,
  getStudyPlans,
  savePatientTriage,
  getPatientTriages,
  saveEmailBilling,
  getEmailBillings,
  createAgentSubscription,
  getAgentSubscriptions
} from "./src/db/operations.ts";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming JSON requests
app.use(express.json());

// Initialize the Google Gen AI client server-side only
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Secure Gemini client successfully initialized.");
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini client:", error);
}

// SECURE USER SYNC ROUTE
app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || "user@temp.com";
    if (!uid) return res.status(400).json({ error: "Missing user UID in verified token" });

    const syncedUser = await getOrCreateUser(uid, email);
    return res.json({ success: true, user: syncedUser });
  } catch (error: any) {
    console.error("Error in sync auth:", error);
    return res.status(500).json({ error: error.message || "Failed to sync user" });
  }
});

// TRAVEL ITINERARIES ROUTES
app.get("/api/itineraries", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const list = await getTravelItineraries(uid);
    return res.json({ success: true, itineraries: list });
  } catch (error: any) {
    console.error("Error fetching itineraries:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch itineraries" });
  }
});

app.post("/api/itineraries", requireAuth, async (req: AuthRequest, res) => {
  const { destination, budget, durationDays, itineraryText } = req.body;
  if (!destination || !itineraryText) {
    return res.status(400).json({ error: "Destination and itinerary text are required fields." });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const saved = await saveTravelItinerary(uid, destination, budget || "Standard", durationDays || "3", itineraryText);
    return res.json({ success: true, itinerary: saved });
  } catch (error: any) {
    console.error("Error creating itinerary:", error);
    return res.status(500).json({ error: error.message || "Failed to preserve itinerary" });
  }
});

// GENERATE DYNAMIC TRAVEL PLAN & HOTELS WITH MAP COORDINATES
app.post("/api/generate-travel", async (req, res) => {
  const { destination, budget, durationDays, season } = req.body;
  if (!destination) {
    return res.status(400).json({ error: "Destination is required." });
  }

  const duration = durationDays || "3";
  const bLevel = budget || "Premium Luxury";
  const seas = season || "Summer";

  // Define default coordinate fallback map just in case
  const defaultPlaces = [
    { id: "1", name: "The Grand Regal Hotel", type: "hotel", lat: 35.6895, lng: 139.6917, rating: 4.8, distance: "0.2 km from center", price: "$180/night", description: "Top luxury hotel with panoramic deck." },
    { id: "2", name: "Metro Central Suites", type: "hotel", lat: 35.6940, lng: 139.7020, rating: 4.5, distance: "1.1 km from center", price: "$110/night", description: "Modern boutique apartments near main station." },
    { id: "3", name: "Historic Square Inn", type: "hotel", lat: 35.6850, lng: 139.6820, rating: 4.3, distance: "1.5 km from center", price: "$85/night", description: "Cozy rooms with local vintage design." },
    { id: "4", name: "Scenic Overlook Point", type: "sight", lat: 35.6812, lng: 139.7103, rating: 4.9, distance: "2.3 km from center", price: "$15 entry", description: "Stunning viewing deck of the skyline." },
    { id: "5", name: "Ancient Temple Grounds", type: "sight", lat: 35.7001, lng: 139.6750, rating: 4.7, distance: "3.0 km from center", price: "Free", description: "Historic cultural landmark." }
  ];

  // Map destinations to specific realistic coordinates so the mock or real map looks amazing
  let center = { lat: 35.6762, lng: 139.6503 }; // Tokyo default
  let places = [...defaultPlaces];

  const lowerDest = destination.toLowerCase();
  if (lowerDest.includes("tokyo")) {
    center = { lat: 35.6762, lng: 139.6503 };
    places = [
      { id: "1", name: "Shinjuku Park Hyatt", type: "hotel", lat: 35.6862, lng: 139.6918, rating: 4.9, distance: "0.8 km", price: "$450/night", description: "Iconic high-rise hotel with Mount Fuji views." },
      { id: "2", name: "Kyobashi Sakura Hotel", type: "hotel", lat: 35.6782, lng: 139.7712, rating: 4.6, distance: "1.2 km", price: "$160/night", description: "Elegant rooms with traditional cherry blossom themes." },
      { id: "3", name: "Asakusa Riverside Hostel", type: "hotel", lat: 35.7121, lng: 139.7963, rating: 4.2, distance: "4.5 km", price: "$45/night", description: "Comfortable backpacker rooms near Senso-ji." },
      { id: "4", name: "Senso-ji Temple", type: "sight", lat: 35.7148, lng: 139.7967, rating: 4.8, distance: "4.6 km", price: "Free", description: "Tokyo's oldest and most significant temple." },
      { id: "5", name: "Meiji Jingu Shrine", type: "sight", lat: 35.6764, lng: 139.6993, rating: 4.7, distance: "1.5 km", price: "Free", description: "Solemn shrine surrounded by a lush forest." }
    ];
  } else if (lowerDest.includes("kyoto")) {
    center = { lat: 34.9858, lng: 135.7588 };
    places = [
      { id: "1", name: "The Thousand Kyoto", type: "hotel", lat: 34.9868, lng: 135.7608, rating: 4.8, distance: "0.3 km", price: "$280/night", description: "Sustainable luxury hotel with Zen garden elements." },
      { id: "2", name: "Gion Heritage Ryokan", type: "hotel", lat: 35.0037, lng: 135.7782, rating: 4.7, distance: "2.1 km", price: "$220/night", description: "Traditional Japanese inn experience in Gion district." },
      { id: "3", name: "Arashiyama Bamboo Lodge", type: "hotel", lat: 35.0156, lng: 135.6715, rating: 4.4, distance: "7.2 km", price: "$95/night", description: "Cozy cabins right next to the bamboo forest." },
      { id: "4", name: "Fushimi Inari-taisha", type: "sight", lat: 34.9671, lng: 135.7727, rating: 4.9, distance: "3.5 km", price: "Free", description: "Famous shrine with thousands of vibrant vermilion torii gates." },
      { id: "5", name: "Kinkaku-ji (Golden Pavilion)", type: "sight", lat: 35.0394, lng: 135.7292, rating: 4.8, distance: "6.8 km", price: "$5 entry", description: "Zen temple covered in pure gold leaf." }
    ];
  } else if (lowerDest.includes("swiss") || lowerDest.includes("switzerland") || lowerDest.includes("zurich") || lowerDest.includes("geneva")) {
    center = { lat: 47.3769, lng: 8.5417 };
    places = [
      { id: "1", name: "Baur au Lac", type: "hotel", lat: 47.3669, lng: 8.5398, rating: 4.9, distance: "0.9 km", price: "$580/night", description: "World-class historic hotel on the lake shore." },
      { id: "2", name: "CitizenM Zurich Center", type: "hotel", lat: 47.3725, lng: 8.5348, rating: 4.5, distance: "0.5 km", price: "$190/night", description: "Hi-tech smart boutique hotel in the financial district." },
      { id: "3", name: "Altstadt Hotel", type: "hotel", lat: 47.3712, lng: 8.5441, rating: 4.3, distance: "0.6 km", price: "$120/night", description: "Comfortable rooms inside the historic Old Town lanes." },
      { id: "4", name: "Grossmünster Cathedral", type: "sight", lat: 47.3701, lng: 8.5445, rating: 4.6, distance: "0.7 km", price: "Free", description: "Double-towered Romanesque cathedral on the Limmat River." },
      { id: "5", name: "Uetliberg Mountain Peak", type: "sight", lat: 47.3494, lng: 8.4912, rating: 4.8, distance: "4.5 km", price: "$10 train", description: "Panoramic view of Zurich and the snow-capped Alps." }
    ];
  } else if (lowerDest.includes("paris") || lowerDest.includes("france")) {
    center = { lat: 48.8566, lng: 2.3522 };
    places = [
      { id: "1", name: "The Ritz Paris", type: "hotel", lat: 48.8681, lng: 2.3294, rating: 4.9, distance: "1.5 km", price: "$850/night", description: "Legendary luxury hotel on Place Vendôme." },
      { id: "2", name: "Hotel Les Marais", type: "hotel", lat: 48.8592, lng: 2.3615, rating: 4.6, distance: "1.1 km", price: "$180/night", description: "Chic design hotel in the creative heart of Paris." },
      { id: "3", name: "St. Christopher's Canal", type: "hotel", lat: 48.8872, lng: 2.3734, rating: 4.1, distance: "3.8 km", price: "$40/night", description: "Budget-friendly canal hostel with terrace." },
      { id: "4", name: "The Eiffel Tower", type: "sight", lat: 48.8584, lng: 2.2945, rating: 4.8, distance: "4.2 km", price: "$25 entry", description: "The iconic symbol of Paris." },
      { id: "5", name: "The Louvre Museum", type: "sight", lat: 48.8606, lng: 2.3376, rating: 4.9, distance: "1.0 km", price: "$20 entry", description: "The world's largest art museum." }
    ];
  } else if (lowerDest.includes("new york") || lowerDest.includes("ny") || lowerDest.includes("manhattan") || lowerDest.includes("usa")) {
    center = { lat: 40.7128, lng: -74.0060 };
    places = [
      { id: "1", name: "The Plaza Hotel", type: "hotel", lat: 40.7645, lng: -73.9744, rating: 4.9, distance: "6.2 km", price: "$650/night", description: "Historic landmark luxury hotel next to Central Park." },
      { id: "2", name: "Arlo NoMad", type: "hotel", lat: 40.7444, lng: -73.9845, rating: 4.5, distance: "3.8 km", price: "$195/night", description: "Stylish micro-rooms with spectacular skyline rooftops." },
      { id: "3", name: "Chelsea International Hostel", type: "hotel", lat: 40.7449, lng: -74.0012, rating: 4.1, distance: "3.5 km", price: "$55/night", description: "Great budget rooms in central Manhattan." },
      { id: "4", name: "Empire State Building", type: "sight", lat: 40.7484, lng: -73.9857, rating: 4.7, distance: "4.1 km", price: "$45 entry", description: "Fabulous Art Deco skyscraper with 360 observations." },
      { id: "5", name: "Central Park Meadow", type: "sight", lat: 40.7850, lng: -73.9683, rating: 4.9, distance: "8.5 km", price: "Free", description: "Breathtaking urban park escape with lake." }
    ];
  } else if (lowerDest.includes("london") || lowerDest.includes("uk") || lowerDest.includes("england")) {
    center = { lat: 51.5074, lng: -0.1278 };
    places = [
      { id: "1", name: "The Savoy Hotel", type: "hotel", lat: 51.5104, lng: -0.1204, rating: 4.9, distance: "0.6 km", price: "$480/night", description: "Edwardian glamour and luxury on the Thames Strand." },
      { id: "2", name: "CitizenM Tower of London", type: "hotel", lat: 51.5098, lng: -0.0773, rating: 4.6, distance: "3.1 km", price: "$210/night", description: "Modern boutique stay directly next to the Tower Hill station." },
      { id: "3", name: "Clink78 Kings Cross", type: "hotel", lat: 51.5298, lng: -0.1172, rating: 4.1, distance: "2.4 km", price: "$38/night", description: "Unique courthouse hostel conversion for backpackers." },
      { id: "4", name: "The London Eye", type: "sight", lat: 51.5033, lng: -0.1195, rating: 4.7, distance: "0.8 km", price: "$35 entry", description: "Spectacular observation giant wheel opposite Big Ben." },
      { id: "5", name: "The British Museum", type: "sight", lat: 51.5194, lng: -0.1270, rating: 4.8, distance: "1.3 km", price: "Free", description: "Monumental historic museum of global civilizations." }
    ];
  } else {
    // Generate custom places dynamically based on destination name
    const hash = destination.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const baseLat = 10 + (hash % 45) + 0.1234;
    const baseLng = -70 + ((hash * 7) % 150) + 0.5678;
    center = { lat: baseLat, lng: baseLng };
    places = [
      { id: "1", name: `${destination} Grand Resort`, type: "hotel", lat: baseLat + 0.005, lng: baseLng - 0.004, rating: 4.8, distance: "0.6 km", price: "$220/night", description: "Premium waterfront stay." },
      { id: "2", name: `${destination} Boutique Suites`, type: "hotel", lat: baseLat - 0.008, lng: baseLng + 0.007, rating: 4.6, distance: "1.1 km", price: "$140/night", description: "Modern central quarters." },
      { id: "3", name: `${destination} Backpacker Lodge`, type: "hotel", lat: baseLat + 0.012, lng: baseLng + 0.015, rating: 4.2, distance: "2.1 km", price: "$35/night", description: "Social budget stay." },
      { id: "4", name: `${destination} Historic Lookout`, type: "sight", lat: baseLat - 0.003, lng: baseLng - 0.010, rating: 4.7, distance: "1.2 km", price: "$12 entry", description: "Legendary structural lookout landmark." },
      { id: "5", name: `${destination} Botanical Sanctuary`, type: "sight", lat: baseLat + 0.015, lng: baseLng - 0.008, rating: 4.9, distance: "2.5 km", price: "Free", description: "Exotic peaceful natural park grounds." }
    ];
  }

  try {
    let itineraryText = "";
    if (ai) {
      const prompt = `Generate a high-fidelity, professional travel plan for ${duration} days in ${destination} during ${seas} under a ${bLevel} budget.
Introduce the itinerary with a brief description of the local climate and culture during ${seas}.
Highlight:
1. Popular hotels to stay (mentioning why they are selected for a ${bLevel} budget).
2. Distances and walking/transit times between spots.
3. Tips to book tickets online for attractions or transit.
Format in elegant, scannable Markdown with headers, bold keys, and bullet points. Avoid any sales hype; make it extremely practical and structured.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      if (response.text) {
        itineraryText = response.text.trim();
      }
    }

    if (!itineraryText) {
      // Robust fallback
      itineraryText = `### ✈️ ${duration}-Day Lifestyle Itinerary: ${destination} (${seas})
**Curated Pacing Level: ${bLevel}**

Welcome to your tailored travel plan. Here is your streamlined plan to experience the best of ${destination} during the ${seas} season.

#### 🏨 Popular Stays & Booking Tips
- **Premium Pick**: Select hotels near the city center to save commute times. 
- **Booking Tickets Online**: Always reserve entrance tickets to popular attractions at least 48 hours in advance to bypass long physical queues and lock in special internet discounts.

#### ✦ Curated Route Execution
- **Day 1: Arrival & Ingest**: Private airport shuttle to check-in. Evening walk to orient yourself near the local landmarks.
- **Day 2: Core Exploration**: Spend the morning at historic landmarks (booking tickets online is highly recommended). Take local public transit (buses/metros) for scenic routes.
- **Day 3: Panorama & Local Gastronomy**: Discover scenic overlooks, explore artisan street markets, and finish with a curated dinner.

*Distances are calculated dynamically in the map panel. Safe travels!*`;
    }

    return res.json({
      success: true,
      itineraryText,
      places,
      center
    });
  } catch (error: any) {
    console.error("Error generating travel plan:", error);
    return res.status(500).json({ error: error.message || "Failed to generate travel plan" });
  }
});

// STUDY PLANS ROUTES
app.get("/api/study-plans", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const list = await getStudyPlans(uid);
    return res.json({ success: true, studyPlans: list });
  } catch (error: any) {
    console.error("Error fetching study plans:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch study plans" });
  }
});

app.post("/api/study-plans", requireAuth, async (req: AuthRequest, res) => {
  const { syllabus, planText } = req.body;
  if (!syllabus || !planText) {
    return res.status(400).json({ error: "Syllabus and plan text are required fields." });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const saved = await saveStudyPlan(uid, syllabus, planText);
    return res.json({ success: true, studyPlan: saved });
  } catch (error: any) {
    console.error("Error creating study plan:", error);
    return res.status(500).json({ error: error.message || "Failed to preserve study plan" });
  }
});

// PATIENT TRIAGES ROUTES
app.get("/api/patient-triages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const list = await getPatientTriages(uid);
    return res.json({ success: true, patientTriages: list });
  } catch (error: any) {
    console.error("Error fetching patient triages:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch patient triages" });
  }
});

app.post("/api/patient-triages", requireAuth, async (req: AuthRequest, res) => {
  const { patientName, symptoms, urgency, triageDetails } = req.body;
  if (!patientName || !symptoms || !urgency || !triageDetails) {
    return res.status(400).json({ error: "Missing patient checklist / triage details" });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const saved = await savePatientTriage(uid, patientName, symptoms, urgency, triageDetails);
    return res.json({ success: true, patientTriage: saved });
  } catch (error: any) {
    console.error("Error creating patient triage:", error);
    return res.status(500).json({ error: error.message || "Failed to preserve patient triage" });
  }
});

// EMAIL BILLINGS ROUTES
app.get("/api/email-billings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const list = await getEmailBillings(uid);
    return res.json({ success: true, emailBillings: list });
  } catch (error: any) {
    console.error("Error fetching email billings:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch email billings" });
  }
});

app.post("/api/email-billings", requireAuth, async (req: AuthRequest, res) => {
  const { clientName, amount, services, emailSubject, emailBody } = req.body;
  if (!clientName || !amount || !services || !emailSubject || !emailBody) {
    return res.status(400).json({ error: "Missing invoice details or email body" });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const saved = await saveEmailBilling(uid, clientName, amount, services, emailSubject, emailBody);
    return res.json({ success: true, emailBilling: saved });
  } catch (error: any) {
    console.error("Error creating email billing:", error);
    return res.status(500).json({ error: error.message || "Failed to preserve email billing" });
  }
});

// AGENT SUBSCRIPTIONS ROUTES
app.get("/api/subscriptions", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const list = await getAgentSubscriptions(uid);
    return res.json({ success: true, subscriptions: list });
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch subscriptions" });
  }
});

app.post("/api/subscriptions", requireAuth, async (req: AuthRequest, res) => {
  const { agentId, planName, priceCharged } = req.body;
  if (!agentId || !planName || !priceCharged) {
    return res.status(400).json({ error: "Missing agent ID, subscription plan name, or price charged." });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Missing verified UID" });

    const saved = await createAgentSubscription(uid, agentId, planName, priceCharged);
    return res.json({ success: true, subscription: saved });
  } catch (error: any) {
    console.error("Error purchasing agent subscription:", error);
    return res.status(500).json({ error: error.message || "Failed to provision subscription node" });
  }
});

// REST API for generating a custom AI solution blueprint
app.post("/api/blueprint", async (req, res) => {
  const { industry, challenge, scale } = req.body;

  if (!industry || !challenge) {
    return res.status(400).json({ error: "Industry and challenge are required fields." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "AI Integration Service is temporarily unavailable. Please configure the GEMINI_API_KEY in Secrets.",
    });
  }

  try {
    const prompt = `Create a realistic, highly actionable B2B AI Solution Blueprint for a small/medium business in the following category:
Industry: ${industry}
Core Operational Challenge: ${challenge}
Company Size/Scale: ${scale || "Under 25 employees"}

Provide an elevated, minimalist, and direct solution design that validates their need quickly with minimal waste. Give actionable advice rather than buzzwords.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are VALIDATE's lead AI solutions architect. Your task is to provide direct, modular, realistic AI deployment plans for small businesses. Avoid excessive corporate buzzwords. Offer actual, simple API integrations, workflows, and tangible open-source/SaaS building blocks (e.g. Make.com, n8n, OpenAI, Gemini APIs, Claude, Vercel, or simple custom python scripts). Focus on high ROI and quick validation.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["solutionName", "concept", "effortScore", "impactScore", "timelineWeeks", "implementationPhases", "roiMetrics", "customPrompt"],
          properties: {
            solutionName: {
              type: Type.STRING,
              description: "A short, sharp, professional title for the custom solution.",
            },
            concept: {
              type: Type.STRING,
              description: "A clear, compelling 1-sentence description of the AI solution.",
            },
            effortScore: {
              type: Type.INTEGER,
              description: "Estimated effort to deploy (1 to 10, where 1 is extremely simple, 10 is complex custom models).",
            },
            impactScore: {
              type: Type.INTEGER,
              description: "Estimated operational impact (1 to 10, where 1 is minor benefit, 10 is transformative automation).",
            },
            timelineWeeks: {
              type: Type.INTEGER,
              description: "Time to validate a Working Prototype in weeks.",
            },
            implementationPhases: {
              type: Type.ARRAY,
              description: "Step-by-step modular validation phases (exactly 3 phases).",
              items: {
                type: Type.OBJECT,
                required: ["phaseTitle", "details"],
                properties: {
                  phaseTitle: { type: Type.STRING, description: "e.g., 'Phase 1: Secure Data Feed' or 'Phase 2: Agent Assembly'" },
                  details: { type: Type.STRING, description: "Actionable technical tools or steps involved." }
                }
              }
            },
            roiMetrics: {
              type: Type.STRING,
              description: "Concrete estimated business ROI (e.g., 'Saves 12 hours/week in customer support' or 'Reduces data entry error rate to <0.5%').",
            },
            customPrompt: {
              type: Type.STRING,
              description: "A highly tailored, direct AI system prompt or instruction prompt they can copy and paste into their own workflows/GPTs immediately.",
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI client");
    }

    const parsedBlueprint = JSON.parse(resultText);
    return res.json(parsedBlueprint);
  } catch (error: any) {
    console.error("Error generating blueprint:", error);
    return res.status(500).json({
      error: "Failed to generate your blueprint. Please try again in a moment.",
      details: error.message || error,
    });
  }
});

// Helper function to send email via nodemailer
async function sendOTPEmail(email: string, otp: string, purpose: string): Promise<{ success: boolean; previewUrl?: string | false }> {
  console.log(`[EMAIL SYSTEM] Triggering OTP generation for ${email}: ${otp} (${purpose})`);
  
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  try {
    let transporter;
    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Automatic test Ethereal transporter setup
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: '"VALIDATE AI LABS" <noreply@validateai.labs>',
      to: email,
      subject: `Your VALIDATE Verification OTP: ${otp}`,
      text: `Hello,\n\nYour verification code is: ${otp}\n\nThis code was requested for ${purpose}. It is valid for 10 minutes.\n\nBest,\nVALIDATE AI Labs Team`,
      html: `
        <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; text-align: center; border: 4px solid #111; max-width: 500px; margin: auto;">
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">VALIDATE</h1>
          <p style="font-size: 14px; font-weight: 300; color: #a3a3a3; margin-bottom: 30px; font-style: italic;">"Architecture for the Intelligent Enterprise"</p>
          <div style="background-color: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); padding: 30px; margin-bottom: 30px;">
            <p style="font-size: 10px; font-family: monospace; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; margin: 0 0 10px 0;">YOUR ONE-TIME ACCESS KEY</p>
            <h2 style="font-size: 36px; font-weight: 900; letter-spacing: 0.15em; margin: 0; color: #fff;">${otp}</h2>
          </div>
          <p style="font-size: 12px; color: #737373; margin-bottom: 5px;">This OTP expires in 10 minutes. Intended for <strong>${purpose}</strong>.</p>
          <p style="font-size: 9px; color: #404040; margin-top: 30px;">&copy; 2026 VALIDATE LABS. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SYSTEM] Message successfully sent to ${email}. MessageId: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL SYSTEM] Preview Ethereal URL: ${previewUrl}`);
    }
    return { success: true, previewUrl };
  } catch (error) {
    console.error("[EMAIL SYSTEM] Error sending verification email:", error);
    return { success: false };
  }
}

// REST API for User Registration with OTP
app.post("/api/auth/register", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required." });
  }

  try {
    const existingUser = getUser(email);
    if (existingUser && existingUser.verified) {
      return res.status(400).json({ error: "This email is already registered. Please go to Login instead." });
    }

    // Save/update user as unverified first
    saveUser(email, name, false);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOTP(email, otp);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, "Registration");

    return res.json({
      success: true,
      email,
      message: "An OTP access key has been generated and dispatched.",
      previewUrl: emailResult.previewUrl || null,
      debugOtp: otp, // In sandbox, provide this so they can test immediately if SMTP takes time
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Failed to process registration requests." });
  }
});

// REST API for User Login with OTP
app.post("/api/auth/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const existingUser = getUser(email);
    if (!existingUser) {
      return res.status(404).json({ error: "No verified account associated with this email. Please Register first." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOTP(email, otp);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, "Login Authentication");

    return res.json({
      success: true,
      email,
      message: "An authentication access key has been dispatched to your email inbox.",
      previewUrl: emailResult.previewUrl || null,
      debugOtp: otp, // Sandbox helper
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to process authentication requests." });
  }
});

// REST API for OTP Verification
app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and OTP verification code are required." });
  }

  try {
    const isVerified = verifyOTP(email, code);
    if (!isVerified) {
      return res.status(400).json({ error: "Invalid, incorrect, or expired OTP verification code." });
    }

    // Mark user as fully verified in DB
    const existingUser = getUser(email);
    if (existingUser) {
      setVerified(email);
    } else {
      // Just in case, save user as verified
      saveUser(email, "VALIDATE Client", true);
    }

    const updatedUser = getUser(email);

    return res.json({
      success: true,
      user: updatedUser,
      message: "Access granted. Session authenticated successfully.",
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: "Failed to verify access key." });
  }
});

// REST API to get Chat History for a User
app.get("/api/chats/:email", async (req, res) => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({ error: "User email parameter is required." });
  }

  try {
    const messages = getChatHistory(email);
    return res.json({ success: true, messages });
  } catch (error: any) {
    console.error("Fetch chat error:", error);
    return res.status(500).json({ error: "Failed to retrieve chat history." });
  }
});

// REST API to post a Chat Message and get Gemini AI custom response
app.post("/api/chats/:email/message", async (req, res) => {
  const { email } = req.params;
  const { text } = req.body;

  if (!email || !text) {
    return res.status(400).json({ error: "Email and message text are required." });
  }

  try {
    // 1. Add user message to DB
    addChatMessage(email, "user", text);

    // 2. Generate Gemini dynamic response
    let aiResponse = "I have received your query. Let's design a validated AI node tailored for you.";
    
    if (ai) {
      const chatHistory = getChatHistory(email);
      // Construct a conversation history context for Gemini
      const conversationContext = chatHistory.slice(-10).map(msg => {
        return `${msg.sender === "user" ? "Client" : "Abhay Ghodeswar"}: ${msg.text}`;
      }).join("\n");

      const prompt = `You are Abhay Ghodeswar, the Founder and Lead AI Solutions Architect at VALIDATE. You are in a direct chat consultation with an operational client whose email is ${email}.
      
Current Chat Conversation History:
${conversationContext}

Please respond directly to the client's latest message.
Your voice guidelines:
- Speak as a highly technical, competent, and honest architectural partner.
- Absolutely NO corporate buzzwords, excessive pleasantries, or generic AI fluff.
- Offer extremely practical, lean validation solutions.
- Keep responses compact (under 3 or 4 sentences where possible) and deeply technical.
- If they ask for a solution, lay it down as an actual automation workflow (e.g., "We can script an Express listener proxying requests to Gemini and archiving results to a JSON file in under 4 hours").
- Be humble, professional, and focus on stopping capital waste.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      if (response.text) {
        aiResponse = response.text.trim();
      }
    } else {
      aiResponse = "VALIDATE system node is active in fallback offline mode. Please configure GEMINI_API_KEY in secrets to enable live architectural consultation with Abhay Ghodeswar.";
    }

    // 3. Save AI response to DB
    const finalHistory = addChatMessage(email, "system", aiResponse);

    return res.json({
      success: true,
      messages: finalHistory,
    });
  } catch (error: any) {
    console.error("Post chat message error:", error);
    return res.status(500).json({ error: "Failed to route chat dialogue node." });
  }
});

// Setup development server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VALIDATE server booting on http://localhost:${PORT}`);
  });
}

startServer();
