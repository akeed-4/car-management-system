
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { PriceSuggestion } from '../types/price-suggestion.model';
import { Car } from '../types/car.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    // IMPORTANT: Add your API key here or use Angular environment configuration
    // For now, we'll make it optional to avoid runtime errors
    const apiKey = ''; // Replace with your actual API key or configure via environment
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    } else {
      console.warn('Gemini API key not configured. AI features will be disabled.');
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

  async suggestPrice(carDetails: Partial<Car>): Promise<PriceSuggestion> {
    if (!this.genAI) {
      return Promise.reject('Gemini AI client is not initialized. Check API Key.');
    }

    const model = 'gemini-2.5-flash';
    const prompt = `Based on the following car details, suggest a realistic market price range (low, average, high) in Saudi Arabian Riyals (SAR).
    - Make: ${carDetails.make}
    - Model: ${carDetails.model}
    - Year: ${carDetails.year}
    - Mileage: ${carDetails.mileage} km
    - Condition: (Assume good condition unless otherwise specified)
    
    Provide only the JSON object.`;

    try {
      const response = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: "You are a car valuation expert for the Saudi Arabian market. You provide accurate price ranges in JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              low: { type: Type.NUMBER, description: "The lower-end market price in SAR." },
              average: { type: Type.NUMBER, description: "The average, most likely market price in SAR." },
              high: { type: Type.NUMBER, description: "The higher-end market price for a car in excellent condition in SAR." },
            },
            required: ["low", "average", "high"],
          },
        },
      });

      // The response text will be a JSON string, so we parse it.
      const jsonResponse = JSON.parse(response.text.trim());
      
      // Basic validation
      if (typeof jsonResponse.low !== 'number' || typeof jsonResponse.average !== 'number' || typeof jsonResponse.high !== 'number') {
        throw new Error('Invalid JSON structure received from API.');
      }
      
      return jsonResponse as PriceSuggestion;

    } catch (error) {
      console.error('Error suggesting price with Gemini:', error);
      throw new Error('Failed to get a price suggestion. The model may be unable to price this specific car.');
    }
  }

  async extractVinFromImage(base64ImageData: string): Promise<string> {
    if (!this.genAI) {
      return Promise.reject('Gemini AI client is not initialized. Check API Key.');
    }
    
    // remove data:image/jpeg;base64, prefix
    const pureBase64 = base64ImageData.split(',')[1];

    const imagePart = {
      inlineData: {
        data: pureBase64,
        mimeType: 'image/jpeg',
      },
    };

    const model = 'gemini-2.5-flash';
    const prompt = 'Extract the 17-character alphanumeric Vehicle Identification Number (VIN) from this image. Respond with only the VIN text, with no extra formatting or explanations.';

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          temperature: 0.1, // Be very precise
        },
      });

      const extractedText = response.text.trim().replace(/[^A-HJ-NPR-Z0-9]/g, ''); // Clean up any non-VIN characters
      
      if (extractedText.length !== 17) {
          return Promise.reject(`Failed to extract a valid 17-character VIN. Found: ${extractedText}`);
      }

      return extractedText;
    } catch (error) {
      console.error('Error extracting VIN with Gemini:', error);
      return Promise.reject('Failed to analyze the image. Please try again with a clearer picture.');
    }
  }
}
