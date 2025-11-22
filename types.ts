export interface Landmark {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: 'cultural' | 'natural' | 'modern';
  tier: 1 | 2 | 3; // 1: Global Icon, 2: Major City/Region, 3: Specific Attraction
}

export interface AttractionDetails {
  description: string;
  thingsToDo: string[];
  bestTimeToVisit: string;
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export interface HistoryEvent {
  year: string;
  title: string;
  description: string;
}