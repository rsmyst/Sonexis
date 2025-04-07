import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import os from "os";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
            audioFile,
            parameters,
            requestVoiceAuth = false
        } = await req.json();

        // STEP 1: Handle voice authentication if requested
        if (requestVoiceAuth) {
            if (!audioFile) {
                return NextResponse.json({ error: "audio file required for voice authentication" }, { status: 400 });
            }

            // Save audio to temporary file
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `auth-${Date.now()}.wav`);
            const buffer = Buffer.from(audioFile, 'base64');
            fs.writeFileSync(tempFilePath, buffer);

            const isAuthenticated = await verifyVoiceIdentity(session.user.id, tempFilePath);
            
            // Clean up temp file
            fs.unlinkSync(tempFilePath);
            
            if (!isAuthenticated) {
                return NextResponse.json({ error: "voice authentication failed" }, { status: 401 });
            }
        }

        // STEP 2: Process speech to text if audio file is provided
        let textQuery = query;
        if (audioFile && !textQuery) {
            try {
                // Save audio to temporary file
                const tempDir = os.tmpdir();
                const tempFilePath = path.join(tempDir, `stt-${Date.now()}.wav`);
                const buffer = Buffer.from(audioFile, 'base64');
                fs.writeFileSync(tempFilePath, buffer);

                // Process audio to text using Whisper API
                textQuery = await processAudioToText(tempFilePath);
                console.log("Processed audio to text:", textQuery);

                // Clean up temp file
                fs.unlinkSync(tempFilePath);
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
async function processAudioToText(audioPath: string): Promise<string> {
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            response_format: "json",
            prompt: "This is a business query about data analysis, sales metrics, or product performance."
        });
        
        console.log('Transcription successful:', transcription.text);
        return transcription.text;
    } catch (error: any) {
        console.error('Error in audio transcription:', 
            error.response?.data?.error?.message || error.message);
        throw new Error(`Failed to process audio to text: ${error.message}`);
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
}> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Prepare the prompt with database schema and user query
        const prompt = `Given the following database schema and user query, generate an appropriate SQL query.
        Also suggest related queries and a suitable visualization (available charts : area_chart, bar_chart_interactive, regular_bar_graph, pie_chart, stack_graph).

        Database Schema:
        ${JSON.stringify(dbMetadata, null, 2)}

        User Query: ${query}

        Parameters: ${JSON.stringify(parameters || {})}

        Please provide:
        1. A SQL query that answers the user's question
        2. 2-3 related queries that could provide additional insights
        3. A suggested visualization type and configuration

        Format the response as a JSON object with the following structure:
        {
            "sqlQuery": "the generated SQL query",
            "relatedQueries": [
                {
                    "description": "description of the related query",
                    "sql": "the SQL query"
                }
            ],
            "suggestedVisualization": {
                "chartType": "type of chart (e.g., bar, line, pie)",
                "chartOptions": {
                    "xAxis": { "key": "column name", "label": "axis label" },
                    "yAxis": { "key": "column name", "label": "axis label" },
                    "colors": ["color1", "color2"]
                },
                "title": "chart title",
                "description": "chart description"
            }
        }`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse the JSON response
        const parsedResponse = JSON.parse(text);

        return {
            sqlQuery: parsedResponse.sqlQuery,
            relatedQueries: parsedResponse.relatedQueries,
            suggestedVisualization: parsedResponse.suggestedVisualization
        };
    } catch (error) {
        console.error("Error generating SQL with Gemini:", error);
        throw new Error("Failed to generate SQL query");
    }
}

