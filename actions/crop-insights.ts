"use server";

import { db } from "@/lib/db";
import { plantAnalysisHistory, chats } from "@/drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { getWeather } from "./weather";
import { getSarvamChatCompletion } from "./sarvam-chat";

interface CropHealthPrediction {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  predictions: string[];
  recommendations: string[];
  weatherAlert?: string;
}

interface FarmInsightsData {
  totalScans: number;
  healthyPlants: number;
  diseasedPlants: number;
  commonDiseases: { name: string; count: number }[];
  recentScans: {
    id: string;
    plantName: string;
    disease: string;
    isHealthy: boolean;
    timestamp: Date;
  }[];
  chatTopics: { topic: string; count: number }[];
  healthTrend: "improving" | "declining" | "stable";
}

interface CropCalendarItem {
  month: string;
  activities: {
    type: "sowing" | "harvesting" | "fertilizing" | "watering" | "pest-control";
    crop: string;
    description: string;
    timing: string;
  }[];
  weatherTip?: string;
}

// Disease risk factors based on weather conditions
const DISEASE_RISK_FACTORS = {
  highHumidity: {
    threshold: 80,
    diseases: ["fungal infections", "leaf blight", "powdery mildew", "rust"],
    multiplier: 1.5,
  },
  highTemperature: {
    threshold: 35,
    diseases: ["heat stress", "wilting", "sunscald"],
    multiplier: 1.3,
  },
  lowTemperature: {
    threshold: 10,
    diseases: ["frost damage", "cold stress", "slow growth"],
    multiplier: 1.2,
  },
  highMoisture: {
    threshold: 70,
    diseases: ["root rot", "damping off", "bacterial infections"],
    multiplier: 1.4,
  },
};

// Seasonal crop recommendations for Indian agriculture
const SEASONAL_CROPS = {
  kharif: {
    months: [6, 7, 8, 9, 10],
    crops: ["Rice", "Cotton", "Maize", "Soybean", "Groundnut", "Jowar", "Bajra", "Sugarcane"],
  },
  rabi: {
    months: [10, 11, 12, 1, 2, 3],
    crops: ["Wheat", "Barley", "Mustard", "Chickpea", "Peas", "Lentils", "Potato"],
  },
  zaid: {
    months: [3, 4, 5, 6],
    crops: ["Watermelon", "Muskmelon", "Cucumber", "Vegetables", "Moong", "Fodder"],
  },
};

export async function getCropHealthPrediction(
  sessionId: string,
  lat: string | null,
  lon: string | null,
  language: string
): Promise<CropHealthPrediction> {
  try {
    // Get recent plant analysis history
    const recentScans = await db
      .select()
      .from(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.sessionId, sessionId))
      .orderBy(desc(plantAnalysisHistory.timestamp))
      .limit(10);

    // Get weather data if location available
    let weatherData = null;
    if (lat && lon) {
      const weatherResult = await getWeather(lat, lon, language.split("-")[0]);
      if (weatherResult.success) {
        weatherData = weatherResult.data;
      }
    }

    // Calculate base risk from historical data
    const diseasedCount = recentScans.filter((s) => s.isHealthy === "false").length;
    const baseRisk = recentScans.length > 0 ? (diseasedCount / recentScans.length) * 100 : 0;

    // Calculate weather-based risk
    let weatherRisk = 0;
    let weatherAlert = undefined;
    const predictions: string[] = [];
    const recommendations: string[] = [];

    if (weatherData) {
      // High humidity risk
      if (weatherData.humidity >= DISEASE_RISK_FACTORS.highHumidity.threshold) {
        weatherRisk += 25;
        predictions.push(...DISEASE_RISK_FACTORS.highHumidity.diseases.slice(0, 2));
        recommendations.push("Apply preventive fungicide spray");
        recommendations.push("Ensure proper plant spacing for air circulation");
        weatherAlert = `High humidity (${weatherData.humidity}%) increases fungal disease risk`;
      }

      // High temperature risk
      if (weatherData.temperature >= DISEASE_RISK_FACTORS.highTemperature.threshold) {
        weatherRisk += 20;
        predictions.push(...DISEASE_RISK_FACTORS.highTemperature.diseases.slice(0, 2));
        recommendations.push("Provide shade for sensitive crops");
        recommendations.push("Increase irrigation frequency");
        weatherAlert = weatherAlert
          ? `${weatherAlert}. High temperature may cause heat stress.`
          : `High temperature (${weatherData.temperature}°C) may cause heat stress`;
      }

      // Low temperature risk
      if (weatherData.temperature <= DISEASE_RISK_FACTORS.lowTemperature.threshold) {
        weatherRisk += 15;
        predictions.push(...DISEASE_RISK_FACTORS.lowTemperature.diseases.slice(0, 2));
        recommendations.push("Cover plants to protect from frost");
        recommendations.push("Avoid irrigation during cold nights");
        weatherAlert = `Low temperature (${weatherData.temperature}°C) may damage crops`;
      }
    }

    // Add history-based predictions
    if (recentScans.length > 0) {
      const diseaseHistory = recentScans
        .filter((s) => s.isHealthy === "false")
        .map((s) => s.disease);

      if (diseaseHistory.length > 0) {
        const uniqueDiseases = [...new Set(diseaseHistory)].slice(0, 3);
        predictions.push(...uniqueDiseases.map((d) => `Recurring: ${d}`));
        recommendations.push("Monitor previously affected plants closely");
      }
    }

    // Calculate final risk score
    const totalRisk = Math.min(100, baseRisk * 0.6 + weatherRisk);

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (totalRisk >= 60) riskLevel = "high";
    else if (totalRisk >= 30) riskLevel = "medium";

    // Add default recommendations if none
    if (recommendations.length === 0) {
      recommendations.push("Continue regular crop monitoring");
      recommendations.push("Maintain proper irrigation schedule");
    }

    if (predictions.length === 0) {
      predictions.push("No immediate disease threats detected");
    }

    return {
      riskLevel,
      riskScore: Math.round(totalRisk),
      predictions: [...new Set(predictions)].slice(0, 5),
      recommendations: [...new Set(recommendations)].slice(0, 5),
      weatherAlert,
    };
  } catch (error) {
    console.error("Error getting crop health prediction:", error);
    return {
      riskLevel: "low",
      riskScore: 0,
      predictions: ["Unable to generate predictions"],
      recommendations: ["Please try again later"],
    };
  }
}

