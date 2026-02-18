import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function routeMessage(question, history = []) {

const system = `
You are classifying user messages in a dealership chatbot.

Return ONLY one word:

CHAT
QUERY

CHAT means:
- greetings
- thanks
- small talk
- confirmations about previous answer
- reactions to results
- paraphrasing the assistant
- logical reasoning sentences

QUERY means:
- asking for data from the dealership database
- counts, lists, owners, prices, mileage, stock, sold cars

IMPORTANT RULE:
If the user is talking ABOUT the previous answer rather than asking for new data → CHAT
If the user is asking for comfirmations, paraphrasing, or reacting to the previous answer → CHAT
If the user is asking for new data, even if related to the previous answer → QUERY

Examples:

"hello" -> CHAT
"thanks" -> CHAT
"ok nice" -> CHAT
"that makes sense" -> CHAT
"so one each?" -> CHAT
"so both are sold?" -> CHAT
"so my uncle owns them?" -> CHAT
"right?" -> CHAT
"are you sure?" -> CHAT

"how many cars" -> QUERY
"show me toyotas" -> QUERY
"who owns them" -> QUERY
"how many owned by me" -> QUERY
"list sold ones" -> QUERY
`;


    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: question }
        ]
    });

    return response.choices[0].message.content.trim();
}
