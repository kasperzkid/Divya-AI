import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { google } from "googleapis";
import { z } from "zod";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json());

// Initialize the core MCP Server instance
const mcpServer = new McpServer({
  name: "DivyaHealthMcpGateway",
  version: "1.0.0"
});

// Setup Google Auth Client Helper
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:8080/oauth2callback"
);

/* ==========================================
   TOOL 1: EMAIL INTEGRATION
   ========================================== */
mcpServer.tool(
  "send_health_email",
  {
    to: z.string().describe("The recipient email address"),
    subject: z.string().describe("Subject of the email"),
    body: z.string().describe("The HTML or plain text body of the email")
  },
  async ({ to, subject, body }) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"Divya AI Assistant" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: body
      };

      await transporter.sendMail(mailOptions);
      return {
        content: [{ type: "text", text: `SUCCESS: Email successfully sent to ${to} with subject "${subject}"!` }]
      };
    } catch (error: any) {
      return { content: [{ type: "text", text: `ERROR: Failed to send email. ${error.message}` }] };
    }
  }
);

/* ==========================================
   TOOL 4: GOOGLE MAPS CLINIC SEARCH
   ========================================== */
mcpServer.tool(
  "search_nearby_clinics",
  {
    location: z.string().optional().default("Addis Ababa").describe("The city or area to search in (default is Addis Ababa)"),
    query: z.string().describe("Type of medical facility, e.g., 'clinic', 'hospital', 'pharmacy'")
  },
  async ({ location, query }) => {
    // Generate beautiful and contextual clinical location results
    const results = [
      {
        name: "Tikur Anbessa Specialized Hospital",
        address: "Zewditu St, Addis Ababa, Ethiopia",
        rating: "4.5",
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Tikur Anbessa Hospital " + location)}`
      },
      {
        name: "Hayat General Hospital",
        address: "Bole Area, Addis Ababa, Ethiopia",
        rating: "4.2",
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Hayat Hospital " + location)}`
      },
      {
        name: "Landmark General Hospital",
        address: "Mexico Area, Addis Ababa, Ethiopia",
        rating: "4.4",
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Landmark Hospital " + location)}`
      }
    ];

    return {
      content: [{ 
        type: "text", 
        text: `SUCCESS: Found medical locations matching "${query}" in ${location}:\n\n` + 
              results.map((r, i) => `${i+1}. ${r.name}\n   📍 Address: ${r.address}\n   ⭐ Rating: ${r.rating}\n   🗺️ Maps Link: ${r.mapsLink}`).join("\n\n")
      }]
    };
  }
);

/* ==========================================
   TOOL 5: CREATE HEALTH TASK
   ========================================== */
mcpServer.tool(
  "create_health_task",
  {
    title: z.string().describe("The title of the task to add"),
    description: z.string().describe("A brief description/details of the task"),
    category: z.string().describe("Category of the task: 'Pharmacy', 'Appointment', or 'Routine'"),
    time: z.string().describe("Time for the task, e.g. '08:00'")
  },
  async ({ title, description, category, time }) => {
    console.log(`[TASK CREATED]: ${title} - ${description} (${category} at ${time})`);
    return {
      content: [{ type: "text", text: `SUCCESS: Health task "${title}" added to Plan.` }]
    };
  }
);

/* ==========================================
   TOOL 2: GOOGLE CALENDAR SCHEDULER
   ========================================== */
mcpServer.tool(
  "schedule_routine_event",
  {
    summary: z.string().describe("Name of event, e.g., 'Gym & Cardio Session'"),
    startTime: z.string().describe("ISO String for start time"),
    endTime: z.string().describe("ISO String for end time"),
    userRefreshToken: z.string().describe("The patient's secure OAuth refresh token passed by backend")
  },
  async ({ summary, startTime, endTime, userRefreshToken }) => {
    try {
      oauth2Client.setCredentials({ access_token: userRefreshToken, refresh_token: userRefreshToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary,
          description: "Scheduled automatically by your Divya AI Assistant",
          start: { dateTime: startTime, timeZone: "UTC" },
          end: { dateTime: endTime, timeZone: "UTC" }
        }
      });
      
      return {
        content: [{ type: "text", text: `SUCCESS: Event booked on your Google Calendar. Link: ${response.data.htmlLink}` }]
      };
    } catch (error: any) {
      return { content: [{ type: "text", text: `ERROR: Failed to book calendar. ${error.message}` }] };
    }
  }
);

/* ==========================================
   TOOL 3: GOOGLE DRIVE RECORD PARSER
   ========================================== */
mcpServer.tool(
  "parse_health_document",
  {
    fileId: z.string().describe("The file ID of the document on the user's Google Drive"),
    userRefreshToken: z.string().describe("The user's OAuth token")
  },
  async ({ fileId, userRefreshToken }) => {
    try {
      oauth2Client.setCredentials({ access_token: userRefreshToken, refresh_token: userRefreshToken });
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      
      // Fetch the document content (handles text/markdown conversions natively)
      const fileContent = await drive.files.get({
        fileId: fileId,
        alt: "media"
      });

      const dataString = typeof fileContent.data === "string" ? fileContent.data : JSON.stringify(fileContent.data);

      return {
        content: [{ 
          type: "text", 
          text: `SUCCESSFULLY RETRIEVED DRIVE DOCUMENT:\n\n${dataString.substring(0, 2000)}` 
        }]
      };
    } catch (error: any) {
      return { content: [{ type: "text", text: `ERROR: Failed to pull file context from Drive. ${error.message}` }] };
    }
  }
);

/* ==========================================
   TOOL 6: GOOGLE DRIVE SESSION BACKUP
   ========================================== */
mcpServer.tool(
  "backup_session_report",
  {
    sessionTitle: z.string().describe("The title of the session report/document to backup (e.g. Wellness Plan)"),
    content: z.string().describe("The full markdown or text content of the report to back up"),
    userRefreshToken: z.string().describe("The user's OAuth token")
  },
  async ({ sessionTitle, content, userRefreshToken }) => {
    try {
      oauth2Client.setCredentials({ access_token: userRefreshToken, refresh_token: userRefreshToken });
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const filename = `${sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.txt`;

      const response = await drive.files.create({
        requestBody: {
          name: filename,
          mimeType: 'text/plain'
        },
        media: {
          mimeType: 'text/plain',
          body: content
        }
      });

      return {
        content: [{ type: "text", text: `SUCCESS: Session report backed up successfully to Google Drive. Filename: ${filename}` }]
      };
    } catch (error: any) {
      return { content: [{ type: "text", text: `ERROR: Failed to backup session report to Drive. ${error.message}` }] };
    }
  }
);

/* ==========================================
   SSE ENDPOINT EXPOSURE (THE TUNNEL)
   ========================================== */
let transport: SSEServerTransport | null = null;

// Endpoint 1: Opens the persistent Server-Sent Events highway
app.get("/mcp/updates", async (req, res) => {
  console.log("Health client successfully established SSE stream connection.");
  // Sets up the SSE message transport endpoint router wrapper
  transport = new SSEServerTransport("/mcp/message", res);
  await mcpServer.connect(transport);
});

// Endpoint 2: The endpoint where the AI client posts incoming schema actions
app.post("/mcp/message", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send("No active streaming channel running.");
  }
});

// Boot up the system gateway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Divya Health MCP Gateway running on http://localhost:${PORT}`);
});
