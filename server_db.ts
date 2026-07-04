import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

export interface User {
  email: string;
  name: string;
  registeredAt: string;
  verified: boolean;
}

export interface OTP {
  email: string;
  code: string;
  expiresAt: number; // timestamp
}

export interface ChatMessage {
  sender: "user" | "system";
  text: string;
  timestamp: string;
}

export interface ChatHistory {
  email: string;
  messages: ChatMessage[];
}

interface DatabaseSchema {
  users: User[];
  otps: OTP[];
  chats: ChatHistory[];
}

function initializeDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading db.json, resetting database schema:", error);
  }

  const initialData: DatabaseSchema = {
    users: [],
    otps: [],
    chats: [],
  };
  saveDB(initialData);
  return initialData;
}

function saveDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to db.json:", error);
  }
}

// User methods
export function getUsers(): User[] {
  const db = initializeDB();
  return db.users;
}

export function getUser(email: string): User | undefined {
  const db = initializeDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function saveUser(email: string, name: string, verified = false): User {
  const db = initializeDB();
  const lowerEmail = email.toLowerCase();
  const existingUserIndex = db.users.findIndex(u => u.email.toLowerCase() === lowerEmail);

  const newUser: User = {
    email: lowerEmail,
    name: name,
    registeredAt: new Date().toISOString(),
    verified: verified,
  };

  if (existingUserIndex >= 0) {
    db.users[existingUserIndex].name = name;
    db.users[existingUserIndex].verified = verified;
  } else {
    db.users.push(newUser);
  }

  saveDB(db);
  return newUser;
}

export function setVerified(email: string): boolean {
  const db = initializeDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.verified = true;
    saveDB(db);
    return true;
  }
  return false;
}

// OTP methods
export function saveOTP(email: string, code: string): OTP {
  const db = initializeDB();
  const lowerEmail = email.toLowerCase();
  
  // Remove any stale or previous OTPs for this email
  db.otps = db.otps.filter(o => o.email.toLowerCase() !== lowerEmail);

  const newOtp: OTP = {
    email: lowerEmail,
    code: code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
  };

  db.otps.push(newOtp);
  saveDB(db);
  return newOtp;
}

export function verifyOTP(email: string, code: string): boolean {
  const db = initializeDB();
  const lowerEmail = email.toLowerCase();
  const otpIndex = db.otps.findIndex(o => o.email.toLowerCase() === lowerEmail && o.code === code);

  if (otpIndex >= 0) {
    const otpRecord = db.otps[otpIndex];
    if (otpRecord.expiresAt > Date.now()) {
      // Remove verified OTP so it cannot be reused
      db.otps.splice(otpIndex, 1);
      saveDB(db);
      return true;
    }
  }
  return false;
}

// Chat methods
export function getChatHistory(email: string): ChatMessage[] {
  const db = initializeDB();
  const record = db.chats.find(c => c.email.toLowerCase() === email.toLowerCase());
  return record ? record.messages : [];
}

export function addChatMessage(email: string, sender: "user" | "system", text: string): ChatMessage[] {
  const db = initializeDB();
  const lowerEmail = email.toLowerCase();
  let record = db.chats.find(c => c.email.toLowerCase() === lowerEmail);

  const newMessage: ChatMessage = {
    sender,
    text,
    timestamp: new Date().toISOString(),
  };

  if (record) {
    record.messages.push(newMessage);
  } else {
    record = {
      email: lowerEmail,
      messages: [newMessage],
    };
    db.chats.push(record);
  }

  saveDB(db);
  return record.messages;
}
