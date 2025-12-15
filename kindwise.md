Here is a structured Markdown document designed for an AI agent to reference when integrating with Kindwise APIs (Crop.health and Plant.id).

```markdown
# Kindwise API Integration Guide

This document contains the technical specifications for integrating with Kindwise services: **Crop.health** (Crop ID) and **Plant.id v3**.

## Global Authentication
Both APIs use API Key authentication via HTTP Headers.
*   **Header Name:** `Api-Key`
*   **Header Value:** `<YOUR_API_KEY>`

---

# Part 1: Crop.health (Crop ID)

**Base URL:** `https://crop.kindwise.com/api/v1`

## 1. Create Identification
**Endpoint:** `POST /identification`

Identifies crop diseases and pests from images.

### Request Format (JSON)
*   **Content-Type:** `application/json`
*   **Body Parameters:**
    *   `images` (Required, List[String]): List of Base64 encoded image strings.
    *   `latitude` (Optional, Float): Geographic coordinate.
    *   `longitude` (Optional, Float): Geographic coordinate.
    *   `similar_images` (Optional, Boolean): If `true`, returns similar reference images.
    *   `custom_id` (Optional, String/Int): Client-side unique identifier.
    *   `datetime` (Optional, String): ISO format (e.g., `2023-06-22T11:28`).

**Example Payload:**
```json
{
  "images": ["data:image/jpg;base64,....."],
  "latitude": 49.195,
  "longitude": 16.606,
  "similar_images": true
}
```

### Response
Returns an `access_token` and immediate results.
*   **Key Fields:**
    *   `access_token`: ID used to retrieve or delete this record.
    *   `result.crop.suggestions`: List of identified crops.
    *   `result.disease.suggestions`: List of diseases/pests/healthy status.

## 2. Retrieve Identification
**Endpoint:** `GET /identification/{access_token}`

Retrieves the results of an identification. You can request specific details via query parameters.

### Query Parameters
*   `details`: Comma-separated list of details to retrieve (e.g., `treatment,symptoms,wiki_description`).
*   `language`: Language code for details (e.g., `en`, `es`, `de`).

**Available Details:**
*   **Crop:** `gbif_id`, `image`, `images`.
*   **Disease:** `type`, `common_names`, `taxonomy`, `eppo_code`, `wiki_description`, `description` (Kindwise), `treatment` (biological, chemical, prevention), `symptoms`, `severity`, `spreading`.

## 3. Delete Identification
**Endpoint:** `DELETE /identification/{access_token}`

Removes the identification record.

## 4. Send Feedback
**Endpoint:** `POST /identification/{access_token}/feedback`

**Payload:**
```json
{
    "rating": 5,
    "comment": "Accurate detection of blight."
}
```

## 5. Usage Info
**Endpoint:** `GET /usage_info`
Returns credit limits, used credits, and remaining balance for the API key.

---

# Part 2: Plant.id v3

**Base URL:** `https://plant.id/api/v3`

## 1. Create Identification
**Endpoint:** `POST /identification`

Identifies plant species and assesses health.

### Request Format (JSON)
*   **Content-Type:** `application/json`
*   **Body Parameters:**
    *   `images` (Required, List[String]): Base64 strings or public URLs.
    *   `latitude` (Optional, Float).
    *   `longitude` (Optional, Float).
    *   `similar_images` (Optional, Bool).
    *   `health` (Optional, String): 
        *   `all`: Returns classification + health assessment (Costs 2 credits).
        *   `only`: Returns only health assessment.
        *   `auto`: Returns health only if condition detected.
    *   `disease_level` (Optional, String): `all` (default) or `general`.
    *   `classification_level` (Optional, String): `species` (default), `genus`, or `all` (includes cultivars).
    *   `symptoms` (Optional, Bool): If `true`, returns heatmaps/severity scores.

**Example Payload:**
```json
{
  "images": ["data:image/jpg;base64,....."],
  "health": "all",
  "similar_images": true
}
```

### Response Key Structures
*   `access_token`: Unique ID.
*   `result.is_plant`: Probability the image contains a plant.
*   `result.classification.suggestions`: List of taxa (Name, Probability, Details).
*   `result.disease.suggestions`: (If health requested) List of diseases/pests (Name, Probability, Treatment).

## 2. Retrieve Identification
**Endpoint:** `GET /identification/{access_token}`

### Query Parameters
*   `details`: Comma-separated list.
*   `language`: ISO 639 code (e.g., `en`, `fr`, `zh`, `ar`).

**Available Details:**
*   **Taxonomy:** `common_names`, `url`, `description` (wiki), `description_gpt`, `edible_parts`, `propagation_methods`, `watering`, `best_light_condition`, `best_soil_type`, `toxicity`, `cultural_significance`.
*   **Health/Disease:** `local_name`, `description`, `treatment` (biological, chemical, prevention), `classification`.

## 3. Chatbot (Ask Question)
**Endpoint:** `POST /identification/{access_token}/conversation`

Ask the LLM chatbot questions about a specific identification result.

**Payload:**
```json
{
    "question": "Is this plant edible?",
    "prompt": "Answer in short sentences.", 
    "temperature": 0.5,
    "app_name": "MyPlantApp" 
}
```
*Note: `prompt`, `temperature`, and `app_name` are usually only effective on the first message.*

## 4. Get Chatbot Conversation
**Endpoint:** `GET /identification/{access_token}/conversation`

Returns the full history of the chat session associated with the identification.

## 5. Send Chatbot Feedback
**Endpoint:** `POST /identification/{access_token}/conversation/feedback`

**Payload:**
```json
{
    "feedback": {
        "rating": 5,
        "comment": "Helpful answer."
    }
}
```

## 6. Usage Info
**Endpoint:** `GET /usage_info`
Returns credit status for Plant.id.

---

# Error Handling (Both APIs)

*   **200:** Success.
*   **201:** Created.
*   **400:** Invalid input (check image format or JSON syntax).
*   **401:** Invalid API Key.
*   **404:** Identification `access_token` not found.
*   **429:** Insufficient credits.
*   **500:** Server error.
```