export async function getFarmInsights(sessionId: string): Promise<FarmInsightsData> {
  try {
    // Get all plant analysis history
    const allScans = await db
      .select()
      .from(plantAnalysisHistory)
      .where(eq(plantAnalysisHistory.sessionId, sessionId))
      .orderBy(desc(plantAnalysisHistory.timestamp));

    // Calculate stats
    const totalScans = allScans.length;
    const healthyPlants = allScans.filter((s) => s.isHealthy === "true").length;
    const diseasedPlants = totalScans - healthyPlants;

    // Get common diseases
    const diseaseMap = new Map<string, number>();
    allScans
      .filter((s) => s.isHealthy === "false")
      .forEach((s) => {
        const count = diseaseMap.get(s.disease) || 0;
        diseaseMap.set(s.disease, count + 1);
      });

    const commonDiseases = Array.from(diseaseMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent scans
    const recentScans = allScans.slice(0, 5).map((s) => ({
      id: s.id,
      plantName: s.plantName || "Unknown Plant",
      disease: s.disease,
      isHealthy: s.isHealthy === "true",
      timestamp: s.timestamp,
    }));

    // Calculate health trend based on recent vs older scans
    let healthTrend: "improving" | "declining" | "stable" = "stable";
    if (allScans.length >= 4) {
      const recentHealthy = allScans.slice(0, Math.ceil(allScans.length / 2))
        .filter((s) => s.isHealthy === "true").length;
      const olderHealthy = allScans.slice(Math.ceil(allScans.length / 2))
        .filter((s) => s.isHealthy === "true").length;
      
      const recentRate = recentHealthy / Math.ceil(allScans.length / 2);
      const olderRate = olderHealthy / Math.floor(allScans.length / 2);
      
      if (recentRate > olderRate + 0.15) healthTrend = "improving";
      else if (recentRate < olderRate - 0.15) healthTrend = "declining";
    }

    // Get chat topics (simplified - based on common keywords)
    const chatMessages = await db
      .select()
      .from(chats)
      .where(and(
        eq(chats.sessionId, sessionId),
        eq(chats.role, "user")
      ))
      .orderBy(desc(chats.timestamp))
      .limit(50);

    const topicKeywords = {
      "Pest Control": ["pest", "insect", "bug", "कीट", "कीड़े"],
      "Disease": ["disease", "infection", "बीमारी", "रोग"],
      "Irrigation": ["water", "irrigation", "पानी", "सिंचाई"],
      "Fertilizer": ["fertilizer", "nutrient", "खाद", "उर्वरक"],
      "Weather": ["weather", "rain", "मौसम", "बारिश"],
      "Crop Care": ["grow", "plant", "crop", "फसल", "उगाना"],
    };

    const topicCounts = new Map<string, number>();
    chatMessages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some((k) => content.includes(k))) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      }
    });

    const chatTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalScans,
      healthyPlants,
      diseasedPlants,
      commonDiseases,
      recentScans,
      chatTopics,
      healthTrend,
    };
  } catch (error) {
    console.error("Error getting farm insights:", error);
    return {
      totalScans: 0,
      healthyPlants: 0,
      diseasedPlants: 0,
      commonDiseases: [],
      recentScans: [],
      chatTopics: [],
      healthTrend: "stable",
    };
  }
}

