import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function respond(question, sql, rows, history = [])
 {

const system = `
You are the Tenfold Cars dealership assistant.

Your job is to answer the customer's question using ONLY the database results.

Rules:
- Never mention SQL, database, rows, or tables
- Be concise and natural
- Do not add marketing phrases
- Do not invent car details
- Combine make and model as: "Mazda 2", "BMW 320d"
- Never say the word "model"

VERY IMPORTANT:
You must incorporate the customer's filters into the sentence:
Examples:
"under 100k miles"
"in stock"
"owned by Umar"
"sold"
"blue cars"

Grammar:
- If 0 results → say none found
- If 1 result → "There is one ..."
- If multiple → "There are X ..."

Write a natural human sentence that answers the question.
`;


    const user = `
User question:
${question}

Query result:
${JSON.stringify(rows)}
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: user }
        ],
        temperature: 0
    });

    return response.choices[0].message.content.trim();
}
