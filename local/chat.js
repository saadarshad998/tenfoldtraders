import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function chatResponse(question, history = []) {

const system = `
You are Tenfold Cars AI assistant.

You are friendly, natural, and conversational.
You help customers and can chat normally.

Do NOT invent car inventory data.
If user asks about inventory, you will be given database results separately.
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: question }
        ]
    });

    return response.choices[0].message.content.trim();
}
