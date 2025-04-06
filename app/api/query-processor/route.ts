import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const prisma = new PrismaClient();

// This is the main endpoint for processing natural language to SQL
export const POST = async (req: NextRequest) => {
    let textQuery: string | undefined;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        // Get request body which could contain:
        // - text query (converted from voice on client-side or directly typed)
        // - audio file or streaming data (would need to be processed by Whisper)
        // - optional parameters (date ranges, filters, etc.)
        const {
            query,
            audioData,
            parameters,
            requestVoiceAuth = false,
            audioPath
        } = await req.json();

        // STEP 1: Handle voice authentication if requested
        if (requestVoiceAuth) {
            if (!audioPath) {
                return NextResponse.json({ error: "audio path required for voice authentication" }, { status: 400 });
            }

            const isAuthenticated = await verifyVoiceIdentity(session.user.id, audioPath);
            
            if (!isAuthenticated) {
                return NextResponse.json({ error: "voice authentication failed" }, { status: 401 });
            }
        }

        // STEP 2: Process speech to text if audio data is provided
        let textQuery = query;
        if (audioData && !textQuery) {
            try {
                // Process audio to text using Whisper API
                textQuery = await processAudioToText(audioData);
                console.log("Processed audio to text:", textQuery);
            } catch (error) {
                console.error("Speech-to-text processing error:", error);
                return NextResponse.json({ 
                    error: "Failed to process speech to text", 
                    details: error instanceof Error ? error.message : String(error)
                }, { status: 400 });
            }
            
            if (!textQuery) {
                return NextResponse.json({ error: "failed to process speech to text" }, { status: 400 });
            }
        }

        if (!textQuery) {
            return NextResponse.json({ error: "query text is required" }, { status: 400 });
        }

        // STEP 3: Fetch database schema metadata for context
        const dbMetadata = await prisma.databaseMetadata.findMany({
            include: {
                columns: true
            }
        });

        // STEP 4: Process natural language to SQL using LLM (Gemini or other)
        // This would connect to your LLM service
        const {
            sqlQuery,
            relatedQueries,
            suggestedVisualization,
            insights
        } = await processNaturalLanguageToSQL(textQuery, dbMetadata, parameters);

        // STEP 5: Execute the SQL query against the database
        // This is a placeholder - in production, you would use a secure method to execute queries
        // Consider using a dedicated service with proper access controls
        const queryResults = await executeQuery(sqlQuery);
        // STEP 6: Save the query to history
        const queryHistory = await prisma.queryHistory.create({
            data: {
                userId: session.user.id,
                userQuery: textQuery,
                sqlQuery,
                relatedQueries,
                results: queryResults,
                executionTime: queryResults.executionTime,
                successful: true,
                visualization: suggestedVisualization ? {
                    create: {
                        chartType: suggestedVisualization.chartType,
                        chartOptions: suggestedVisualization.chartOptions,
                        title: suggestedVisualization.title || textQuery,
                        description: suggestedVisualization.description
                    }
                } : undefined
            },
            include: {
                visualization: true
            }
        });

        // STEP 7: Return the complete response
        return NextResponse.json({
            query: {
                original: textQuery,
                sql: sqlQuery,
                relatedQueries
            },
            results: queryResults.data,
            visualization: queryHistory.visualization,
            insights,
            executionTime: queryResults.executionTime,
            queryId: queryHistory.id
        });
    } catch (err) {
        console.log(err);
        
        // Save failed query to history if possible
        try {
            if (err instanceof Error) {
                await prisma.queryHistory.create({
                    data: {
                        userId: (await getServerSession(authOptions))?.user.id || '',
                        userQuery: textQuery || 'Unknown query',
                        sqlQuery: '',
                        successful: false,
                        errorMessage: err.message
                    }
                });
            }
        } catch (historyErr) {
            console.log("Failed to save error to history:", historyErr);
        }
        
        return NextResponse.json({ error: "error processing query" }, { status: 500 });
    }
};

// Helper functions (would be implemented in separate files in production)

// Voice identity verification using the external diarization service
async function verifyVoiceIdentity(userId: string, audioPath: string): Promise<boolean> {
    try {
        // Get user info to map our internal ID to the userID used by the voice system
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.log("User not found");
            return false;
        }

        // Verify with the speaker diarization model
        try {
            const verificationResponse = await axios.post(`${process.env.VOICE_AUTH_API_URL}/verify`, {
                user_id: user.userId.toString(), // Convert to string for the API
                audio_path: audioPath,
            });

            console.log("Voice verification result:", verificationResponse.data);
            return verificationResponse.data.authenticated;

        } catch (error) {
            console.error("Voice verification API error:", error);
            return false;
        }

    } catch (error) {
        console.error("Voice verification error:", error);
        return false;
    }
}

