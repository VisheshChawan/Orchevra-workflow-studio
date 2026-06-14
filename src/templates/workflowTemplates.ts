import { Node, Edge } from '@xyflow/react';

export interface TemplateDefinition {
  title: string;
  description: string;
  category: 'AI' | 'Automation' | 'Database' | 'Marketing' | 'Customer Support';
  complexity: 'Easy' | 'Medium' | 'Advanced';
  timesUsed: number;
  lastUsed: string;
  color: string;
  nodes: Node[];
  edges: Edge[];
}

export const workflowTemplates: Record<string, TemplateDefinition> = {
  geminiWriter: {
    title: "Google Gemini Copywriting Writer",
    description: "Generates custom copies with dynamic text prompt templates.",
    category: "Marketing",
    complexity: "Easy",
    timesUsed: 1420,
    lastUsed: "2 mins ago",
    color: "from-purple-500/15 via-indigo-500/5 to-transparent border-purple-500/30 text-purple-400 hover:shadow-purple-500/5",
    nodes: [
      {
        id: "customInput-1",
        type: "customInput",
        position: { x: 50, y: 150 },
        data: { id: "customInput-1", inputName: "brand_topic", inputType: "Text" }
      },
      {
        id: "text-1",
        type: "text",
        position: { x: 400, y: 80 },
        data: { 
          id: "text-1", 
          text: "Write a compelling, high-converting marketing copywriting piece about the topic: {{brand_topic}}. Focus on dynamic SaaS solutions, bullet points for key features, and end with a strong Call to Action (CTA).",
          parsedVariables: ["brand_topic"]
        }
      },
      {
        id: "llm-1",
        type: "llm",
        position: { x: 750, y: 150 },
        data: { id: "llm-1", model: "gemini-2.5-flash", temperature: 0.8 }
      },
      {
        id: "customOutput-1",
        type: "customOutput",
        position: { x: 1100, y: 200 },
        data: { id: "customOutput-1", outputName: "final_sales_copy", outputType: "Text" }
      }
    ],
    edges: [
      {
        id: "edge-customInput-1-text-1",
        source: "customInput-1",
        target: "text-1",
        sourceHandle: "value",
        targetHandle: "variable-brand_topic",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2 }
      },
      {
        id: "edge-text-1-llm-1",
        source: "text-1",
        target: "llm-1",
        sourceHandle: "output",
        targetHandle: "prompt",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2 }
      },
      {
        id: "edge-llm-1-customOutput-1",
        source: "llm-1",
        target: "customOutput-1",
        sourceHandle: "response",
        targetHandle: "value",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2 }
      }
    ]
  },
  databaseIngestion: {
    title: "API-driven Database Ingestion Flow",
    description: "Pulls metrics via REST API, transforms raw structure, and stores inside SQL securely.",
    category: "Database",
    complexity: "Advanced",
    timesUsed: 980,
    lastUsed: "14 mins ago",
    color: "from-cyan-500/15 via-blue-500/5 to-transparent border-cyan-500/30 text-cyan-400 hover:shadow-cyan-500/5",
    nodes: [
      {
        id: "customInput-1",
        type: "customInput",
        position: { x: 50, y: 180 },
        data: { id: "customInput-1", inputName: "session_token", inputType: "Secret" }
      },
      {
        id: "apiNode-1",
        type: "apiNode",
        position: { x: 380, y: 100 },
        data: { 
          id: "apiNode-1", 
          method: "POST", 
          url: "https://api.corporate-metrics.com/sync", 
          headers: "Content-Type: application/json" 
        }
      },
      {
        id: "transformNode-1",
        type: "transformNode",
        position: { x: 720, y: 140 },
        data: {
          id: "transformNode-1",
          transformName: "format_api_response",
          transformType: "Custom JS",
          transformCode: "// Format raw response for insertion\nconst records = data.items || [];\nreturn records.map(r => ({\n  id: r.uid,\n  status: 'valid_synced',\n  timestamp: Date.now()\n}));",
          outputMode: "Single Result"
        }
      },
      {
        id: "databaseNode-1",
        type: "databaseNode",
        position: { x: 1060, y: 180 },
        data: { 
          id: "databaseNode-1", 
          conn: "postgresql://db_user:password@aws-rds.com/lead_data", 
          operation: "INSERT",
          query: "INSERT INTO marketing_syncs (token, result) VALUES ('{{session_token}}', '{{success}}');"
        }
      },
      {
        id: "customOutput-1",
        type: "customOutput",
        position: { x: 1400, y: 220 },
        data: { id: "customOutput-1", outputName: "sql_ledger_receipt", outputType: "Text" }
      }
    ],
    edges: [
      {
        id: "edge-customInput-1-apiNode-1",
        source: "customInput-1",
        target: "apiNode-1",
        sourceHandle: "value",
        targetHandle: "trigger",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#06b6d4", strokeWidth: 2 }
      },
      {
        id: "edge-apiNode-1-transformNode-1",
        source: "apiNode-1",
        target: "transformNode-1",
        sourceHandle: "success",
        targetHandle: "data",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#06b6d4", strokeWidth: 2 }
      },
      {
        id: "edge-transformNode-1-databaseNode-1",
        source: "transformNode-1",
        target: "databaseNode-1",
        sourceHandle: "result",
        targetHandle: "trigger",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#06b6d4", strokeWidth: 2 }
      },
      {
        id: "edge-databaseNode-1-customOutput-1",
        source: "databaseNode-1",
        target: "customOutput-1",
        sourceHandle: "rows",
        targetHandle: "value",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#06b6d4", strokeWidth: 2 }
      }
    ]
  },
  customerSupport: {
    title: "Customer Support AI Agent",
    description: "An intelligent support system loaded with specialized knowledge bases for instant reply curation.",
    category: "Customer Support",
    complexity: "Medium",
    timesUsed: 1150,
    lastUsed: "45 mins ago",
    color: "from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/30 text-emerald-400 hover:shadow-emerald-500/5",
    nodes: [
      {
        id: "customInput-1",
        type: "customInput",
        position: { x: 50, y: 150 },
        data: { id: "customInput-1", inputName: "customer_query", inputType: "Text" }
      },
      {
        id: "text-1",
        type: "text",
        position: { x: 400, y: 80 },
        data: { 
          id: "text-1", 
          text: "KNOWLEDGE BASE CONTEXT:\n- Refund Policy: allowed within 14 calendar days of transaction.\n- Operating Hours: Mon-Fri 9:00 AM to 6:00 PM EST.\n- Plan Limits: Basic ($15/mo): 10 users, Pro ($49/mo): unlimited.\n\nACT AS INDIGO CORP SUPPORT RECOGNITION BOT:\nRespond to the customer's request using the context above. If it's outside the policy, refuse is mandatory, but offer a promo coupon of 10% discount off Pro.\n\nQUERY: {{customer_query}}",
          parsedVariables: ["customer_query"]
        }
      },
      {
        id: "llm-1",
        type: "llm",
        position: { x: 750, y: 150 },
        data: { id: "llm-1", model: "gemini-2.5-flash", temperature: 0.4 }
      },
      {
        id: "customOutput-1",
        type: "customOutput",
        position: { x: 1100, y: 220 },
        data: { id: "customOutput-1", outputName: "curated_support_reply", outputType: "Text" }
      }
    ],
    edges: [
      {
        id: "edge-customInput-1-text-1",
        source: "customInput-1",
        target: "text-1",
        sourceHandle: "value",
        targetHandle: "variable-customer_query",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 }
      },
      {
        id: "edge-text-1-llm-1",
        source: "text-1",
        target: "llm-1",
        sourceHandle: "output",
        targetHandle: "prompt",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 }
      },
      {
        id: "edge-llm-1-customOutput-1",
        source: "llm-1",
        target: "customOutput-1",
        sourceHandle: "response",
        targetHandle: "value",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 }
      }
    ]
  },
  leadPipeline: {
    title: "Lead Processing Automation Pipeline",
    description: "Ingests incoming customer leads, sanitizes contact details, commits to the ledger database and triggers a prompt template.",
    category: "AI",
    complexity: "Advanced",
    timesUsed: 750,
    lastUsed: "1 hour ago",
    color: "from-amber-500/15 via-orange-500/5 to-transparent border-amber-500/30 text-amber-400 hover:shadow-amber-500/5",
    nodes: [
      {
        id: "customInput-1",
        type: "customInput",
        position: { x: 50, y: 180 },
        data: { id: "customInput-1", inputName: "lead_payload", inputType: "JSON" }
      },
      {
        id: "transformNode-1",
        type: "transformNode",
        position: { x: 380, y: 100 },
        data: {
          id: "transformNode-1",
          transformName: "sanitize_lead_fields",
          transformType: "Custom JS",
          transformCode: "// Sanitize fields\nconst email = (data.email || '').trim().toLowerCase();\nconst name = data.name || 'Anonymous Prospect';\nreturn { email, name, score: data.revenue > 100000 ? 'High Tier' : 'Mid Tier' };",
          outputMode: "Single Result"
        }
      },
      {
        id: "databaseNode-1",
        type: "databaseNode",
        position: { x: 720, y: 140 },
        data: { 
          id: "databaseNode-1", 
          conn: "postgresql://crm:secret@main-neon.app/crm_data", 
          operation: "INSERT",
          query: "INSERT INTO leads (name, email, tier_level) VALUES ('{{name}}', '{{email}}', '{{score}}');"
        }
      },
      {
        id: "text-1",
        type: "text",
        position: { x: 1060, y: 80 },
        data: { 
          id: "text-1", 
          text: "Compose a personalized sales outreach email for {{name}} (Email: {{email}}) who graduated into the {{score}} tier. Offer them a priority consultative deep-dive sync this Friday.",
          parsedVariables: ["name", "email", "score"]
        }
      },
      {
        id: "customOutput-1",
        type: "customOutput",
        position: { x: 1400, y: 220 },
        data: { id: "customOutput-1", outputName: "lead_outreach_compiled", outputType: "Text" }
      }
    ],
    edges: [
      {
        id: "edge-customInput-1-transformNode-1",
        source: "customInput-1",
        target: "transformNode-1",
        sourceHandle: "value",
        targetHandle: "data",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2 }
      },
      {
        id: "edge-transformNode-1-databaseNode-1",
        source: "transformNode-1",
        target: "databaseNode-1",
        sourceHandle: "result",
        targetHandle: "trigger",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2 }
      },
      {
        id: "edge-databaseNode-1-text-1",
        source: "databaseNode-1",
        target: "text-1",
        sourceHandle: "rows",
        targetHandle: "variable-name",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2 }
      },
      {
        id: "edge-text-1-customOutput-1",
        source: "text-1",
        target: "customOutput-1",
        sourceHandle: "output",
        targetHandle: "value",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2 }
      }
    ]
  }
};