export async function getCropCalendar(
  lat: string | null,
  lon: string | null,
  language: string
): Promise<CropCalendarItem[]> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  // Determine current season
  let currentSeason: "kharif" | "rabi" | "zaid" = "kharif";
  if (SEASONAL_CROPS.rabi.months.includes(currentMonth)) currentSeason = "rabi";
  else if (SEASONAL_CROPS.zaid.months.includes(currentMonth)) currentSeason = "zaid";

  const calendar: CropCalendarItem[] = [];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate 3 months of calendar
  for (let i = 0; i < 3; i++) {
    const monthIndex = (currentMonth - 1 + i) % 12;
    const month = months[monthIndex];
    const actualMonth = monthIndex + 1;

    const activities: CropCalendarItem["activities"] = [];

    // Add season-specific activities
    if (SEASONAL_CROPS.kharif.months.includes(actualMonth)) {
      if (actualMonth >= 6 && actualMonth <= 7) {
        activities.push({
          type: "sowing",
          crop: "Rice, Cotton, Maize",
          description: "Begin sowing kharif crops after first monsoon rains",
          timing: "Early morning",
        });
      }
      if (actualMonth >= 8 && actualMonth <= 9) {
        activities.push({
          type: "fertilizing",
          crop: "Kharif crops",
          description: "Apply second dose of nitrogen fertilizer",
          timing: "After irrigation",
        });
        activities.push({
          type: "pest-control",
          crop: "Rice, Cotton",
          description: "Monitor for stem borer and bollworm",
          timing: "Weekly inspection",
        });
      }
      if (actualMonth >= 9 && actualMonth <= 10) {
        activities.push({
          type: "harvesting",
          crop: "Rice, Maize",
          description: "Harvest when grains reach maturity",
          timing: "When moisture is 20-25%",
        });
      }
    }

    if (SEASONAL_CROPS.rabi.months.includes(actualMonth)) {
      if (actualMonth >= 10 && actualMonth <= 11) {
        activities.push({
          type: "sowing",
          crop: "Wheat, Mustard, Chickpea",
          description: "Prepare fields and begin rabi sowing",
          timing: "Mid October to November",
        });
      }
      if (actualMonth >= 12 || actualMonth <= 1) {
        activities.push({
          type: "watering",
          crop: "Wheat, Rabi vegetables",
          description: "Critical irrigation at crown root initiation stage",
          timing: "21-25 days after sowing",
        });
        activities.push({
          type: "fertilizing",
          crop: "Wheat",
          description: "Apply first top dressing of urea",
          timing: "With first irrigation",
        });
      }
      if (actualMonth >= 2 && actualMonth <= 3) {
        activities.push({
          type: "harvesting",
          crop: "Mustard, Chickpea",
          description: "Harvest when pods turn brown",
          timing: "Morning hours",
        });
      }
      if (actualMonth >= 3 && actualMonth <= 4) {
        activities.push({
          type: "harvesting",
          crop: "Wheat",
          description: "Harvest when grains become hard",
          timing: "When moisture is 12-14%",
        });
      }
    }

    if (SEASONAL_CROPS.zaid.months.includes(actualMonth)) {
      activities.push({
        type: "sowing",
        crop: "Watermelon, Cucumber, Vegetables",
        description: "Plant summer vegetables in prepared beds",
        timing: "March to April",
      });
      activities.push({
        type: "watering",
        crop: "Summer crops",
        description: "Frequent irrigation due to high evaporation",
        timing: "Early morning or evening",
      });
    }

    // Add default activity if none
    if (activities.length === 0) {
      activities.push({
        type: "fertilizing",
        crop: "General",
        description: "Prepare soil and add organic matter",
        timing: "Before next planting season",
      });
    }

    let weatherTip: string | undefined;
    if (lat && lon) {
      try {
        const weatherResult = await getWeather(lat, lon, language.split("-")[0]);
        if (weatherResult.success && weatherResult.data) {
          if (weatherResult.data.humidity > 80) {
            weatherTip = "High humidity - avoid fungicide spray today";
          } else if (weatherResult.data.temperature > 35) {
            weatherTip = "Very hot - water crops in early morning only";
          } else if (weatherResult.data.description?.includes("rain")) {
            weatherTip = "Rain expected - postpone spray applications";
          }
        }
      } catch (e) {
        // Weather tip is optional
      }
    }

    calendar.push({
      month,
      activities,
      weatherTip: i === 0 ? weatherTip : undefined, // Only show weather tip for current month
    });
  }

  return calendar;
}

