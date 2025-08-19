// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAOHZHkfiEbmgzaTGceSeYM88M0ptUbb3k"); // Store this in .env file
export const model = genAI.getGenerativeModel({ model: "gemini-pro" });