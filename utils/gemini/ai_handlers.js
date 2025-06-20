const { GoogleGenAI, Type } = require("@google/genai");

const api_key = "AIzaSyCEnrAUpdAyAaiAPhsO_i8JBVBr3EIM4Ic";

const ai = new GoogleGenAI({ apiKey: api_key });

const constants = {
    app_context: `Sahas is a community safety platform focused on improving women's safety through crowdsourced, location-based insights. The app allows anonymous users—categorized as "He" or "She"—to report unsafe locations, provide real-time feedback, and verify public safety incidents. It uses heatmaps to highlight risk zones, encourages behavioral change through pledge systems, and enables users to search routes for safety insights. We aim to promote empathy and collective action, especially by engaging male users in allyship efforts for safer public spaces`,
}

const generatePledgesByGender = async (gender) => {

    const prompt = `Generate a list of 3 short but meaningful pledge statements for ${gender} for a ${constants.app_context} keep it emotional and impactful. Each pledge should be concise, ideally no more than 10 words, and should encourage positive action towards improving community safety. The pledges should be suitable for a public safety app and resonate with the target audience. Format the response as a JSON array of objects, each containing a single pledge statement under the key "pledge".`

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        pledge: { type: Type.STRING }
                    }
                }
            }
        }
    });

    return response.text;

}

const analyzeImageSafety = async ({ imageUrl, userDescription }) => {

    const imgRes = await fetch(imageUrl);
    const imageArrayBuffer = await imgRes.arrayBuffer();
    const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // use vision-capable model
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/jpeg", // specify the image type
                            data: base64ImageData
                        }
                    },
                    {
                        text: `Analyze this image from a public space for safety signals like lighting, crowd presence, signage, and visible threats and and also try to verify what the user is saying about it in - { userReport : ${userDescription} }.Remember that the reports from 'she || F' will have high trust factors than 'he || M' also check if the userReport is a feed back and contains any previous report analysis and trust score then keep all the things in mind and process accordingly keep the summary short and simple don't overload it with insights such as the gender according to the platform description ${constants.app_context}.
                        Return:
                        - a trustScore out of 100 default is 50 it can be reduced also (with 2 decimal) the lower the score the more unsafe it is
                        - a safetyLabel: 'safe', 'moderately risky', 'risky' or 'unsafe'
                        - - a summary of the safety analysis in a single sentence`
                    }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    trustScore: { type: Type.NUMBER },
                    safetyLabel: {
                        type: Type.STRING,
                        enum: ['safe', 'moderately risky', 'risky', 'unsafe']
                    },
                    summary: { type: Type.STRING }
                },
                required: ["trustScore", "safetyLabel", "summary"]
            }
        }
    });

    return response.text;

}

const chatBot = async (message, userContext) => {

    const { gender, app_context, location } = userContext;

    const prompt = `
    You are a kind and helpful assistant for a ${app_context}.

    A user has sent this message: "${message}"
    Their gender is ${gender}.
    ${location ? `Their location is ${location}.` : ''}

    1. Respond clearly and supportively.
    2. Keep reply under 100 words.
    3. Suggest up to 3 follow-up quick replies in an array.

    Respond in JSON with:
    {
      "message": "...",
      "quickReplies": ["...", "..."]
    }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    return JSON.parse(response.text);

}

module.exports = {
    generatePledgesByGender,
    analyzeImageSafety
};