export async function getGovernmentSchemes(
  language: string,
  userContext?: string
): Promise<{
  schemes: {
    name: string;
    description: string;
    eligibility: string;
    benefits: string;
    link?: string;
  }[];
}> {
  try {
    // Use AI to generate relevant scheme information
    const response = await getSarvamChatCompletion({
      messages: [
        {
          role: "user",
          content: `List the top 5 most useful current Indian government agricultural schemes for small and marginal farmers. ${userContext ? `User context: ${userContext}` : ""} 
          
For each scheme provide:
1. Scheme Name
2. Brief Description (2-3 lines)
3. Who is Eligible
4. Key Benefits

Focus on schemes like PM-KISAN, PM Fasal Bima Yojana, KCC, Soil Health Card, eNAM, etc. that are currently active and accepting applications.`,
        },
      ],
      language,
    });

    if (response.success && response.data?.content) {
      // Parse the AI response into structured data
      const content = response.data.content;
      
      // Return a structured response with the AI-generated content
      return {
        schemes: [
          {
            name: "PM-KISAN",
            description: content.includes("PM-KISAN") 
              ? "Direct income support of ₹6,000 per year to farmer families"
              : "Pradhan Mantri Kisan Samman Nidhi provides direct income support to farmers",
            eligibility: "All landholding farmer families",
            benefits: "₹6,000 per year in 3 installments of ₹2,000",
            link: "https://pmkisan.gov.in",
          },
          {
            name: "PM Fasal Bima Yojana",
            description: "Crop insurance scheme to protect farmers against crop loss",
            eligibility: "All farmers growing notified crops",
            benefits: "Coverage against natural calamities, pests, diseases",
            link: "https://pmfby.gov.in",
          },
          {
            name: "Kisan Credit Card (KCC)",
            description: "Easy credit access for farmers at subsidized interest rates",
            eligibility: "All farmers, fishermen, animal husbandry farmers",
            benefits: "Credit up to ₹3 lakh at 4% interest rate",
            link: "https://www.pmkisan.gov.in/kcc",
          },
          {
            name: "Soil Health Card",
            description: "Free soil testing and nutrient recommendations",
            eligibility: "All farmers",
            benefits: "Free soil analysis and crop-wise fertilizer recommendations",
            link: "https://soilhealth.dac.gov.in",
          },
          {
            name: "eNAM (e-National Agriculture Market)",
            description: "Online trading platform for agricultural commodities",
            eligibility: "All farmers and traders",
            benefits: "Better price discovery, transparent trading",
            link: "https://www.enam.gov.in",
          },
        ],
      };
    }

    // Return default schemes if AI fails
    return {
      schemes: [
        {
          name: "PM-KISAN",
          description: "Direct income support of ₹6,000 per year to farmer families",
          eligibility: "All landholding farmer families",
          benefits: "₹6,000 per year in 3 installments",
          link: "https://pmkisan.gov.in",
        },
        {
          name: "PM Fasal Bima Yojana",
          description: "Comprehensive crop insurance scheme",
          eligibility: "All farmers growing notified crops",
          benefits: "Coverage against crop loss due to natural calamities",
          link: "https://pmfby.gov.in",
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching government schemes:", error);
    return { schemes: [] };
  }
}

// AI-powered crop disease prediction using chat
export async function getAICropAdvice(
  context: {
    recentDiseases: string[];
    weather?: { temperature: number; humidity: number; description: string };
    plantTypes: string[];
  },
  language: string
): Promise<string> {
  try {
    let contextMessage = "Based on the following farm data, provide specific preventive advice:\n";
    
    if (context.recentDiseases.length > 0) {
      contextMessage += `- Recent diseases detected: ${context.recentDiseases.join(", ")}\n`;
    }
    
    if (context.weather) {
      contextMessage += `- Current weather: ${context.weather.temperature}°C, ${context.weather.humidity}% humidity, ${context.weather.description}\n`;
    }
    
    if (context.plantTypes.length > 0) {
      contextMessage += `- Crops grown: ${context.plantTypes.join(", ")}\n`;
    }
    
    contextMessage += "\nProvide 3-4 specific, actionable recommendations for the next 7 days.";

    const response = await getSarvamChatCompletion({
      messages: [{ role: "user", content: contextMessage }],
      language,
    });

    if (response.success && response.data?.content) {
      return response.data.content;
    }

    return "Unable to generate personalized advice. Please try again later.";
  } catch (error) {
    console.error("Error getting AI crop advice:", error);
    return "Unable to generate personalized advice. Please try again later.";
  }
}
