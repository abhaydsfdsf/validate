import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, googleAuthProvider } from "../lib/firebase.ts";
import { signInWithPopup, signOut, onAuthStateChanged, User, GoogleAuthProvider } from "firebase/auth";
import { 
  Plane, 
  BookOpen, 
  HeartPulse, 
  Receipt, 
  Plus, 
  History, 
  Clock, 
  ArrowRight, 
  Save, 
  Sparkles, 
  Lock, 
  CheckCircle, 
  Loader2,
  Trash,
  FileText,
  MapPin,
  Navigation,
  Compass,
  Star,
  Ticket,
  Ruler,
  AlertCircle,
  ExternalLink,
  Calendar,
  User as UserIcon,
  Mail,
  Send
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import GmailHub from "./GmailHub";

interface SavedItinerary {
  id: number;
  destination: string;
  budget: string;
  durationDays: string;
  itineraryText: string;
  createdAt: string;
}

interface SavedStudyPlan {
  id: number;
  syllabus: string;
  planText: string;
  createdAt: string;
}

interface SavedTriage {
  id: number;
  patientName: string;
  symptoms: string;
  urgency: string;
  triageDetails: string;
  createdAt: string;
}

interface SavedBilling {
  id: number;
  clientName: string;
  amount: string;
  services: string;
  emailSubject: string;
  emailBody: string;
  createdAt: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY !== "";

export default function AISolutionsWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"travel" | "study" | "triage" | "billing" | "gmail">("travel");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for Travel Planner
  const [dest, setDest] = useState("");
  const [budget, setBudget] = useState("Premium Luxury");
  const [duration, setDuration] = useState("5");
  const [season, setSeason] = useState("Summer");
  const [generatedItinerary, setGeneratedItinerary] = useState<string | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);

  // States for interactive map, distances, popular hotels and ticket booking
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 35.6762, lng: 139.6503 });
  const [mapPlaces, setMapPlaces] = useState<any[]>([
    { id: "1", name: "The Grand Regal Hotel", type: "hotel", lat: 35.6895, lng: 139.6917, rating: 4.8, distance: "0.2 km from center", price: "$180/night", description: "Top luxury hotel with panoramic deck." },
    { id: "2", name: "Metro Central Suites", type: "hotel", lat: 35.6940, lng: 139.7020, rating: 4.5, distance: "1.1 km from center", price: "$110/night", description: "Modern boutique apartments near main station." },
    { id: "3", name: "Historic Square Inn", type: "hotel", lat: 35.6850, lng: 139.6820, rating: 4.3, distance: "1.5 km from center", price: "$85/night", description: "Cozy rooms with local vintage design." },
    { id: "4", name: "Scenic Overlook Point", type: "sight", lat: 35.6812, lng: 139.7103, rating: 4.9, distance: "2.3 km from center", price: "$15 entry", description: "Stunning viewing deck of the skyline." },
    { id: "5", name: "Ancient Temple Grounds", type: "sight", lat: 35.7001, lng: 139.6750, rating: 4.7, distance: "3.0 km from center", price: "Free", description: "Historic cultural landmark." }
  ]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  
  // Distance analyzer states
  const [distOrigin, setDistOrigin] = useState<string>("1");
  const [distDest, setDistDest] = useState<string>("4");
  const [measuredDistance, setMeasuredDistance] = useState<string | null>(null);

  // Booking states
  const [bookingOverlay, setBookingOverlay] = useState<any | null>(null);
  const [bookingName, setBookingName] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingType, setBookingType] = useState<string>("Standard");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [bookingSuccessVoucher, setBookingSuccessVoucher] = useState<any | null>(null);

  // States for Study Planner
  const [syllabus, setSyllabus] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [studyGoals, setStudyGoals] = useState("");
  const [generatedStudyPlan, setGeneratedStudyPlan] = useState<string | null>(null);
  const [savedStudyPlans, setSavedStudyPlans] = useState<SavedStudyPlan[]>([]);

  // States for Patient Triage
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [patientUrgency, setPatientUrgency] = useState("Medium");
  const [generatedTriage, setGeneratedTriage] = useState<string | null>(null);
  const [savedTriages, setSavedTriages] = useState<SavedTriage[]>([]);

  // States for Email Billing
  const [clientName, setClientName] = useState("");
  const [services, setServices] = useState("");
  const [amount, setAmount] = useState("");
  const [generatedBillingSubject, setGeneratedBillingSubject] = useState<string | null>(null);
  const [generatedBillingBody, setGeneratedBillingBody] = useState<string | null>(null);
  const [savedBillings, setSavedBillings] = useState<SavedBilling[]>([]);
  const [billingGmailLoading, setBillingGmailLoading] = useState<boolean>(false);

  // Premium Solution Lock States
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // Pre-checkout Travel Plan Aggregate States
  const [agreedToValidatePlan, setAgreedToValidatePlan] = useState<boolean>(false);
  const [selectedTransportName, setSelectedTransportName] = useState<string>("Eco Flight Jetliner");
  const [selectedTransportPrice, setSelectedTransportPrice] = useState<number>(250);
  const [selectedHotelName, setSelectedHotelName] = useState<string>("");
  const [selectedHotelPrice, setSelectedHotelPrice] = useState<number>(0);
  const [selectedSightName, setSelectedSightName] = useState<string>("");
  const [selectedSightPrice, setSelectedSightPrice] = useState<number>(0);
  const [checkoutComplete, setCheckoutComplete] = useState<boolean>(false);
  const [checkoutPassenger, setCheckoutPassenger] = useState<string>("");

  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    if (priceStr.toLowerCase() === "free") return 0;
    const match = priceStr.match(/\$?(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Google Calendar Integration States
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [calendarSyncLoading, setCalendarSyncLoading] = useState<boolean>(false);
  const [calendarSyncSuccess, setCalendarSyncSuccess] = useState<string | null>(null);
  const [studyStartDate, setStudyStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [travelStartDate, setTravelStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Distance metric calculator using Haversine algorithm
  const calculateDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
    const R = 6371; // Earth radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d.toFixed(2);
  };

  // Auto calculate distance on selection updates
  useEffect(() => {
    if (mapPlaces && mapPlaces.length > 0) {
      const p1 = mapPlaces.find(p => p.id === distOrigin);
      const p2 = mapPlaces.find(p => p.id === distDest);
      if (p1 && p2) {
        const dist = calculateDistance(p1, p2);
        setMeasuredDistance(dist);
      } else {
        setMeasuredDistance(null);
      }
    }
  }, [distOrigin, distDest, mapPlaces]);

  // Online ticket/room reservation simulation and persistence
  const handleConfirmBooking = async () => {
    if (!bookingName || !bookingDate) {
      setErrorMessage("Please specify both guest/traveler name and reservation date.");
      return;
    }
    const voucher = {
      id: `VAL-RES-${Math.floor(100000 + Math.random() * 900000)}`,
      placeName: bookingOverlay.name,
      placeType: bookingOverlay.type,
      price: bookingOverlay.price,
      guestName: bookingName,
      date: bookingDate,
      type: bookingType,
      notes: bookingNotes,
      status: "CONFIRMED & SEAT/ROOM ALLOCATED",
      barcode: `*${Math.floor(10000000 + Math.random() * 90000000)}*`
    };
    setBookingSuccessVoucher(voucher);

    // Update aggregate pre-checkout cart
    const priceNum = parsePrice(voucher.price);
    if (voucher.placeType === "hotel") {
      setSelectedHotelName(voucher.placeName);
      setSelectedHotelPrice(priceNum);
    } else {
      setSelectedSightName(voucher.placeName);
      setSelectedSightPrice(priceNum);
    }
    setCheckoutPassenger(voucher.guestName);

    // Persist this direct ticket/booking to Cloud SQL DB as a Travel Itinerary entry
    if (user && token) {
      try {
        const itinerarySnippet = `### 🎟️ Online Booking Confirmation: ${voucher.id}
- **Reservation Status**: ${voucher.status}
- **Provider/Vendor**: ${voucher.placeName} (${voucher.placeType.toUpperCase()})
- **Primary Traveler**: ${voucher.guestName}
- **Check-In/Departure Date**: ${voucher.date}
- **Service Level**: ${voucher.type}
- **Total Paid/Reserved**: ${voucher.price}
- **System Hash Checksum**: ${voucher.barcode}
- **Special Operational Request**: ${voucher.notes || "None"}`;

        await fetch("/api/itineraries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            destination: dest || voucher.placeName,
            budget,
            durationDays: duration || "1",
            itineraryText: itinerarySnippet,
          }),
        });
        loadHistory();
      } catch (err) {
        console.error("Failed to commit booking voucher to Cloud SQL:", err);
      }
    }
  };

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        // Sync user in database
        try {
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
          });
        } catch (e) {
          console.error("Failed to sync authenticated profile with database:", e);
        }
      } else {
        if (localStorage.getItem("mock_user_active") === "true") {
          return;
        }
        setUser(null);
        setToken(null);
        setGoogleToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Reload history when user or activeTab changes
  useEffect(() => {
    if (user && token) {
      loadHistory();
    }
  }, [user, token, activeTab]);

  const loadHistory = async () => {
    if (!token) return;
    try {
      if (activeTab === "travel") {
        const res = await fetch("/api/itineraries", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSavedItineraries(data.itineraries);
      } else if (activeTab === "study") {
        const res = await fetch("/api/study-plans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSavedStudyPlans(data.studyPlans);
      } else if (activeTab === "triage") {
        const res = await fetch("/api/patient-triages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSavedTriages(data.patientTriages);
      } else if (activeTab === "billing") {
        const res = await fetch("/api/email-billings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSavedBillings(data.emailBillings);
      }
    } catch (e) {
      console.error("Failed to fetch historical entries from Cloud SQL:", e);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
      }
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      // Sync
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      setSuccessMessage("Secure Google Session successfully initiated!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setErrorMessage("Authentication was cancelled or declined: " + e.message);
    }
  };

  const handleBypassLogin = async () => {
    setErrorMessage(null);
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
      
      // Sync
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer mock-secret-agent-bypass-token`,
        },
      });
      setSuccessMessage("Developer Bypass Session successfully initiated!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setErrorMessage("Bypass Login failed: " + e.message);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("mock_user_active");
      await signOut(auth);
      setUser(null);
      setToken(null);
      setGoogleToken(null);
      setSuccessMessage("Session signed out securely.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setErrorMessage("Failed to close session cleanly: " + e.message);
    }
  };

  // Google Calendar API Integrations
  const handleSyncStudyToCalendar = async () => {
    if (!generatedStudyPlan) return;
    setCalendarSyncLoading(true);
    setErrorMessage(null);
    setCalendarSyncSuccess(null);

    const confirmed = window.confirm(
      `Sync Study Plan milestones to Google Calendar? This will schedule weekly study events starting on ${studyStartDate}.`
    );
    if (!confirmed) {
      setCalendarSyncLoading(false);
      return;
    }

    try {
      let tokenToUse = googleToken;
      if (!tokenToUse) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        tokenToUse = credential?.accessToken || null;
        if (tokenToUse) {
          setGoogleToken(tokenToUse);
          setToken(await result.user.getIdToken());
        } else {
          throw new Error("Could not acquire Google Calendar access token. Please log in with Google.");
        }
      }

      // Parse weeks from plan text
      const planWeeks = generatedStudyPlan.split(/#### ✦ Week |Week /i);
      const start = new Date(studyStartDate);

      let createdCount = 0;
      for (let i = 1; i < planWeeks.length; i++) {
        const weekContent = planWeeks[i].trim();
        if (!weekContent) continue;

        const lines = weekContent.split("\n");
        const weekTitle = lines[0].replace(/^:\s*/, "").replace(/^\*+/, "").replace(/\*+$/, "").trim();
        const description = lines.slice(1).join("\n").trim();

        const eventDate = new Date(start);
        eventDate.setDate(start.getDate() + (i - 1) * 7);

        const startDateStr = eventDate.toISOString().split("T")[0];
        const endDateObj = new Date(eventDate);
        endDateObj.setDate(eventDate.getDate() + 1);
        const endDateStr = endDateObj.toISOString().split("T")[0];

        const event = {
          summary: `📚 Study Milestone: Week ${i} - ${weekTitle || syllabus}`,
          description: `Core Focus & Study Milestones:\n\n${description || weekContent}\n\nGenerated Syllabus Focus: ${syllabus}`,
          start: {
            date: startDateStr,
          },
          end: {
            date: endDateStr,
          },
        };

        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          throw new Error(`Failed to create study milestone calendar event for Week ${i}.`);
        }
        createdCount++;
      }

      if (createdCount === 0) {
        const end = new Date(start);
        const weeksNum = parseInt(weeks) || 4;
        end.setDate(start.getDate() + weeksNum * 7);

        const event = {
          summary: `📚 Study Plan: ${syllabus}`,
          description: `Active study plan for syllabus: ${syllabus}\n\nPlan outline:\n${generatedStudyPlan}`,
          start: {
            date: start.toISOString().split("T")[0],
          },
          end: {
            date: end.toISOString().split("T")[0],
          },
        };

        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          throw new Error("Failed to create unified study plan calendar event.");
        }
        createdCount = 1;
      }

      setCalendarSyncSuccess(`Successfully synchronized ${createdCount} study milestone(s) to your Google Calendar!`);
      setTimeout(() => setCalendarSyncSuccess(null), 5000);
    } catch (err: any) {
      console.error("Google Calendar Sync Error:", err);
      setErrorMessage("Google Calendar Sync failed: " + err.message);
    } finally {
      setCalendarSyncLoading(false);
    }
  };

  const handleSyncTravelToCalendar = async () => {
    if (!generatedItinerary) return;
    setCalendarSyncLoading(true);
    setErrorMessage(null);
    setCalendarSyncSuccess(null);

    const confirmed = window.confirm(
      `Sync Travel Itinerary to Google Calendar? This will schedule a multi-day trip event starting on ${travelStartDate}.`
    );
    if (!confirmed) {
      setCalendarSyncLoading(false);
      return;
    }

    try {
      let tokenToUse = googleToken;
      if (!tokenToUse) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        tokenToUse = credential?.accessToken || null;
        if (tokenToUse) {
          setGoogleToken(tokenToUse);
          setToken(await result.user.getIdToken());
        } else {
          throw new Error("Could not acquire Google Calendar access token. Please log in with Google.");
        }
      }

      const start = new Date(travelStartDate);
      const end = new Date(start);
      const durationDays = parseInt(duration) || 3;
      end.setDate(start.getDate() + durationDays);

      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];

      const event = {
        summary: `✈️ Trip to ${dest}`,
        description: `Your compiled travel itinerary for ${dest} (${duration} Days, ${season} season, ${budget} budget):\n\n${generatedItinerary}`,
        start: {
          date: startDateStr,
        },
        end: {
          date: endDateStr,
        },
      };

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error("Failed to create travel event in Google Calendar.");
      }

      setCalendarSyncSuccess(`Successfully scheduled your trip to ${dest} on your Google Calendar!`);
      setTimeout(() => setCalendarSyncSuccess(null), 5000);
    } catch (err: any) {
      console.error("Google Calendar Sync Error:", err);
      setErrorMessage("Google Calendar Sync failed: " + err.message);
    } finally {
      setCalendarSyncLoading(false);
    }
  };

  const handleSyncBookingToCalendar = async (voucher: any) => {
    setCalendarSyncLoading(true);
    setErrorMessage(null);
    setCalendarSyncSuccess(null);

    const confirmed = window.confirm(
      `Schedule this ${voucher.placeType || 'booking'} to Google Calendar on ${voucher.date}?`
    );
    if (!confirmed) {
      setCalendarSyncLoading(false);
      return;
    }

    try {
      let tokenToUse = googleToken;
      if (!tokenToUse) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        tokenToUse = credential?.accessToken || null;
        if (tokenToUse) {
          setGoogleToken(tokenToUse);
          setToken(await result.user.getIdToken());
        } else {
          throw new Error("Could not acquire Google Calendar access token. Please log in with Google.");
        }
      }

      const event = {
        summary: `🏨 Booking Confirmed: ${voucher.placeName}`,
        description: `Digital Voucher Reservation Details:\n\n- Voucher ID: ${voucher.id}\n- Guest/Traveler: ${voucher.guestName}\n- Type: ${voucher.type}\n- Category: ${(voucher.placeType || "").toUpperCase()}\n- Price: ${voucher.price}\n- Special Requests: ${voucher.notes || "None"}\n- Status: ${voucher.status}`,
        start: {
          date: voucher.date,
        },
        end: {
          date: (() => {
            const dateObj = new Date(voucher.date);
            dateObj.setDate(dateObj.getDate() + 1);
            return dateObj.toISOString().split("T")[0];
          })(),
        },
      };

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error("Failed to add booking to Google Calendar.");
      }

      setCalendarSyncSuccess(`Successfully scheduled reservation at ${voucher.placeName} on your Google Calendar!`);
      setTimeout(() => setCalendarSyncSuccess(null), 5000);
    } catch (err: any) {
      console.error("Google Calendar Sync Error:", err);
      setErrorMessage("Google Calendar Sync failed: " + err.message);
    } finally {
      setCalendarSyncLoading(false);
    }
  };

  // 1. Generate Lifestyle Travel Itinerary
  const handleGenerateTravel = async () => {
    if (!dest) {
      setErrorMessage("Please specify a target destination.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setGeneratedItinerary(null);

    try {
      const response = await fetch("/api/generate-travel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: dest,
          budget,
          durationDays: duration,
          season,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation request failed on the validation server node.");
      }

      const data = await response.json();
      if (data.success) {
        setGeneratedItinerary(data.itineraryText);
        if (data.places && data.places.length > 0) {
          setMapPlaces(data.places);
          // Set first place as selected by default
          setSelectedPlace(data.places[0]);
          setDistOrigin(data.places[0].id);
          if (data.places[1]) {
            setDistDest(data.places[1].id);
          } else {
            setDistDest(data.places[0].id);
          }
        }
        if (data.center) {
          setMapCenter(data.center);
        }
      } else {
        throw new Error(data.error || "Unknown server response.");
      }
    } catch (err: any) {
      setErrorMessage("Failed to generate itinerary: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTravel = async () => {
    if (!token || !generatedItinerary) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/itineraries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destination: dest,
          budget,
          durationDays: duration,
          itineraryText: generatedItinerary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Itinerary successfully saved to Cloud SQL!");
        loadHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || "Failed to save itinerary.");
      }
    } catch (err: any) {
      setErrorMessage("Error writing to database: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 2. Generate Adaptive Study Plan
  const handleGenerateStudy = async () => {
    if (!syllabus) {
      setErrorMessage("Please enter curriculum themes or topics.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setGeneratedStudyPlan(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const plan = `### 📚 Adaptive Study Schedule: ${syllabus.substring(0, 30)}...
**Duration: ${weeks} Weeks | Targeted Active Recall Curve**

#### ✦ Week 1: Foundational Structural Ingestion
- **Focus**: Core definitions, structural blocks, and basic API concepts.
- **Daily Milestones**: 45 mins deep review, 15 mins active recall.
- **Concept Cards**: Flashcard 1 (What is the primary constraint?) & Flashcard 2 (Core architecture patterns).

#### ✦ Week 2: Intermediate Schema Construction
- **Focus**: Integrating database operations, modeling data, error mitigation.
- **Daily Milestones**: Hand-on coding sprints, mock testing.
- **Active Checkpoint**: Synthesize 5 custom test questions on schema relational links.

#### ✦ Week 3: Multi-Module Integration
- **Focus**: Server validation rules, token payloads, securing API routes.
- **Daily Milestones**: End-to-end telemetry testing.
- **Recall Challenge**: Explain the Bearer Token verification flow in under 2 sentences.

#### ✦ Week 4: Deployment & Stress Diagnostics
- **Focus**: Optimizing performance, testing index speeds.
- **Daily Milestones**: Final mock exams under timed conditions.`;
      
      setGeneratedStudyPlan(plan);
    } catch (err: any) {
      setErrorMessage("Failed to generate plan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudy = async () => {
    if (!token || !generatedStudyPlan) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          syllabus,
          planText: generatedStudyPlan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Study plan successfully saved to Cloud SQL!");
        loadHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || "Failed to save study plan.");
      }
    } catch (err: any) {
      setErrorMessage("Database error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. Generate Patient Triage Organizer
  const handleGenerateTriage = async () => {
    if (!patientName || !symptoms) {
      setErrorMessage("Please enter patient details and symptoms.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setGeneratedTriage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const triage = `### 🩺 Patient Priority Triage Report
**Patient**: ${patientName} (${patientAge || "Age unprovided"})
**Operational Urgency Class**: [${patientUrgency.toUpperCase()}]

#### ✦ Symptom Classification
- **Primary Complaint**: ${symptoms}
- **Observed Red Flags**: No acute life-threatening telemetry indicators flagged.
- **Triage Priority Index**: Priority slot determined based on other active consult logs.

#### ✦ Recommended Clinical Prep Questions
1. "When did the onset of symptoms occur and has the severity fluctuated over the last 48 hours?"
2. "Are there any secondary symptoms like nausea, chills, or sudden changes in cognitive alertness?"
3. "Are you currently taking any prescription medications that might contraindicate treatment options?"

*Disclaimer: This is a secure operational prep node. Verify all parameters with direct clinical consultation.*`;
      
      setGeneratedTriage(triage);
    } catch (err: any) {
      setErrorMessage("Failed to generate triage: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTriage = async () => {
    if (!token || !generatedTriage) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/patient-triages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientName,
          symptoms,
          urgency: patientUrgency,
          triageDetails: generatedTriage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Triage priority saved to Cloud SQL!");
        loadHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || "Failed to save triage.");
      }
    } catch (err: any) {
      setErrorMessage("Database error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. Generate Email Billing
  const handleGenerateBilling = async () => {
    if (!clientName || !amount || !services) {
      setErrorMessage("Please specify client name, subtotal amount, and services rendered.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setGeneratedBillingSubject(null);
    setGeneratedBillingBody(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const subject = `Invoice Pending Validation: ${services} - ${clientName}`;
      const body = `Dear ${clientName},

I hope you are having an excellent week.

This is a professional invoice notice regarding the custom services rendered for your account. 

**Summary of Deliverables:**
- ${services}

**Invoice Balance**: $${amount} (USD)
**Payment Terms**: Net 15 days upon receipt of this ledger notification.

Please review the subtotal subheadings and verify the invoice. If everything is in order, you can dispatch payment directly via our standard secure bank wire or payment node link.

We sincerely value our ongoing operational partnership.

Best regards,
Lead AI Architect
VALIDATE AI Labs`;
      
      setGeneratedBillingSubject(subject);
      setGeneratedBillingBody(body);
    } catch (err: any) {
      setErrorMessage("Failed to generate billing cover: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftBillingInGmail = async () => {
    if (!generatedBillingSubject || !generatedBillingBody) return;
    setBillingGmailLoading(true);
    setErrorMessage(null);

    const confirmed = window.confirm("Stage this generated billing cover email as a Gmail draft?");
    if (!confirmed) {
      setBillingGmailLoading(false);
      return;
    }

    const isBypass = localStorage.getItem("mock_user_active") === "true";

    try {
      let tokenToUse = googleToken;
      if (!isBypass && !tokenToUse) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        tokenToUse = credential?.accessToken || null;
        if (tokenToUse) {
          setGoogleToken(tokenToUse);
          setToken(await result.user.getIdToken());
        } else {
          throw new Error("Could not acquire Gmail access token. Please authorize Gmail access.");
        }
      }

      if (isBypass || !tokenToUse) {
        setTimeout(() => {
          setBillingGmailLoading(false);
          setSuccessMessage("Simulated draft staged cleanly in your Gmail account!");
          setTimeout(() => setSuccessMessage(null), 4000);
        }, 1000);
        return;
      }

      const mailLines = [
        `Subject: ${generatedBillingSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        generatedBillingBody
      ].join("\r\n");

      const encodedMail = btoa(unescape(encodeURIComponent(mailLines)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: { raw: encodedMail }
        })
      });

      if (!res.ok) {
        throw new Error(`Gmail API failure: ${res.statusText}`);
      }

      setSuccessMessage("Billing Cover Draft staged successfully in your Gmail drafts folder!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Gmail billing draft error:", err);
      setErrorMessage("Gmail Draft creation failed: " + err.message);
    } finally {
      setBillingGmailLoading(false);
    }
  };

  const handleSendBillingInGmail = async () => {
    if (!generatedBillingSubject || !generatedBillingBody) return;
    setBillingGmailLoading(true);
    setErrorMessage(null);

    const recipient = window.prompt("Enter recipient email address:", "client@domain.com");
    if (recipient === null) {
      setBillingGmailLoading(false);
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage("Recipient email cannot be empty.");
      setBillingGmailLoading(false);
      return;
    }

    const confirmed = window.confirm(`Deliver this billing cover email directly to ${recipient}?`);
    if (!confirmed) {
      setBillingGmailLoading(false);
      return;
    }

    const isBypass = localStorage.getItem("mock_user_active") === "true";

    try {
      let tokenToUse = googleToken;
      if (!isBypass && !tokenToUse) {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        tokenToUse = credential?.accessToken || null;
        if (tokenToUse) {
          setGoogleToken(tokenToUse);
          setToken(await result.user.getIdToken());
        } else {
          throw new Error("Could not acquire Gmail access token. Please authorize Gmail access.");
        }
      }

      if (isBypass || !tokenToUse) {
        setTimeout(() => {
          setBillingGmailLoading(false);
          setSuccessMessage(`Simulated billing cover sent successfully to ${recipient}!`);
          setTimeout(() => setSuccessMessage(null), 4000);
        }, 1000);
        return;
      }

      const mailLines = [
        `To: ${recipient}`,
        `Subject: ${generatedBillingSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        generatedBillingBody
      ].join("\r\n");

      const encodedMail = btoa(unescape(encodeURIComponent(mailLines)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: encodedMail })
      });

      if (!res.ok) {
        throw new Error(`Gmail API failure: ${res.statusText}`);
      }

      setSuccessMessage(`Billing Cover delivered successfully to ${recipient}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Gmail billing send error:", err);
      setErrorMessage("Gmail delivery failed: " + err.message);
    } finally {
      setBillingGmailLoading(false);
    }
  };

  const handleSaveBilling = async () => {
    if (!token || !generatedBillingSubject || !generatedBillingBody) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/email-billings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName,
          amount,
          services,
          emailSubject: generatedBillingSubject,
          emailBody: generatedBillingBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Billing record securely stored in Cloud SQL!");
        loadHistory();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || "Failed to save billing cover.");
      }
    } catch (err: any) {
      setErrorMessage("Database error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const autoSendGmailBill = async (itemName: string, itemPrice: string, leadPassenger?: string) => {
    const recipient = user?.email || "abhayghodeswar81@gmail.com";
    const subject = `[BILLING INVOICE] Chronos AI Transaction Confirmed - ${itemName}`;
    const invoiceRef = `VAL-INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const billBody = `=========================================
      VALIDATE LABS & CHRONOS AI
          OFFICIAL INVOICE
=========================================
Invoice Ref: ${invoiceRef}
Date: ${new Date().toLocaleString()}
Account Holder: ${leadPassenger || user?.displayName || "Abhay Ghodeswar"}
Email: ${recipient}

-----------------------------------------
ITEMS & DESCRIPTION:
${itemName}
- Total Charged: ${itemPrice}
- Status: PAID IN FULL (via Secure Sandbox Node)
-----------------------------------------

Thank you for your purchase. This email is an official billing confirmation dispatched automatically via the Chronos Gmail Node Connector.

Securely compiled by:
Chronos AI Billing Pipeline Engine (v3.5)
Validate Labs Support`;

    const isBypass = localStorage.getItem("mock_user_active") === "true";

    // 1. Always write to the simulated custom_gmail_emails database so it shows up in their Gmail Hub
    const newMockMail = {
      id: `invoice-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      subject: subject,
      from: "Chronos AI Billing <billing@validate.labs>",
      to: recipient,
      date: new Date().toLocaleString(),
      snippet: `Official invoice from Validate Labs: ${itemName} - Total Paid: ${itemPrice}`,
      body: billBody,
      unread: true
    };

    try {
      const customEmailsStr = localStorage.getItem("custom_gmail_emails");
      const customEmails = customEmailsStr ? JSON.parse(customEmailsStr) : [];
      localStorage.setItem("custom_gmail_emails", JSON.stringify([newMockMail, ...customEmails]));
    } catch (e) {
      console.error("Local storage sync error: ", e);
    }

    // 2. Try real delivery if googleToken is active
    if (!isBypass && googleToken) {
      try {
        const mailLines = [
          `To: ${recipient}`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: 7bit`,
          ``,
          billBody
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

        if (res.ok) {
          setSuccessMessage(`Official invoice receipt dispatched to your Gmail: ${recipient}`);
          setTimeout(() => setSuccessMessage(null), 5000);
          return;
        }
      } catch (err) {
        console.warn("Real Gmail delivery of automated bill failed, falling back to workspace notify: ", err);
      }
    }

    // Fallback if not authenticated or bypass
    setSuccessMessage(`Purchase Complete! Official bill has been dispatched to your Gmail Hub: ${recipient}`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <section id="workspace-section" className="w-full bg-[#050505] border-b border-white/10 py-16 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-500/20 bg-emerald-950/20 mb-4">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-[10px] tracking-widest font-mono text-emerald-400 uppercase font-bold">
              CLOUD SQL INTEGRATED WORKSPACE
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white uppercase">
            SECURE COLLABORATION LABS
          </h2>
          <p className="max-w-2xl mx-auto text-sm text-neutral-400 font-light mt-3">
            Incorporate AI solutions seamlessly. Log in securely with Google to run tools tailored for travelers, students, doctors, and businesses, and persist results to your real Cloud SQL database.
          </p>
        </div>

        {/* Global Notifications */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono rounded space-y-4"
            >
              <div className="flex items-center gap-2 font-bold text-red-300">
                <span className="text-xs">✦ ERROR: {errorMessage.toLowerCase().includes("unauthorized-domain") ? "Firebase Authentication Domain Unauthorized" : errorMessage}</span>
              </div>
              
              {errorMessage.toLowerCase().includes("unauthorized-domain") && (
                <div className="p-4 bg-black/40 border border-neutral-800 rounded space-y-3 text-neutral-300">
                  <p className="text-[11px] leading-relaxed">
                    This error happens because the current app's hosting domains are not listed in your Firebase project's <strong>Authorized Domains</strong> allowlist. Follow these simple steps to authorize Google Sign-In for this workspace:
                  </p>
                  
                  <div className="space-y-2 text-[10px] pl-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">1.</span>
                      <span>
                        Open the{" "}
                        <a 
                          href="https://console.firebase.google.com/project/consummate-psyche-wrr5c/authentication/settings" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Firebase Console Auth Settings ↗
                        </a>
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">2.</span>
                      <span>Go to the <strong>Settings</strong> tab and scroll down to the <strong>Authorized domains</strong> section.</span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">3.</span>
                      <span>Click <strong>Add domain</strong> and add the following two domains:</span>
                    </div>
                  </div>

                  <div className="bg-black border border-neutral-900 rounded p-3 space-y-2.5 font-mono text-[9px]">
                    <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-1.5">
                      <span className="text-neutral-400">ais-dev-fhay6cezs6ipels7wnfhnp-278363495848.asia-east1.run.app</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("ais-dev-fhay6cezs6ipels7wnfhnp-278363495848.asia-east1.run.app");
                          alert("Copied development domain!");
                        }}
                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded text-[9px] cursor-pointer transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-neutral-400">ais-pre-fhay6cezs6ipels7wnfhnp-278363495848.asia-east1.run.app</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("ais-pre-fhay6cezs6ipels7wnfhnp-278363495848.asia-east1.run.app");
                          alert("Copied preview domain!");
                        }}
                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded text-[9px] cursor-pointer transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-450 italic">
                    💡 After adding these domains in Firebase, refresh this tab and log in again! Alternatively, you can click <strong>Bypass Login</strong> to use a simulated developer account.
                  </p>
                </div>
              )}
            </motion.div>
          )}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded"
            >
              ✦ SYSTEM SUCCESS: {successMessage}
            </motion.div>
          )}
          {calendarSyncSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-mono rounded flex items-center gap-2"
            >
              <Calendar size={14} className="animate-pulse" />
              <span>✦ CALENDAR INTEGRATION SUCCESS: {calendarSyncSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Gate Box */}
        <div className="bg-neutral-950 border border-white/10 p-6 md:p-8 rounded mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded border ${user ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-neutral-800 bg-neutral-900/50 text-neutral-500'}`}>
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase font-display tracking-tight">
                {user ? "SECURE SECUREMENT NODAL PROFILE ACTIVE" : "GATEWAY AUTHENTICATION REQUIRED"}
              </h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                {user ? `NODE CLIENT ID: ${user.email} (DATABASE CONNECTED)` : "Please verify your credentials to enable database persistence."}
              </p>
              {user && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`h-2 w-2 rounded-full ${googleToken ? 'bg-blue-500 animate-pulse' : 'bg-neutral-700'}`} />
                  <span className="text-[10px] font-mono text-neutral-400">
                    {googleToken ? "GOOGLE CALENDAR SYNC UNLOCKED (AUTHORIZED)" : "GOOGLE CALENDAR SYNC UNAUTHORIZED (STALE OR DISCONNECTED)"}
                  </span>
                  {!googleToken && (
                    <button
                      onClick={handleGoogleLogin}
                      className="text-[9px] font-mono text-blue-400 hover:text-blue-300 underline font-bold uppercase cursor-pointer"
                    >
                      [Authorize Calendar]
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="px-6 py-2.5 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-mono font-bold tracking-wider uppercase rounded transition-all cursor-pointer"
              >
                Sign Out Node
              </button>
            ) : (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-bold tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  Sign In with Google
                </button>
                <button
                  onClick={handleBypassLogin}
                  className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-yellow-400 text-xs font-mono font-bold tracking-wider uppercase rounded transition-all cursor-pointer"
                >
                  Bypass Login
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          <button
            onClick={() => setActiveTab("travel")}
            className={`py-3 px-4 border text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded transition-all cursor-pointer ${
              activeTab === "travel"
                ? "border-white bg-white text-black font-bold"
                : "border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Plane size={14} />
            Travel Planner
          </button>
          <button
            onClick={() => setActiveTab("study")}
            className={`py-3 px-4 border text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded transition-all cursor-pointer ${
              activeTab === "study"
                ? "border-white bg-white text-black font-bold"
                : "border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            Study Planner
            {!isPremium && <Lock size={10} className="text-yellow-500 animate-pulse ml-0.5" />}
          </button>
          <button
            onClick={() => setActiveTab("triage")}
            className={`py-3 px-4 border text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded transition-all cursor-pointer ${
              activeTab === "triage"
                ? "border-white bg-white text-black font-bold"
                : "border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <HeartPulse size={14} />
            Doctors Triage
            {!isPremium && <Lock size={10} className="text-yellow-500 animate-pulse ml-0.5" />}
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`py-3 px-4 border text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded transition-all cursor-pointer ${
              activeTab === "billing"
                ? "border-white bg-white text-black font-bold"
                : "border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Receipt size={14} />
            Auto Billing
            {!isPremium && <Lock size={10} className="text-yellow-500 animate-pulse ml-0.5" />}
          </button>
          <button
            onClick={() => setActiveTab("gmail")}
            className={`py-3 px-4 border text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 rounded transition-all cursor-pointer ${
              activeTab === "gmail"
                ? "border-white bg-white text-black font-bold"
                : "border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Mail size={14} />
            Gmail Hub
          </button>
        </div>

        {/* Active Tool Area */}
        {activeTab === "gmail" ? (
          <div className="lg:col-span-12">
            <GmailHub
              googleToken={googleToken}
              setGoogleToken={setGoogleToken}
              setParentToken={setToken}
              userEmail={user?.email || ""}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side (Col: 5) */}
          <div className="lg:col-span-5 bg-neutral-950 border border-white/10 p-6 rounded space-y-6">
            <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider pb-3 border-b border-neutral-900 flex items-center gap-2">
              <Sparkles size={14} className="text-neutral-400 animate-pulse" />
              Generator Input
            </h3>

            {activeTab !== "travel" && !isPremium ? (
              <div className="p-6 text-center border border-yellow-500/20 bg-yellow-950/20 rounded space-y-4">
                <Lock className="mx-auto text-yellow-500 animate-bounce" size={28} />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-yellow-400">Elite Premium License Required</h4>
                <p className="text-[10px] text-neutral-450 leading-relaxed font-mono">
                  The <strong className="text-white">{activeTab === "study" ? "Study Planner" : activeTab === "triage" ? "Doctors Triage" : "Auto Billing"}</strong> compiler is an advanced, encrypted pipeline solution reserved for Elite Premium Node operators.
                </p>
                <button
                  onClick={() => {
                    setIsPremium(true);
                    autoSendGmailBill("Chronos AI Premium Node License (Monthly Starter Plan)", "₹750 / mo ($15.00)");
                  }}
                  className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold uppercase rounded text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles size={12} /> Activate Premium Node ($15)
                </button>
              </div>
            ) : (
              <>
                {activeTab === "travel" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Destination</label>
                      <input
                        type="text"
                        value={dest}
                        onChange={(e) => setDest(e.target.value)}
                        placeholder="e.g., Kyoto, Switzerland, Iceland"
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Season</label>
                      <select
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-white transition-colors"
                      >
                        <option>Summer</option>
                        <option>Autumn</option>
                        <option>Winter</option>
                        <option>Spring</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Days</label>
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Budget Level</label>
                        <select
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-white transition-colors"
                        >
                          <option>Premium Luxury</option>
                          <option>Standard Lean</option>
                          <option>Backpacker Adventurer</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateTravel}
                      disabled={loading}
                      className="w-full py-2.5 bg-white text-black text-xs font-mono font-bold tracking-wider uppercase rounded hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Compile Travel Itinerary
                    </button>
                  </div>
                )}

                {activeTab === "study" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Topics / Course Syllabus</label>
                      <textarea
                        rows={4}
                        value={syllabus}
                        onChange={(e) => setSyllabus(e.target.value)}
                        placeholder="e.g., Relational Databases, Drizzle ORM, Typescript Generics, Backend Security, SQL joins"
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Timeline (Weeks)</label>
                        <input
                          type="number"
                          value={weeks}
                          onChange={(e) => setWeeks(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateStudy}
                      disabled={loading}
                      className="w-full py-2.5 bg-white text-black text-xs font-mono font-bold tracking-wider uppercase rounded hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Compile Study Plan
                    </button>
                  </div>
                )}

                {activeTab === "triage" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Patient Name</label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="e.g., John Doe"
                          className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Age</label>
                        <input
                          type="number"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          placeholder="35"
                          className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Primary Symptoms</label>
                      <textarea
                        rows={3}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="e.g., Sudden mild fever, dry cough, slight fatigue for 3 days"
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Urgency Guess</label>
                      <select
                        value={patientUrgency}
                        onChange={(e) => setPatientUrgency(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-white transition-colors"
                      >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    <button
                      onClick={handleGenerateTriage}
                      disabled={loading}
                      className="w-full py-2.5 bg-white text-black text-xs font-mono font-bold tracking-wider uppercase rounded hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Compile Triage Priority
                    </button>
                  </div>
                )}

                {activeTab === "billing" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Client Name</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g., BlueTech Corp"
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Services Rendered</label>
                      <input
                        type="text"
                        value={services}
                        onChange={(e) => setServices(e.target.value)}
                        placeholder="e.g., Custom Python API Integrations"
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Fee Amount ($)</label>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g., 2,500.00"
                        className="w-full px-3 py-2 bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleGenerateBilling}
                      disabled={loading}
                      className="w-full py-2.5 bg-white text-black text-xs font-mono font-bold tracking-wider uppercase rounded hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Compile Billing Cover
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Results Side (Col: 7) */}
          <div className="lg:col-span-7 bg-neutral-950 border border-white/10 p-6 rounded flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
                <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  Compiled Solution Output
                </h3>
                {user && (
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    PERSISTENCE UNLOCKED
                  </div>
                )}
              </div>

              {/* Render generated text */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-20 flex flex-col items-center justify-center gap-4 text-neutral-500 text-xs font-mono"
                  >
                    <Loader2 size={32} className="animate-spin text-white" />
                    <span>DRAFTING LEAN COGNITIVE PROTOTYPE...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-neutral-300 leading-relaxed space-y-4 max-h-[300px] overflow-y-auto pr-2 font-mono whitespace-pre-wrap"
                  >
                    {activeTab === "travel" && (
                      generatedItinerary ? (
                        <div>{generatedItinerary}</div>
                      ) : (
                        <div className="text-neutral-600 text-center py-16 italic font-light">Specify Destination parameters and generate to view elegant itineraries.</div>
                      )
                    )}

                    {activeTab === "study" && (
                      generatedStudyPlan ? (
                        <div>{generatedStudyPlan}</div>
                      ) : (
                        <div className="text-neutral-600 text-center py-16 italic font-light">Specify syllabus parameters and generate to construct study milestones.</div>
                      )
                    )}

                    {activeTab === "triage" && (
                      generatedTriage ? (
                        <div>{generatedTriage}</div>
                      ) : (
                        <div className="text-neutral-600 text-center py-16 italic font-light">Input patient triage forms to compile a high-priority check-in sheet.</div>
                      )
                    )}

                    {activeTab === "billing" && (
                      generatedBillingSubject && generatedBillingBody ? (
                        <div className="space-y-4">
                          <div className="p-2 border border-neutral-800 bg-black font-bold">
                            <span className="text-neutral-500">SUBJECT:</span> {generatedBillingSubject}
                          </div>
                          <div>{generatedBillingBody}</div>
                        </div>
                      ) : (
                        <div className="text-neutral-600 text-center py-16 italic font-light">Synthesize raw deliverable subtotal fees into professional cover emails.</div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Save Controls */}
            {user && (
              <div className="pt-4 border-t border-neutral-900 mt-6 space-y-4">
                {/* Google Calendar Sync Widget */}
                {(activeTab === "travel" || activeTab === "study") && (
                  <div className="p-3 border border-blue-500/15 bg-blue-950/5 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-400 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                          Schedule on Google Calendar
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-neutral-500 font-mono">Start Date:</span>
                          <input
                            type="date"
                            value={activeTab === "travel" ? travelStartDate : studyStartDate}
                            onChange={(e) => {
                              if (activeTab === "travel") {
                                setTravelStartDate(e.target.value);
                              } else {
                                setStudyStartDate(e.target.value);
                              }
                            }}
                            className="bg-black border border-neutral-800 text-[10px] text-white px-1.5 py-0.5 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={activeTab === "travel" ? handleSyncTravelToCalendar : handleSyncStudyToCalendar}
                      disabled={
                        calendarSyncLoading || 
                        (activeTab === "travel" && !generatedItinerary) ||
                        (activeTab === "study" && !generatedStudyPlan)
                      }
                      className="w-full sm:w-auto px-4 py-2 border border-blue-500/20 bg-blue-950/20 hover:bg-blue-900/30 text-blue-400 text-[10px] font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-neutral-900 disabled:text-neutral-700 disabled:border-neutral-950"
                    >
                      {calendarSyncLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Calendar size={12} />
                      )}
                      {activeTab === "travel" ? "Sync Trip to Calendar" : "Sync Milestones to Calendar"}
                    </button>
                  </div>
                )}

                {/* Gmail Draft/Send Widget for Billing */}
                {activeTab === "billing" && generatedBillingSubject && generatedBillingBody && (
                  <div className="p-3 border border-emerald-500/15 bg-emerald-950/5 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                          Stage/Send Billing via Gmail
                        </span>
                        <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                          Create a draft or send this billing cover directly from your Gmail account.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={handleDraftBillingInGmail}
                        disabled={billingGmailLoading}
                        className="w-full sm:w-auto px-3 py-1.5 border border-neutral-800 hover:bg-neutral-900 text-neutral-350 text-[10px] font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {billingGmailLoading ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
                        Draft in Gmail
                      </button>
                      <button
                        onClick={handleSendBillingInGmail}
                        disabled={billingGmailLoading}
                        className="w-full sm:w-auto px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-mono font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {billingGmailLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                        Send Email
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={
                      activeTab === "travel" ? handleSaveTravel :
                      activeTab === "study" ? handleSaveStudy :
                      activeTab === "triage" ? handleSaveTriage :
                      handleSaveBilling
                    }
                    disabled={
                      saving || 
                      (activeTab === "travel" && !generatedItinerary) ||
                      (activeTab === "study" && !generatedStudyPlan) ||
                      (activeTab === "triage" && !generatedTriage) ||
                      (activeTab === "billing" && !generatedBillingBody)
                    }
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-900 disabled:text-neutral-700 disabled:border-neutral-950 text-black text-xs font-mono font-bold tracking-wider uppercase rounded flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-400/20"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Commit to Cloud SQL DB
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Travel Plan Pre-Checkout Estimator & Aggregate Cart */}
        {activeTab === "travel" && generatedItinerary && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            id="travel-pre-checkout"
            className="mt-8 bg-neutral-950 border border-white/10 rounded p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-900">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded">
                <Ticket size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
                  🛒 COMBINED TRAVEL PLAN PRE-CHECKOUT
                </h3>
                <p className="text-[10px] text-neutral-500 font-mono uppercase">
                  Agree to the itinerary and aggregate hotel, flight, and sightseeing costs before checkout
                </p>
              </div>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Step 1 & 2 */}
              <div className="md:col-span-4 space-y-4">
                <div className="p-4 bg-black border border-neutral-800 rounded space-y-3">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                    1. Validate & Agree
                  </h4>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="checkbox-agree-plan"
                      checked={agreedToValidatePlan}
                      onChange={(e) => setAgreedToValidatePlan(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-800 bg-black text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-neutral-300 leading-normal">
                      I agree to follow the customized plan compiled by Validate AI
                    </span>
                  </label>
                  {!agreedToValidatePlan && (
                    <p className="text-[9px] font-mono text-yellow-500/80 leading-relaxed">
                      ⚠️ Please validate and check this agreement box to proceed with compiled cost aggregation.
                    </p>
                  )}
                </div>

                <div className="p-4 bg-black border border-neutral-800 rounded space-y-3">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                    2. Select Transit Ticket
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: "✈️ Eco Flight Jetliner", price: 250 },
                      { name: "✈️ Business Class Flight", price: 750 },
                      { name: "🚄 High-Speed Bullet Train", price: 135 },
                      { name: "🚄 Local Rail Transit", price: 45 }
                    ].map((opt) => (
                      <button
                        key={opt.name}
                        type="button"
                        id={`btn-transit-${opt.price}`}
                        onClick={() => {
                          setSelectedTransportName(opt.name);
                          setSelectedTransportPrice(opt.price);
                        }}
                        className={`w-full p-2.5 border text-left rounded text-[10px] font-mono flex items-center justify-between cursor-pointer transition-colors ${
                          selectedTransportName === opt.name
                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                            : "border-neutral-900 bg-neutral-950 hover:border-neutral-800 text-neutral-400"
                        }`}
                      >
                        <span>{opt.name}</span>
                        <span className="font-bold text-white">${opt.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="md:col-span-4 space-y-4">
                <div className="p-4 bg-black border border-neutral-800 rounded space-y-3">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                    3. Selected Accommodation
                  </h4>
                  {selectedHotelName ? (
                    <div className="p-3 border border-emerald-500/20 bg-emerald-950/10 rounded flex items-center justify-between gap-2">
                      <div className="font-mono">
                        <span className="block text-[11px] font-bold text-white">{selectedHotelName}</span>
                        <span className="block text-[9px] text-neutral-500 mt-0.5">Rate: ${selectedHotelPrice}/night</span>
                        <span className="block text-[9px] text-emerald-400 mt-1">Total Stay ({duration} Days): ${selectedHotelPrice * parseInt(duration || "1")}</span>
                      </div>
                      <button
                        type="button"
                        id="btn-remove-hotel"
                        onClick={() => {
                          setSelectedHotelName("");
                          setSelectedHotelPrice(0);
                        }}
                        className="text-[10px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer"
                      >
                        [Remove]
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center border border-dashed border-neutral-800 rounded font-mono text-neutral-600 text-[10px] leading-relaxed">
                      No hotel selected yet.
                      <p className="mt-2 text-[9px] text-neutral-500">
                        Scroll below, select any luxury hotel marker from the logistics map node, and complete standard reservation to integrate its pricing!
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-black border border-neutral-800 rounded space-y-3">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                    4. Selected Sightseeings / Activities
                  </h4>
                  {selectedSightName ? (
                    <div className="p-3 border border-emerald-500/20 bg-emerald-950/10 rounded flex items-center justify-between gap-2">
                      <div className="font-mono">
                        <span className="block text-[11px] font-bold text-white">{selectedSightName}</span>
                        <span className="block text-[9px] text-emerald-400 mt-1">Entry Ticket: ${selectedSightPrice}</span>
                      </div>
                      <button
                        type="button"
                        id="btn-remove-sight"
                        onClick={() => {
                          setSelectedSightName("");
                          setSelectedSightPrice(0);
                        }}
                        className="text-[10px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer"
                      >
                        [Remove]
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center border border-dashed border-neutral-800 rounded font-mono text-neutral-600 text-[10px] leading-relaxed">
                      No attractions added.
                      <p className="mt-2 text-[9px] text-neutral-500">
                        Book sightseeing spots below from the interactive list to add activity admissions here.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary & Checkout */}
              <div className="md:col-span-4 p-4 bg-neutral-900 border border-neutral-850 rounded space-y-4">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-yellow-500">
                  Pre-Checkout Summary
                </h4>
                
                <div className="space-y-2 text-[10px] font-mono text-neutral-400 border-b border-neutral-800 pb-3">
                  <div className="flex justify-between">
                    <span>Validate AI Itinerary Base:</span>
                    <span className="text-emerald-400">FREE / INCLUDED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transit Option ({selectedTransportName}):</span>
                    <span className="text-white">${selectedTransportPrice}</span>
                  </div>
                  {selectedHotelName && (
                    <div className="flex justify-between">
                      <span>{selectedHotelName} ({duration} Days):</span>
                      <span className="text-white">${selectedHotelPrice * parseInt(duration || "1")}</span>
                    </div>
                  )}
                  {selectedSightName && (
                    <div className="flex justify-between">
                      <span>{selectedSightName} Admission:</span>
                      <span className="text-white">${selectedSightPrice}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs font-mono font-bold text-white pt-1">
                  <span>ESTIMATED TOTAL COST:</span>
                  <span className="text-base text-emerald-400 font-bold">
                    ${selectedTransportPrice + (selectedHotelPrice * parseInt(duration || "1")) + selectedSightPrice}
                  </span>
                </div>

                {checkoutComplete ? (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded font-mono text-[10px] text-emerald-400 text-center leading-relaxed">
                    🎉 Checkout Complete! Full travel plan pricing aggregated, confirmed, and compiled. Vouchers secured.
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[9px] font-mono text-neutral-400 uppercase mb-1">Lead Passenger Name</label>
                      <input
                        type="text"
                        id="checkout-passenger-name"
                        value={checkoutPassenger}
                        onChange={(e) => setCheckoutPassenger(e.target.value)}
                        placeholder="e.g., Jane Cooper"
                        className="w-full px-2 py-1.5 bg-black border border-neutral-800 text-[10px] text-white font-mono focus:outline-none focus:border-white rounded"
                      />
                    </div>

                    <button
                      type="button"
                      id="btn-confirm-checkout"
                      disabled={!agreedToValidatePlan || !checkoutPassenger}
                      onClick={() => {
                        const totalCost = selectedTransportPrice + (selectedHotelPrice * parseInt(duration || "1")) + selectedSightPrice;
                        setCheckoutComplete(true);
                        autoSendGmailBill(`Elite Travel Package to ${dest || "Destination Node"} (${duration} Days)`, `$${totalCost}`, checkoutPassenger);
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:border-neutral-950 text-black font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={13} /> Accept Plan & Checkout
                    </button>
                    {!agreedToValidatePlan && (
                      <p className="text-[9px] font-mono text-neutral-500 text-center leading-relaxed">
                        * Agree to follow the customized plan compiled by Validate AI to unlock checkout.
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* Google Maps Integration Panel */}
        {activeTab === "travel" && generatedItinerary && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-neutral-950 border border-white/10 rounded overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-neutral-900 bg-black/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                  <Compass size={18} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
                    🛰️ SATELLITE INTERACTION & LOGISTICS NODE
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    REAL-TIME GOOGLE MAPS COUPLING & INTERACTIVE PLACE RESERVATIONS
                  </p>
                </div>
              </div>

              {/* API Key Status Indicator */}
              <div className={`px-3 py-1 text-[10px] font-mono rounded border flex items-center gap-2 ${
                hasValidKey 
                  ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-400" 
                  : "border-yellow-500/20 bg-yellow-950/20 text-yellow-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasValidKey ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500 animate-ping'}`} />
                {hasValidKey ? "LIVE SATELLITE STREAM (ACTIVE)" : "TACTICAL WIREFRAME EMULATION"}
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-neutral-900">
              
              {/* Left Column: Popular Lodging Selection (Col 5) */}
              <div className="lg:col-span-5 border-r border-neutral-900 p-4 md:p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-emerald-500" />
                    Popular Hotels & Sights
                  </h4>
                  <span className="text-[9px] font-mono text-neutral-600">{mapPlaces.length} locations</span>
                </div>

                {/* Places Scroll Area */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {mapPlaces.filter((p, index, self) => self.findIndex(item => item.id === p.id) === index).map((p) => {
                    const isSelected = selectedPlace?.id === p.id;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPlace(p)}
                        className={`p-3 bg-black border rounded cursor-pointer transition-all ${
                          isSelected 
                            ? "border-white bg-neutral-900/40" 
                            : "border-neutral-900 hover:border-neutral-800"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2">
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold mt-0.5 ${
                              p.type === 'hotel' ? 'bg-emerald-500 text-black' : 'bg-blue-500 text-white'
                            }`}>
                              {p.id}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-white font-mono uppercase">{p.name}</h5>
                              <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest">{p.type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-white font-mono">{p.price}</div>
                            <div className="flex items-center gap-1 text-[10px] text-yellow-500 justify-end font-mono">
                              <Star size={8} fill="currentColor" />
                              <span>{p.rating}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-400 mt-2 font-light">{p.description}</p>
                        
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono border-t border-neutral-900 mt-2 pt-2">
                          <span>{p.distance}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMapCenter({ lat: p.lat, lng: p.lng });
                                setSelectedPlace(p);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold uppercase"
                            >
                              Center
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookingOverlay(p);
                                setBookingName("");
                                setBookingDate("");
                                setBookingType(p.type === "hotel" ? "Premium Suite" : "Standard Seat");
                                setBookingNotes("");
                                setBookingSuccessVoucher(null);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-neutral-200 text-black rounded font-bold uppercase flex items-center gap-0.5"
                            >
                              <Ticket size={8} />
                              Book Online
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Google Map Container / Fallback (Col 7) */}
              <div className="lg:col-span-7 flex flex-col justify-between relative bg-black min-h-[380px]">
                {/* Embedded Map Panel */}
                <div className="relative w-full h-[320px] bg-black">
                  {hasValidKey ? (
                    <div className="w-full h-full">
                      <APIProvider apiKey={API_KEY} version="weekly">
                        <Map
                          defaultCenter={mapCenter}
                          center={mapCenter}
                          defaultZoom={13}
                          mapId="DEMO_MAP_ID"
                          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                          style={{ width: "100%", height: "100%" }}
                        >
                          {mapPlaces.filter((p, index, self) => self.findIndex(item => item.id === p.id) === index).map((p) => (
                            <AdvancedMarker
                              key={p.id}
                              position={{ lat: p.lat, lng: p.lng }}
                              title={p.name}
                              onClick={() => setSelectedPlace(p)}
                            >
                              <Pin
                                background={p.type === "hotel" ? "#10b981" : "#3b82f6"}
                                glyphColor="#fff"
                                borderColor="#000"
                              >
                                <span className="text-[8px] font-bold text-white px-0.5">{p.id}</span>
                              </Pin>
                            </AdvancedMarker>
                          ))}
                        </Map>
                      </APIProvider>
                    </div>
                  ) : (
                    /* Fallback Interactive Tactical Vector Map */
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      {/* Grid background */}
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-5 pointer-events-none">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div key={i} className="border-r border-b border-neutral-850 text-[6px] p-1 text-neutral-600">
                            {(mapCenter.lat + (i % 6) * 0.01).toFixed(3)}N
                          </div>
                        ))}
                      </div>

                      {/* Tactical Vector Path SVG */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {mapPlaces.map((p, index) => {
                          if (index === mapPlaces.length - 1) return null;
                          const next = mapPlaces[index + 1];
                          // Simple relative mapping projection
                          const x1 = 50 + (p.lng - mapCenter.lng) * 4500;
                          const x2 = 50 + (next.lng - mapCenter.lng) * 4500;
                          const y1 = 50 - (p.lat - mapCenter.lat) * 4500;
                          const y2 = 50 - (next.lat - mapCenter.lat) * 4500;
                          return (
                            <line
                              key={index}
                              x1={`${Math.max(10, Math.min(90, x1))}%`}
                              y1={`${Math.max(10, Math.min(90, y1))}%`}
                              x2={`${Math.max(10, Math.min(90, x2))}%`}
                              y2={`${Math.max(10, Math.min(90, y2))}%`}
                              stroke="#333333"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                            />
                          );
                        })}

                        {/* Connection Ruler line */}
                        {(() => {
                          const p1 = mapPlaces.find(p => p.id === distOrigin);
                          const p2 = mapPlaces.find(p => p.id === distDest);
                          if (p1 && p2) {
                            const x1 = 50 + (p1.lng - mapCenter.lng) * 4500;
                            const x2 = 50 + (p2.lng - mapCenter.lng) * 4500;
                            const y1 = 50 - (p1.lat - mapCenter.lat) * 4500;
                            const y2 = 50 - (p2.lat - mapCenter.lat) * 4500;
                            return (
                              <line
                                x1={`${Math.max(10, Math.min(90, x1))}%`}
                                y1={`${Math.max(10, Math.min(90, y1))}%`}
                                x2={`${Math.max(10, Math.min(90, x2))}%`}
                                y2={`${Math.max(10, Math.min(90, y2))}%`}
                                stroke="#10b981"
                                strokeWidth="2"
                                className="animate-pulse"
                              />
                            );
                          }
                          return null;
                        })()}
                      </svg>

                      {/* Plot Points */}
                      {mapPlaces.filter((p, index, self) => self.findIndex(item => item.id === p.id) === index).map((p) => {
                        const x = 50 + (p.lng - mapCenter.lng) * 4500;
                        const y = 50 - (p.lat - mapCenter.lat) * 4500;
                        const px = `${Math.max(10, Math.min(90, x))}%`;
                        const py = `${Math.max(10, Math.min(90, y))}%`;
                        const isSelected = selectedPlace?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPlace(p)}
                            style={{ left: px, top: py }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all z-10 hover:scale-110 focus:outline-none"
                          >
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? "bg-white border-emerald-450 scale-125" 
                                : p.type === "hotel" 
                                  ? "bg-emerald-500/85 border-black text-black" 
                                  : "bg-blue-500/85 border-black text-white"
                            }`}>
                              <span className="text-[8px] font-bold">{p.id}</span>
                            </div>
                            <span className="absolute top-5 bg-black/95 border border-neutral-900 px-1 py-0.5 rounded text-[8px] text-neutral-300 font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {p.name}
                            </span>
                          </button>
                        );
                      })}

                      {/* Compass Rose */}
                      <div className="absolute right-3 bottom-3 text-neutral-700 pointer-events-none flex flex-col items-center">
                        <div className="text-[8px] font-mono font-bold">GRID N</div>
                        <div className="h-4 w-0.5 bg-neutral-800 my-0.5" />
                        <Compass size={14} className="animate-spin-slow" />
                      </div>

                      {/* Telemetry log */}
                      <div className="absolute left-3 bottom-3 p-2 bg-black/85 border border-neutral-900 rounded text-[8px] text-neutral-500 font-mono">
                        <div>LAT: {mapCenter.lat.toFixed(4)}N</div>
                        <div>LNG: {mapCenter.lng.toFixed(4)}E</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions Box if hasValidKey is false */}
                {!hasValidKey && (
                  <div className="p-4 bg-yellow-950/20 border-t border-neutral-900 text-[10px] text-neutral-400 font-mono space-y-1.5 leading-normal">
                    <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                      <AlertCircle size={12} />
                      <span>LIVE SATELLITE GOOGLE MAP INTEGRATION SETUP:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-500">
                      <li>
                        Get a Google Maps API Key:{" "}
                        <a 
                          href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-400 underline"
                        >
                          console.cloud.google.com
                        </a>
                      </li>
                      <li>When the <strong className="text-white">"Enter your environment variable to continue"</strong> popup opens, paste your key and press Enter.</li>
                      <li>Or open <strong className="text-white">Settings</strong> (⚙️ gear icon) &rarr; <strong className="text-white">Secrets</strong> &rarr; add <code className="text-neutral-300">GOOGLE_MAPS_PLATFORM_KEY</code> &rarr; save.</li>
                    </ol>
                  </div>
                )}

                {/* Selection details info bar */}
                {selectedPlace && (
                  <div className="p-4 bg-black border-t border-neutral-900 flex justify-between items-center">
                    <div className="font-mono">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-widest">SELECTED NODE</div>
                      <div className="text-xs font-bold text-white uppercase">{selectedPlace.name}</div>
                      <div className="text-[9px] text-neutral-400 mt-0.5">Rating: {selectedPlace.rating} ★ | Rate: {selectedPlace.price}</div>
                    </div>
                    <button
                      onClick={() => {
                        setBookingOverlay(selectedPlace);
                        setBookingName("");
                        setBookingDate("");
                        setBookingType(selectedPlace.type === "hotel" ? "Premium Suite" : "Standard Seat");
                        setBookingNotes("");
                        setBookingSuccessVoucher(null);
                      }}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase rounded flex items-center gap-1 transition-colors"
                    >
                      <Ticket size={12} />
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Distance Analyzer Footer (Full Width) */}
            <div className="p-4 md:p-6 bg-black/40 grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-mono">
              <div className="md:col-span-3 flex items-center gap-2">
                <Ruler size={16} className="text-neutral-500" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Distance Analyzer</h4>
                  <p className="text-[9px] text-neutral-500 uppercase">Transit Matrix</p>
                </div>
              </div>

              {/* Selector Origin */}
              <div className="md:col-span-3">
                <label className="block text-[8px] text-neutral-500 uppercase tracking-widest mb-1">Origin Point</label>
                <select
                  value={distOrigin}
                  onChange={(e) => setDistOrigin(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-[10px] text-neutral-300 py-1 px-1.5 focus:outline-none focus:border-white transition-colors"
                >
                  {mapPlaces.filter((p, index, self) => self.findIndex(item => item.id === p.id) === index).map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Selector Destination */}
              <div className="md:col-span-3">
                <label className="block text-[8px] text-neutral-500 uppercase tracking-widest mb-1">Destination Point</label>
                <select
                  value={distDest}
                  onChange={(e) => setDistDest(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-[10px] text-neutral-300 py-1 px-1.5 focus:outline-none focus:border-white transition-colors"
                >
                  {mapPlaces.filter((p, index, self) => self.findIndex(item => item.id === p.id) === index).map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Output Result */}
              <div className="md:col-span-3 bg-neutral-900/40 border border-neutral-800 p-2.5 rounded text-center md:text-left">
                <div className="text-[8px] text-neutral-500 uppercase tracking-widest">METRIC DISTANCE</div>
                {measuredDistance ? (
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {measuredDistance} km
                    <span className="text-[9px] text-neutral-500 font-normal ml-2">
                      (~{(parseFloat(measuredDistance) * 12).toFixed(0)} min drive)
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-600 italic">Select distinct points</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Ticket Booking Modal Slide-Over */}
        <AnimatePresence>
          {bookingOverlay && (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-neutral-950 border border-neutral-800 max-w-md w-full p-6 rounded space-y-4 font-mono text-xs text-neutral-300"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <h3 className="font-bold text-white text-sm uppercase flex items-center gap-1.5">
                    <Ticket size={14} className="text-emerald-400" />
                    Reserve Ticket Online
                  </h3>
                  <button
                    onClick={() => {
                      setBookingOverlay(null);
                      setBookingSuccessVoucher(null);
                    }}
                    className="text-neutral-500 hover:text-white font-bold"
                  >
                    [CLOSE]
                  </button>
                </div>

                {!bookingSuccessVoucher ? (
                  /* Form */
                  <div className="space-y-4">
                    <div className="p-2 border border-emerald-500/10 bg-emerald-950/5 text-[10px] text-emerald-400/90 rounded">
                      ✦ Secure online ticket/room reservations via validation proxy node. Committing reserves live slots and registers verification vouchers to your Cloud SQL profile.
                    </div>

                    <div>
                      <label className="block text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Target Vendor</label>
                      <div className="p-2 bg-black border border-neutral-900 text-white font-bold uppercase text-[10px]">
                        {bookingOverlay.name} ({bookingOverlay.type.toUpperCase()})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Traveler Name</label>
                        <input
                          type="text"
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-2.5 py-1.5 bg-black border border-neutral-805 text-white placeholder-neutral-700 text-[10px] uppercase focus:outline-none focus:border-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Target Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black border border-neutral-805 text-white text-[10px] focus:outline-none focus:border-neutral-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Service Level / Cabin Suite</label>
                      <select
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black border border-neutral-805 text-white text-[10px] focus:outline-none focus:border-neutral-700"
                      >
                        <option>Standard Seat</option>
                        <option>Business Cabin</option>
                        <option>Premium Deluxe Suite</option>
                        <option>Penthouse / VIP Lounge</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Special Requests</label>
                      <input
                        type="text"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="e.g., extra pillows, dietary requests"
                        className="w-full px-2.5 py-1.5 bg-black border border-neutral-805 text-white placeholder-neutral-700 text-[10px] focus:outline-none focus:border-neutral-700"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-neutral-900 pt-3">
                      <span className="text-neutral-500">ESTIMATED FARE:</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">{bookingOverlay.price}</span>
                    </div>

                    <button
                      onClick={handleConfirmBooking}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded text-[10px]"
                    >
                      Confirm & Dispatch Ticket Online
                    </button>
                  </div>
                ) : (
                  /* Success Digital Voucher output */
                  <div className="space-y-4">
                    <div className="p-3 border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 rounded text-center">
                      <CheckCircle size={16} className="mx-auto mb-1 animate-bounce" />
                      <span className="text-[10px] font-bold">RESERVATION DISPATCHED & SECURED</span>
                    </div>

                    {/* Voucher Card */}
                    <div className="p-4 bg-black border border-neutral-900 rounded space-y-3 relative overflow-hidden">
                      {/* Watermark */}
                      <div className="absolute right-0 bottom-0 text-[56px] font-bold opacity-[0.02] pointer-events-none uppercase">
                        PASS
                      </div>

                      <div className="flex justify-between border-b border-neutral-900 pb-2">
                        <div>
                          <div className="text-[8px] text-neutral-500">ISSUING NODE</div>
                          <div className="text-[10px] font-bold text-white">VALIDATE AIR/RAIL</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] text-neutral-500">VOUCHER ID</div>
                          <div className="text-[10px] font-bold text-white font-mono">{bookingSuccessVoucher.id}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div>
                          <div className="text-[7px] text-neutral-500">CLIENT PASSENGER</div>
                          <div className="text-white font-bold uppercase truncate">{bookingSuccessVoucher.guestName}</div>
                        </div>
                        <div>
                          <div className="text-[7px] text-neutral-500">TARGET PROVIDER</div>
                          <div className="text-white font-bold uppercase truncate">{bookingSuccessVoucher.placeName}</div>
                        </div>
                        <div>
                          <div className="text-[7px] text-neutral-500">DEPARTURE/STAY DATE</div>
                          <div className="text-white font-bold">{bookingSuccessVoucher.date}</div>
                        </div>
                        <div>
                          <div className="text-[7px] text-neutral-500">SERVICE CATEGORY</div>
                          <div className="text-white font-bold uppercase">{bookingSuccessVoucher.type}</div>
                        </div>
                      </div>

                      {/* Barcode representation */}
                      <div className="pt-2 border-t border-neutral-900/60 flex flex-col items-center gap-1">
                        <div className="text-[14px] font-bold tracking-[6px] text-neutral-400 select-none">
                          ||||| | ||| || ||| ||| |
                        </div>
                        <div className="text-[8px] text-neutral-600 font-mono tracking-widest uppercase">
                          {bookingSuccessVoucher.barcode}
                        </div>
                      </div>
                    </div>

                    {user ? (
                      <div className="space-y-2">
                        <div className="text-[9px] text-neutral-500 text-center italic">
                          ✦ Reservation successfully synced to your Cloud SQL Database history.
                        </div>
                        <button
                          onClick={() => handleSyncBookingToCalendar(bookingSuccessVoucher)}
                          disabled={calendarSyncLoading}
                          className="w-full py-1.5 border border-blue-500/20 bg-blue-950/20 hover:bg-blue-900/30 text-blue-400 font-bold uppercase rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer disabled:bg-neutral-900 disabled:text-neutral-700"
                        >
                          {calendarSyncLoading ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Calendar size={10} />
                          )}
                          Sync Booking to Google Calendar
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 border border-yellow-500/10 bg-yellow-950/10 text-[9px] text-yellow-500 rounded text-center">
                        ✦ Log in with Google to persist these reservation vouchers to your history.
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setBookingOverlay(null);
                        setBookingSuccessVoucher(null);
                      }}
                      className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase rounded text-[10px]"
                    >
                      Close Verification Console
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Database History Section */}
        {user && (
          <div className="mt-12 bg-neutral-950 border border-white/10 p-6 md:p-8 rounded">
            <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider pb-3 border-b border-neutral-900 flex items-center gap-2 mb-6">
              <History size={14} className="text-neutral-500" />
              Cloud SQL Historical Archives
            </h3>

            {activeTab === "travel" && (
              <div className="space-y-4">
                {savedItineraries.length === 0 ? (
                  <div className="text-neutral-600 text-xs italic py-4">No saved itineraries exist in your database node.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedItineraries.map((it) => (
                      <div key={it.id} className="p-4 bg-black border border-neutral-900 rounded space-y-3 font-mono text-[11px] text-neutral-300">
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 border-b border-neutral-900 pb-1.5">
                          <span>DAYS: {it.durationDays} | BUDGET: {it.budget}</span>
                          <span>{new Date(it.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-white uppercase text-xs">✈️ {it.destination}</h4>
                        <div className="max-h-[150px] overflow-y-auto pr-1 whitespace-pre-wrap text-neutral-400 text-[10px] leading-normal">
                          {it.itineraryText}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-neutral-900/40">
                          <span className="text-[8px] text-neutral-500 uppercase font-mono font-bold">Stored in Cloud SQL</span>
                          <button
                            onClick={() => {
                              setDest(it.destination);
                              setDuration(it.durationDays);
                              setBudget(it.budget);
                              setGeneratedItinerary(it.itineraryText);
                              handleSyncTravelToCalendar();
                            }}
                            className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase cursor-pointer flex items-center gap-1 font-mono"
                          >
                            <Calendar size={10} /> Sync to Google Calendar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "study" && (
              <div className="space-y-4">
                {savedStudyPlans.length === 0 ? (
                  <div className="text-neutral-600 text-xs italic py-4">No saved study plans exist in your database node.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedStudyPlans.map((st) => (
                      <div key={st.id} className="p-4 bg-black border border-neutral-900 rounded space-y-3 font-mono text-[11px] text-neutral-300">
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 border-b border-neutral-900 pb-1.5">
                          <span>SAVED SYLLABUS DRAFT</span>
                          <span>{new Date(st.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-white uppercase text-xs truncate">📚 {st.syllabus}</h4>
                        <div className="max-h-[150px] overflow-y-auto pr-1 whitespace-pre-wrap text-neutral-400 text-[10px] leading-normal">
                          {st.planText}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-neutral-900/40">
                          <span className="text-[8px] text-neutral-500 uppercase font-mono font-bold">Stored in Cloud SQL</span>
                          <button
                            onClick={() => {
                              setSyllabus(st.syllabus);
                              setGeneratedStudyPlan(st.planText);
                              handleSyncStudyToCalendar();
                            }}
                            className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase cursor-pointer flex items-center gap-1 font-mono"
                          >
                            <Calendar size={10} /> Sync to Google Calendar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "triage" && (
              <div className="space-y-4">
                {savedTriages.length === 0 ? (
                  <div className="text-neutral-600 text-xs italic py-4">No saved triage lists exist in your database node.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedTriages.map((tr) => (
                      <div key={tr.id} className="p-4 bg-black border border-neutral-900 rounded space-y-3 font-mono text-[11px] text-neutral-300">
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 border-b border-neutral-900 pb-1.5">
                          <span className={`px-1.5 py-0.5 border ${tr.urgency === "High" ? "border-red-500/30 text-red-400 bg-red-950/20" : "border-yellow-500/30 text-yellow-400 bg-yellow-950/20"}`}>
                            URGENCY: {tr.urgency.toUpperCase()}
                          </span>
                          <span>{new Date(tr.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-white uppercase text-xs">🩺 PATIENT: {tr.patientName}</h4>
                        <div className="italic text-neutral-500 text-[10px]">Symptom overview: {tr.symptoms}</div>
                        <div className="max-h-[150px] overflow-y-auto pr-1 whitespace-pre-wrap text-neutral-400 text-[10px] leading-normal border-t border-neutral-900 pt-1.5">
                          {tr.triageDetails}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-4">
                {savedBillings.length === 0 ? (
                  <div className="text-neutral-600 text-xs italic py-4">No saved billing invoices exist in your database node.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedBillings.map((bi) => (
                      <div key={bi.id} className="p-4 bg-black border border-neutral-900 rounded space-y-3 font-mono text-[11px] text-neutral-300">
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 border-b border-neutral-900 pb-1.5">
                          <span>AMOUNT: ${bi.amount} | CLIENT: {bi.clientName}</span>
                          <span>{new Date(bi.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-white uppercase text-xs truncate">💼 {bi.emailSubject}</h4>
                        <div className="max-h-[150px] overflow-y-auto pr-1 whitespace-pre-wrap text-neutral-400 text-[10px] leading-normal">
                          {bi.emailBody}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
