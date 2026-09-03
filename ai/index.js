const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const { validateEntry } = require("./validator");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function main() {

    const imageData = fs.readFileSync("test-ledger.jpeg");

    const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",

        contents: [
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageData.toString("base64")
                }
            },
            `
            Extract the blood inventory information from this handwritten ledger.

            Return ONLY a JSON array.
            Do not return markdown.
            Do not return code fences.
            Do not add explanations.

            Each object must contain exactly these fields:
            - blood_group
            - quantity
            - date

            Rules:
            - blood_group must be one of:
              A+, A-, B+, B-, AB+, AB-, O+, O-
            - quantity must be a non-negative integer
            - date must be YYYY-MM-DD
            - if any value is unclear, return null
            - never guess unclear information
            `
        ],

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "array",

                items: {
                    type: "object",

                    properties: {
                        blood_group: {
                            type: "string",
                            nullable: true
                        },

                        quantity: {
                            type: "integer",
                            nullable: true
                        },

                        date: {
                            type: "string",
                            nullable: true
                        }
                    },

                    required: [
                        "blood_group",
                        "quantity",
                        "date"
                    ]
                }
            }
        }
    });

    const rawText = response.text;


    console.log("RAW GEMINI OUTPUT:");
    console.log(rawText);

    try {

        const data = JSON.parse(rawText);
        if (!Array.isArray(data)) {
    console.log("\nERROR: Gemini response is not an array.");
    return;
}

console.log("\nPARSED JSON:");
console.log(JSON.stringify(data, null, 2));

console.log("\nVALIDATION RESULTS:");

data.forEach((entry, index) => {

    const result = validateEntry(entry);

    console.log(`\nEntry ${index + 1}:`);

    if (result.valid) {
    console.log("VALID ✅");
    console.log("Status:", result.status);
} else {
    console.log("INVALID ❌");
    console.log("Status:", result.status);
    console.log("Reasons:", result.errors);
}
});

    } catch (error) {

        console.log("\nERROR: Gemini returned invalid JSON.");
        console.log(error.message);

    }
}

main();