// Process audio to text using OpenAI Whisper API
async function processAudioToText(audioData: Buffer | string): Promise<string> {
    try {
        const formData = new FormData();
        
        // Handle different types of audio input
        if (typeof audioData === 'string' && audioData.startsWith('data:audio')) {
            // Handle base64 encoded audio data
            const base64Data = audioData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            formData.append('file', buffer, { filename: 'audio.webm' });
        } else if (typeof audioData === 'string' && fs.existsSync(audioData)) {
            // Handle file path
            const fileStream = fs.createReadStream(audioData);
            formData.append('file', fileStream);
        } else if (Buffer.isBuffer(audioData)) {
            // Handle buffer directly
            formData.append('file', audioData, { filename: 'audio.webm' });
        } else {
            throw new Error('Invalid audio data format');
        }
        
        // Add model parameter (whisper-1 is the model for the API)
        formData.append('model', 'whisper-1');
        
        // Optional parameters
        formData.append('language', 'en'); // Can be made dynamic based on user settings
        formData.append('response_format', 'json');
        
        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', 
            formData, 
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );
        
        if (response.data && response.data.text) {
            console.log('Transcription successful:', response.data.text);
            return response.data.text;
        } else {
            console.error('Unexpected API response format:', response.data);
            throw new Error('Failed to get transcription from API');
        }
    } catch (error) {
        console.error('Error in audio transcription:', error);
        throw new Error('Failed to process audio to text');
    }
}

// Process natural language to SQL using LLM
async function processNaturalLanguageToSQL(
    query: string,
    dbMetadata: any[],
    parameters?: any
): Promise<{
    sqlQuery: string;
    relatedQueries: any;
    suggestedVisualization?: any;
    insights?: string[];
}> {
    // In production, this would call the Gemini API or another LLM
    // It would include the database schema as context

    // For now, we'll return a placeholder SQL query
    const mockSQL = `SELECT product_name, SUM(sale_amount) as total_sales 
                    FROM sales 
                    WHERE sale_date >= '2023-10-01' AND sale_date <= '2023-12-31' 
                    GROUP BY product_name 
                    ORDER BY total_sales DESC`;

    const mockRelatedQueries = [
        {
            description: "Sales trend over time",
            sql: `SELECT DATE_TRUNC('month', sale_date) as month, SUM(sale_amount) as monthly_sales 
                 FROM sales 
                 WHERE sale_date >= '2023-01-01' AND sale_date <= '2023-12-31' 
                 GROUP BY month 
                 ORDER BY month`
        },
        {
            description: "Top performing categories",
            sql: `SELECT category, SUM(sale_amount) as category_sales 
                 FROM sales 
                 JOIN products ON sales.product_id = products.id
                 WHERE sale_date >= '2023-10-01' AND sale_date <= '2023-12-31' 
                 GROUP BY category 
                 ORDER BY category_sales DESC`
        },
        {
            description: "Year-over-year comparison",
            sql: `SELECT EXTRACT(YEAR FROM sale_date) as year, SUM(sale_amount) as yearly_sales 
                 FROM sales 
                 WHERE sale_date >= '2022-10-01' AND sale_date <= '2023-12-31' 
                 GROUP BY year 
                 ORDER BY year`
        }
    ];

    const mockVisualization = {
        chartType: "bar",
        chartOptions: {
            xAxis: { key: "product_name", label: "Product" },
            yAxis: { key: "total_sales", label: "Total Sales ($)" },
            colors: ["#4f46e5", "#818cf8"]
        },
        title: "Sales by Product (Q4 2023)",
        description: "Bar chart showing total sales for each product in Q4 2023"
    };

    const mockInsights = [
        "Product X had the highest sales at $125,000, representing 28% of total quarterly sales",
        "Average sales were up 15% compared to the previous quarter",
        "Three new products launched this quarter are already in the top 10 performers",
        "Weekend sales were 32% higher than weekday sales"
    ];

    return {
        sqlQuery: mockSQL,
        relatedQueries: mockRelatedQueries,
        suggestedVisualization: mockVisualization,
        insights: mockInsights
    };
}

// Execute SQL query against the database
async function executeQuery(sqlQuery: string): Promise<{ data: any; executionTime: number }> {
    // In production, this would securely execute the SQL against your database
    // For now, we'll return mock data
    const mockData = [
        { product_name: "Product A", total_sales: 125000 },
        { product_name: "Product B", total_sales: 98500 },
        { product_name: "Product C", total_sales: 67200 },
        { product_name: "Product D", total_sales: 54100 },
        { product_name: "Product E", total_sales: 42800 }
    ];

    return {
        data: mockData,
        executionTime: 235 // milliseconds
    };
} 