// Helper function to validate modification queries
function validateModificationQuery(query: string): void {
    const normalizedQuery = query.trim().toUpperCase();
    
    // Prevent dropping tables or databases
    if (
        normalizedQuery.includes('DROP TABLE') || 
        normalizedQuery.includes('DROP DATABASE') ||
        normalizedQuery.includes('TRUNCATE')
    ) {
        throw new Error('DROP and TRUNCATE operations are not allowed');
    }
    
    // List of protected system tables that should not be modified by user queries
    const protectedTables = [
        'USER', 'USERS', 
        'QUERY_HISTORY', 'QUERYHISTORY', 
        'VOICE_PROFILE', 'VOICEPROFILE',
        'DATABASE_METADATA', 'DATABASEMETADATA',
        'COLUMN_METADATA', 'COLUMNMETADATA',
        'VISUALIZATION', 'VISUALIZATIONS',
        'DASHBOARD', 'DASHBOARDS', 
        'DASHBOARD_WIDGET', 'DASHBOARDWIDGET',
        'USER_SETTINGS', 'USERSETTINGS'
    ];
    
    // Check if query attempts to modify protected tables
    const tablePattern = /\b(ALTER|UPDATE|DELETE|INSERT\s+INTO|CREATE\s+TABLE)\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/i;
    const tableMatch = query.match(tablePattern);
    
    if (tableMatch) {
        const operation = tableMatch[1].toUpperCase();
        const tableName = tableMatch[2].toUpperCase();
        
        if (protectedTables.includes(tableName)) {
            throw new Error(`Operation ${operation} not allowed on system table '${tableMatch[2]}'`);
        }
    }
    
    // Extra protection for system tables in case the regex doesn't catch something
    for (const table of protectedTables) {
        // For CREATE TABLE, only check exact matches to avoid false positives
        if (normalizedQuery.startsWith('CREATE TABLE') && 
            normalizedQuery.includes(` ${table} `)) {
            throw new Error(`Cannot create table with reserved name '${table}'`);
        }
        
        // For other modification operations, check if the protected table is being targeted
        if ((normalizedQuery.startsWith('UPDATE') || 
             normalizedQuery.startsWith('DELETE') || 
             normalizedQuery.startsWith('ALTER')) && 
            normalizedQuery.includes(` ${table} `)) {
            throw new Error(`Cannot modify system table '${table}'`);
        }
    }
}

