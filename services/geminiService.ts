import { GoogleGenAI, Type } from "@google/genai";
import { AttractionDetails, GeneratedImage, HistoryEvent } from '../types';

// Helper to create client
const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchAttractionDetails = async (name: string, country: string): Promise<AttractionDetails> => {
  const ai = createClient();
  
  const prompt = `Provide a travel guide summary for ${name} in ${country}. Include a brief engaging description, a list of 3-5 unique things to do there, and the best time of year to visit.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            thingsToDo: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            bestTimeToVisit: { type: Type.STRING }
          },
          required: ["description", "thingsToDo", "bestTimeToVisit"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text) as AttractionDetails;
  } catch (error) {
    console.error("Error fetching details:", error);
    return {
      description: `Explore the wonders of ${name}. Information is currently unavailable, but it is definitely worth a visit!`,
      thingsToDo: ["Sightseeing", "Photography", "Local Cuisine"],
      bestTimeToVisit: "Any time of year"
    };
  }
};

export const fetchLandmarkHistory = async (name: string, country: string): Promise<HistoryEvent[]> => {
  const ai = createClient();
  const prompt = `Generate a historical timeline for ${name} in ${country}. Identify 4 to 5 major historical events, eras, or construction phases associated with this location. 
  For each event, provide the approximate year (or era), a short title, and a 1-sentence description.
  
  Return a JSON array of objects with keys: year, title, description.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["year", "title", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as HistoryEvent[];
  } catch (error) {
    console.error("Error fetching history:", error);
    return [
      { year: "N/A", title: "History Unavailable", description: "Could not load historical data at this time." }
    ];
  }
};

export const generateAttractionImage = async (name: string, country: string): Promise<GeneratedImage | null> => {
  const ai = createClient();
  
  const prompt = `A high quality, photorealistic, cinematic wide shot of ${name} in ${country}. Beautiful lighting, travel photography style.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const generateHistoricalImage = async (name: string, country: string, event: HistoryEvent): Promise<GeneratedImage | null> => {
  const ai = createClient();
  
  const prompt = `A photorealistic historical visualization of ${name} in ${country} during the year/era: ${event.year} (${event.title}). 
  The image should reflect the architecture, environment, and atmosphere of that specific time period. 
  If the landmark wasn't built yet, show the landscape or city as it was. Cinematic, detailed, historical accuracy.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating historical image:", error);
    return null;
  }
};