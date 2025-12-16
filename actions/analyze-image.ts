"use server";

interface PlantAnalysisResult {
  success: boolean;
  data?: {
    plantName?: string;
    plantDescription?: string;
    plantProbability?: number;
    disease: string;
    probability: number;
    treatment?: string;
    symptoms?: string;
    prevention?: string;
    isHealthy: boolean;
  };
  error?: string;
}

export async function analyzePlantImage(
  base64Image: string
): Promise<PlantAnalysisResult> {
  try {
    const apiKey = process.env.PLANT_ID_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Plant.id API key not configured. Please add PLANT_ID_API_KEY to your .env.local file."
      };
    }

    // Ensure the base64 image has the correct format
    const imageData = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    // Call Plant.id v3 Health Assessment endpoint
    const createResponse = await fetch("https://plant.id/api/v3/identification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify({
        images: [imageData],
        health: "all",
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Plant.id API error: ${createResponse.status} - ${errorText}`);
    }

    const initialData = await createResponse.json();
    const accessToken = initialData.access_token;

    // Retrieve detailed results with treatment and classification information
    const detailsResponse = await fetch(
      `https://plant.id/api/v3/identification/${accessToken}?details=common_names,description,treatment&language=en`,
      {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      throw new Error(`Plant.id details error: ${detailsResponse.status} - ${errorText}`);
    }

    const data = await detailsResponse.json();

    // Validate response structure
    if (!data.result) {
      throw new Error("Invalid response from Plant.id API - missing result data");
    }

    // Get plant identification
    const plantSuggestion = data.result?.classification?.suggestions?.[0];
    const plantName = plantSuggestion?.name || "Unknown Plant";
    const plantDescription = plantSuggestion?.details?.description?.value || "";
    const plantProbability = plantSuggestion?.probability || 0;

    // Check if disease suggestions exist
    if (
      !data.result?.disease?.suggestions ||
      data.result.disease.suggestions.length === 0
    ) {
      return {
        success: true,
        data: {
          plantName,
          plantDescription,
          plantProbability,
          disease: "Healthy Plant",
          probability: data.result?.is_healthy?.probability || 1,
          isHealthy: true,
        },
      };
    }

    // Get the top disease suggestion
    const topSuggestion = data.result.disease.suggestions[0];
    const isHealthy =
      topSuggestion.name.toLowerCase().includes("healthy") ||
      topSuggestion.name.toLowerCase().includes("no disease");

    // Extract treatment information
    const treatmentBio = topSuggestion.details?.treatment?.biological || [];
    const treatmentChem = topSuggestion.details?.treatment?.chemical || [];
    const treatmentPrev = topSuggestion.details?.treatment?.prevention || [];
    
    const treatments = [
      ...(treatmentBio.length > 0 ? [`Biological: ${treatmentBio.join(", ")}`] : []),
      ...(treatmentChem.length > 0 ? [`Chemical: ${treatmentChem.join(", ")}`] : []),
    ].join(". ") || "No specific treatment available";

    const prevention = treatmentPrev.join(". ") || "Maintain good plant hygiene and proper growing conditions";

    return {
      success: true,
      data: {
        plantName,
        plantDescription,
        plantProbability,
        disease: topSuggestion.name,
        probability: topSuggestion.probability,
        treatment: treatments,
        symptoms: topSuggestion.details?.description || "No symptoms description available",
        prevention: prevention,
        isHealthy,
      },
    };
  } catch (error) {
    console.error("Plant analysis error:", error);
    
    // Provide specific error messages
    let errorMessage = "Failed to analyze plant";
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = error.message;
      } else if (error.message.includes("fetch")) {
        errorMessage = "Network error: Unable to connect to Plant.id API. Please check your internet connection.";
      } else if (error.message.includes("401")) {
        errorMessage = "Invalid API key. Please check your PLANT_ID_API_KEY in .env.local file.";
      } else if (error.message.includes("429")) {
        errorMessage = "API rate limit exceeded. Please try again in a few minutes.";
      } else if (error.message.includes("500") || error.message.includes("502") || error.message.includes("503")) {
        errorMessage = "Plant.id API is temporarily unavailable. Please try again later.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function analyzeCropHealth(
  base64Image: string
): Promise<PlantAnalysisResult> {
  try {
    const apiKey = process.env.CROP_HEALTH_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Crop.health API key not configured. Please add CROP_HEALTH_API_KEY to your .env.local file."
      };
    }

    const imageData = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    // Call Crop.health endpoint
    const createResponse = await fetch(
      "https://crop.kindwise.com/api/v1/identification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
        },
        body: JSON.stringify({
          images: [imageData],
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(
        `Crop.health API error: ${createResponse.status} - ${errorText}`
      );
    }

    const initialData = await createResponse.json();
    const accessToken = initialData.access_token;

    // Retrieve detailed results with treatment, symptoms, description and crop info
    const detailsResponse = await fetch(
      `https://crop.kindwise.com/api/v1/identification/${accessToken}?details=common_names,treatment,symptoms,description&language=en`,
      {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      throw new Error(
        `Crop.health details error: ${detailsResponse.status} - ${errorText}`
      );
    }

    const data = await detailsResponse.json();

    // Validate response structure
    if (!data.result) {
      throw new Error("Invalid response from Crop.health API - missing result data");
    }

    // Get crop identification
    const cropSuggestion = data.result?.crop?.suggestions?.[0];
    const plantName = cropSuggestion?.name || "Unknown Crop";
    const plantDescription = cropSuggestion?.details?.description || "";
    const plantProbability = cropSuggestion?.probability || 0;

    if (
      !data.result?.disease?.suggestions ||
      data.result.disease.suggestions.length === 0
    ) {
      return {
        success: true,
        data: {
          plantName,
          plantDescription,
          plantProbability,
          disease: "Healthy Crop",
          probability: 1,
          isHealthy: true,
        },
      };
    }

    const topSuggestion = data.result.disease.suggestions[0];
    const isHealthy =
      topSuggestion.name.toLowerCase().includes("healthy") ||
      topSuggestion.name.toLowerCase().includes("no disease");

    // Extract treatment information from Crop.health API
    const treatmentBio = topSuggestion.details?.treatment?.biological || [];
    const treatmentChem = topSuggestion.details?.treatment?.chemical || [];
    const treatmentPrev = topSuggestion.details?.treatment?.prevention || [];
    
    const treatments = [
      ...(treatmentBio.length > 0 ? [`Biological: ${treatmentBio.join(", ")}`] : []),
      ...(treatmentChem.length > 0 ? [`Chemical: ${treatmentChem.join(", ")}`] : []),
    ].join(". ") || "No specific treatment available";

    const prevention = treatmentPrev.join(". ") || "Maintain good crop hygiene and proper growing conditions";
    
    // Get symptoms from the API
    const symptomsArray = topSuggestion.details?.symptoms || [];
    const symptoms = symptomsArray.length > 0 
      ? symptomsArray.join(". ") 
      : topSuggestion.details?.description || "No symptoms description available";

    return {
      success: true,
      data: {
        plantName,
        plantDescription,
        plantProbability,
        disease: topSuggestion.name,
        probability: topSuggestion.probability,
        treatment: treatments,
        symptoms: symptoms,
        prevention: prevention,
        isHealthy,
      },
    };
  } catch (error) {
    console.error("Crop analysis error:", error);
    
    // Provide specific error messages
    let errorMessage = "Failed to analyze crop";
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = error.message;
      } else if (error.message.includes("fetch")) {
        errorMessage = "Network error: Unable to connect to Crop.health API. Please check your internet connection.";
      } else if (error.message.includes("401")) {
        errorMessage = "Invalid API key. Please check your CROP_HEALTH_API_KEY in .env.local file.";
      } else if (error.message.includes("429")) {
        errorMessage = "API rate limit exceeded. Please try again in a few minutes.";
      } else if (error.message.includes("500") || error.message.includes("502") || error.message.includes("503")) {
        errorMessage = "Crop.health API is temporarily unavailable. Please try again later.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