// Execute SQL query against the database
async function executeQuery(sqlQuery: string): Promise<{ data: any; executionTime: number }> {
    const startTime = Date.now();
    
    try {
        // Optional: Add query validation to prevent destructive operations
        const isReadOnly = isReadOnlyQuery(sqlQuery);
        
        if (!isReadOnly) {
            validateModificationQuery(sqlQuery);
        } else {
            // Even for read-only queries, we should prevent excessive data access
            // to system tables for security reasons
            validateReadQuery(sqlQuery);
        }
        
        // Execute the query using Prisma's raw query capabilities
        let results;
        const normalizedQuery = sqlQuery.trim().toUpperCase();
        
        // Handle different query types (SELECT, CREATE, INSERT, etc.)
        if (normalizedQuery.startsWith('SELECT')) {
            // For SELECT queries, use $queryRaw
            results = await prisma.$queryRaw`${sqlQuery}`;
            return {
                data: results,
                executionTime: Date.now() - startTime
            };
        } 
        
        // Handle CREATE TABLE operations
        else if (normalizedQuery.startsWith('CREATE TABLE')) {
            // Extract table name for response
            const tableNameMatch = sqlQuery.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
            
            // Execute the CREATE TABLE query
            await prisma.$executeRaw`${sqlQuery}`;
            
            return {
                data: { 
                    message: `Table '${tableName}' created successfully`,
                    operation: 'CREATE_TABLE',
                    tableName
                },
                executionTime: Date.now() - startTime
            };
        } 
        
        // Handle ALTER TABLE operations
        else if (normalizedQuery.startsWith('ALTER TABLE')) {
            // Extract table name and operation type for better response
            const tableNameMatch = sqlQuery.match(/ALTER\s+TABLE\s+[`"']?(\w+)[`"']?/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
            
            let operationType = 'MODIFY';
            if (normalizedQuery.includes('ADD COLUMN')) operationType = 'ADD_COLUMN';
            else if (normalizedQuery.includes('DROP COLUMN')) operationType = 'DROP_COLUMN';
            else if (normalizedQuery.includes('RENAME')) operationType = 'RENAME';
            
            // Execute the ALTER TABLE query
            await prisma.$executeRaw`${sqlQuery}`;
            
            return {
                data: { 
                    message: `Table '${tableName}' altered successfully`,
                    operation: operationType,
                    tableName
                },
                executionTime: Date.now() - startTime
            };
        } 
        
        // Handle INSERT operations with return of inserted ID(s) when possible
        else if (normalizedQuery.startsWith('INSERT')) {
            // Extract table name for better response
            const tableNameMatch = sqlQuery.match(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
            
            // Execute the INSERT query
            const result = await prisma.$executeRaw`${sqlQuery}`;
            
            return {
                data: { 
                    message: `Data inserted successfully into '${tableName}'`,
                    operation: 'INSERT',
                    tableName,
                    rowsAffected: result
                },
                executionTime: Date.now() - startTime
            };
        } 
        
        // Handle UPDATE operations with detailed information
        else if (normalizedQuery.startsWith('UPDATE')) {
            // Extract table name and condition for better response
            const tableNameMatch = sqlQuery.match(/UPDATE\s+[`"']?(\w+)[`"']?/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
            
            // Extract WHERE clause if present for context
            const whereClauseMatch = sqlQuery.match(/WHERE\s+(.+)(?:;|$)/i);
            const whereCondition = whereClauseMatch ? whereClauseMatch[1].trim() : 'all records';
            
            // Execute the UPDATE query
            const rowsAffected = await prisma.$executeRaw`${sqlQuery}`;
            
            return {
                data: { 
                    message: `Data updated successfully in '${tableName}'`,
                    operation: 'UPDATE',
                    tableName,
                    whereCondition,
                    rowsAffected
                },
                executionTime: Date.now() - startTime
            };
        } 
        
        // Handle DELETE operations
        else if (normalizedQuery.startsWith('DELETE')) {
            // Extract table name for better response
            const tableNameMatch = sqlQuery.match(/FROM\s+[`"']?(\w+)[`"']?/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
            
            // Execute the DELETE query
            const rowsAffected = await prisma.$executeRaw`${sqlQuery}`;
            
            return {
                data: { 
                    message: `Data deleted successfully from '${tableName}'`,
                    operation: 'DELETE',
                    tableName,
                    rowsAffected
                },
                executionTime: Date.now() - startTime
            };
        } 
        
        // For other queries (GRANT, SET, etc.)
        else {
            const result = await prisma.$executeRaw`${sqlQuery}`;
            return {
                data: { 
                    message: 'Query executed successfully',
                    rowsAffected: result
                },
                executionTime: Date.now() - startTime
            };
        }
        
    } catch (error: any) {
        console.error('Database query error:', error);
        throw new Error(`Failed to execute query: ${error.message}`);
    }
}

// Helper function to check if a query is read-only
function isReadOnlyQuery(query: string): boolean {
    const normalizedQuery = query.trim().toUpperCase();
    return (
        normalizedQuery.startsWith('SELECT') || 
        normalizedQuery.startsWith('SHOW') ||
        normalizedQuery.startsWith('DESCRIBE')
    );
}

// Helper function to validate read queries
function validateReadQuery(query: string): void {
    const normalizedQuery = query.trim().toUpperCase();
    
    // Check for overly broad queries that might expose sensitive data
    if (normalizedQuery.includes('SELECT * FROM USERS') || 
        normalizedQuery.includes('SELECT * FROM USER')) {
        throw new Error('Direct access to all user data is restricted for security reasons');
    }
    
    // Check for attempts to access password fields
    if (normalizedQuery.includes('PASSWORD') && 
       (normalizedQuery.includes('USER') || normalizedQuery.includes('USERS'))) {
        throw new Error('Access to password fields is strictly forbidden');
    }
    
    // Restrict joining sensitive tables with user data
    if ((normalizedQuery.includes('JOIN') || normalizedQuery.includes('UNION')) &&
        (normalizedQuery.includes('USER') || normalizedQuery.includes('USERS')) &&
        normalizedQuery.includes('PASSWORD')) {
        throw new Error('Joining operations involving sensitive user data are restricted');
    }
    
    // Add additional read restrictions as needed for your security requirements
} 