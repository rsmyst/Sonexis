import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { text, schema } = await request.json();

    if (!text || !schema) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Given the following database schema and user query, generate an appropriate SQL query:

Database Schema:
${JSON.stringify(schema, null, 2)}

User Query: ${text}

Please generate a SQL query that would answer the user's question.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sqlQuery = response.text();

    return NextResponse.json({
      sqlQuery,
      explanation:
        "Generated SQL query based on user input and database schema",
    });
  } catch (error) {
    console.error("Gemini processing error:", error);
    return NextResponse.json(
      { error: "Gemini processing failed" },
      { status: 500 }
    );
  }
}
