import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    // IMPORTANT: This relies on process.env.API_KEY being available in the execution environment.
    // Do not hardcode the API key here.
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    } else {
      console.error('API_KEY environment variable not found.');
    }
  }

  async generateCarDescription(carDetails: string): Promise<string> {
    if (!this.genAI) {
      return Promise.reject('Gemini AI client is not initialized. Check API Key.');
    }

    const model = 'gemini-2.5-flash';
    const prompt = `Based on the following car details, write a compelling and professional sales description in English for a car dealership in Saudi Arabia. Highlight key selling points. Details: ${carDetails}`;

    try {
        const response = await this.genAI.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are an expert copywriter for luxury and standard vehicles, creating appealing descriptions for potential buyers.",
                temperature: 0.7,
            },
        });
        return response.text.trim();
    } catch (error) {
      console.error('Error generating description with Gemini:', error);
      return Promise.reject('Failed to generate description. Please try again.');
    }
  }
}
