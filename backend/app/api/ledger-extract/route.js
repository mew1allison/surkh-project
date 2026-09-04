import { createSupabaseServerClient } from '@/lib/supabase-server'
import { extractBearerToken } from '@/app/api/inventory/route'
import { GoogleGenAI } from '@google/genai'
import { validateEntry } from '@/lib/ledger-validator'

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(request) {
  // Step 1: authenticate (same Bearer pattern as /api/inventory and /api/exchange-requests)
  const accessToken = extractBearerToken(request)
  const supabase = await createSupabaseServerClient(accessToken)
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: validate the uploaded image payload
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const { image_base64, mime_type } = body || {}

  if (typeof image_base64 !== 'string' || !image_base64) {
    return Response.json(
      { error: 'image_base64 must be a non-empty base64 string' },
      { status: 400 }
    )
  }
  if (!SUPPORTED_MIME_TYPES.includes(mime_type)) {
    return Response.json(
      { error: `mime_type must be one of: ${SUPPORTED_MIME_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // Step 3: require the server-side Gemini key
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not configured on the server' },
      { status: 500 }
    )
  }

  // Step 4: extraction — same model, prompt, and response schema as ai/index.js
  const ai = new GoogleGenAI({ apiKey })
  let response
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { inlineData: { mimeType: mime_type, data: image_base64 } },
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
        `,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              blood_group: { type: 'string', nullable: true },
              quantity: { type: 'integer', nullable: true },
              date: { type: 'string', nullable: true },
            },
            required: ['blood_group', 'quantity', 'date'],
          },
        },
      },
    })
  } catch (err) {
    return Response.json(
      { error: `Gemini extraction failed: ${err.message}` },
      { status: 502 }
    )
  }

  // Step 5: parse the structured response
  let data
  try {
    data = JSON.parse(response.text)
    // Gemini may double-serialize the JSON (string inside a string),
    // so if the first parse yields a string, parse it once more.
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
  } catch {
    return Response.json(
      { error: 'Gemini returned invalid JSON' },
      { status: 502 }
    )
  }

  if (!Array.isArray(data)) {
    return Response.json(
      { error: 'Gemini response is not an array' },
      { status: 502 }
    )
  }

  // Step 6: attach per-entry validation (same logic as ai/validator.js)
  const entries = data.map((entry) => ({
    blood_group: entry?.blood_group ?? null,
    quantity: entry?.quantity ?? null,
    date: entry?.date ?? null,
    validation: validateEntry(entry),
  }))

  return Response.json({ entries }, { status: 200 })
}
