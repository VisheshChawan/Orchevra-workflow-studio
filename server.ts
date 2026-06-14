import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import { GoogleGenAI, Type } from '@google/genai';

interface FlowNode {
  id: string;
  type?: string;
  data?: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

// DFS cycle detection using 3-state logic (0 = unvisited, 1 = visiting, 2 = visited)
function checkIsDAG(nodes: FlowNode[], edges: FlowEdge[]): boolean {
  const adj: Record<string, string[]> = {};
  
  // Establish empty arrays for adjacency list
  nodes.forEach(node => {
    adj[node.id] = [];
  });

  // Populate adjacency list
  edges.forEach(edge => {
    if (adj[edge.source] !== undefined) {
      adj[edge.source].push(edge.target);
    }
  });

  const state: Record<string, number> = {};
  nodes.forEach(node => {
    state[node.id] = 0;
  });

  function hasCycle(nodeId: string): boolean {
    state[nodeId] = 1; // Mark as CURRENTLY VISITING in the recursion stack

    const neighbors = adj[nodeId] || [];
    for (const neighbor of neighbors) {
      // If we see a neighbor currently visiting, a back-edge exist, i.e., cyclic dependency!
      if (state[neighbor] === 1) {
        return true;
      }
      
      if (state[neighbor] === 0) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
    }

    state[nodeId] = 2; // Mark as FULLY VISITED
    return false;
  }

  // Iterate over all nodes in the DAG to avoid missing independent subgraphs
  for (const node of nodes) {
    if (state[node.id] === 0) {
      if (hasCycle(node.id)) {
        return false; // Not a DAG because a cyclic path exists
      }
    }
  }

  return true; // Directed and completely Acyclic (is a correct DAG)
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support JSON parsing
  app.use(express.json());

  // Spawn Python FastAPI backend process
  const spawnPythonBackend = () => {
    console.log('[Theme Engine] Spawning Python FastAPI backend on port 18080...');
    
    // Attempt with python3 first
    const pyProcess = spawn('python3', ['backend/main.py'], {
      stdio: 'inherit',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    pyProcess.on('error', (err) => {
      console.warn('[Theme Engine] Failed to start with python3, trying python...', err);
      const fallbackProcess = spawn('python', ['backend/main.py'], {
        stdio: 'inherit',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
      fallbackProcess.on('error', (fallbackErr) => {
        console.error('[Theme Engine] Failed to start Python backend entirely:', fallbackErr);
      });
    });
  };

  spawnPythonBackend();

  // POST endpoint to evaluate graph structure
  app.post('/api/pipelines/parse', async (req, res) => {
    try {
      const { nodes, edges } = req.body as { nodes: FlowNode[]; edges: FlowEdge[] };

      if (!nodes || !Array.isArray(nodes)) {
        res.status(400).json({ error: 'Nodes must be configured as a valid array.' });
        return;
      }
      if (!edges || !Array.isArray(edges)) {
        res.status(400).json({ error: 'Edges must be configured as a valid array.' });
        return;
      }

      // Route the parse request through Python FastAPI backend at port 18080
      try {
        const response = await fetch('http://127.0.0.1:18080/api/pipelines/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nodes, edges }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`FastAPI returned status ${response.status}: ${errText}`);
        }

        const report = await response.json();
        res.status(200).json({
          ...report,
          computed_by: 'Python FastAPI Backend'
        });
      } catch (proxyErr: any) {
        console.warn('[Theme Engine] FastAPI proxy check failed. Using Node fallback logic:', proxyErr.message);
        
        // Graceful Node.js fallback evaluation
        const num_nodes = nodes.length;
        const num_edges = edges.length;
        const is_dag = checkIsDAG(nodes, edges);

        res.status(200).json({
          num_nodes,
          num_edges,
          is_dag,
          computed_by: 'NodeJS Fallback'
        });
      }
    } catch (err: any) {
      console.error('Core parsing error:', err);
      res.status(500).json({ error: 'Internal pipeline parser exception.' });
    }
  });

  // POST endpoint to generate workflow using Gemini
  app.post('/api/gemini/generate-workflow', async (req, res) => {
    try {
      const { prompt } = req.body as { prompt: string };
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'A descriptive text prompt is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(400).json({ 
          error: 'Gemini API Key is missing. Please configure GEMINI_API_KEY inside your Secrets panel under Settings.' 
        });
        return;
      }

      // Initialize the official @google/genai client under recommended guidelines
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const SYSTEM_INSTRUCTION = `You are an elite enterprise SaaS workflow architect that plans, constructs, and links APIs, LLM systems, Datasets, and automated notifications into optimized Directed Acyclic Graphs (DAGs).
Your goal is to parse the user's natural language request and generate a complete list of nodes and edges connecting them.

You MUST only use the following node types:
1. 'customInput': Represents user-provided arguments or trigger payload fields.
   Fields:
   - 'inputName' (string): Name of parameter/variable.
   - 'inputType' ('JSON' | 'Text' | 'Secret' | 'File'): The type of input.
   Outputs: 'value' (Trigger Value output handle)

2. 'customOutput': Holds terminal values or API response objects back to the user.
   Fields:
   - 'outputName' (string): Variable or response field.
   - 'outputType' ('Text' | 'Image' | 'JSON'): Type of output.
   Inputs: 'value' (Value input handle)

3. 'llm': Invokes Gemini models for writing, analysis, summarizing, or classification.
   Fields:
   - 'model' ('gemini-2.5-flash' | 'gemini-2.5-pro'): Model identifier.
   - 'temperature' (number, from 0 to 1): Creativity temperature.
   Inputs:
   - 'system' (System instruction template): Setup text or instructions.
   - 'prompt' (User template): Main text prompt.
   Outputs: 'response' (Generated AI response output handle)

4. 'openaiAgentNode': Creates agent loops executing tools.
   Fields:
   - 'agentEngine' ('gpt-4o' | 'gemini-2.5-pro' | 'claude-3.5-sonnet' | 'llama3-local')
   - 'systemPersona' (string): Custom guidelines.
   - 'toolsSelected' ('Search,Calc' | 'Database,API' | 'All')
   Inputs: 'userQuery' (Input prompt handle)
   Outputs: 'finalResult', 'thoughts'

5. 'databaseNode': Selects, inserts, or requests table rows from Postgres/MySQL databases.
   Fields:
   - 'dialect' ('postgres' | 'mysql' | 'mongodb' | 'supabase')
   - 'queryMode' ('Raw SQL' | 'Query Builder')
   - 'query' (string): Custom SQL string. E.g., INSERT INTO leads ... or SELECT * FROM users ...
   Inputs: 'trigger' (Trigger input handle)
   Outputs: 'rows' (JSON array output handle)

6. 'transformNode': Mutates structure, maps fields, cleans strings, or filters records using JS code.
   Fields:
   - 'transformName' (string): Clean name.
   - 'transformType' ('Map' | 'Filter' | 'Reduce' | 'Custom JS')
   - 'transformCode' (string): Javascript function body.
   - 'outputMode' ('Single Result' | 'Multiple Outputs')
   Inputs: 'data' (Data payload input handle)
   Outputs: 'result' (Result output handle)

7. 'conditionNode': Branches paths into True or False branches.
   Fields:
   - 'property' (string): Key to inspect.
   - 'operator' ('equals' | 'not_equals' | 'contains' | 'greater_than')
   - 'value' (string): Target value.
   Inputs: 'input' (Input handle)
   Outputs:
   - 'truePath' (Match path handle)
   - 'falsePath' (Else path handle)

8. 'csvParserNode': Decodes tabular CSV file data into queryable JSON lists.
   Fields:
   - 'csvDelimiter' (string, e.g., ",")
   Inputs: 'csvString'
   Outputs: 'jsonArray', 'headers'

9. 'mergeNode': Joins or concats two inputs into one.
   Inputs: 'inputA', 'inputB'
   Outputs: 'mergedOutput'

10. 'loopNode': Iterates or batches records one by one.
    Inputs:
    - 'collection': Array of records to loop over.
    - 'loop_continue': Step to feedback back to.
    Outputs:
    - 'loop_item': Single item output handle.
    - 'loop_done': Finish handle.

11. 'text': Text template block with dynamic variables.
    Fields:
    - 'text' (string): Content containing template fields like {{username}}
    Outputs: 'output'

12. 'delayNode': Pauses pipeline execution.
    Fields:
    - 'duration' (number), 'unit' ('Seconds' | 'Minutes')
    Inputs: 'in'
    Outputs: 'out'

13. 'apiNode': Calls rest API endpoints (HTTP POST, GET) to sync external clients.
    Fields:
    - 'method' ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')
    - 'url' (string): API URL
    - 'authType' ('None' | 'Bearer Token' | 'API Key')
    - 'credentials' (string): Saved secrets.
    Inputs: 'trigger'
    Outputs: 'success' (Response JSON), 'error'

14. 'emailNode': Delivers SMTP email notifications.
    Fields:
    - 'to' (string), 'subject' (string), 'body' (string)
    Inputs: 'trigger'
    Outputs: 'sent'

15. 'slackNode': Broadcasts slack message payloads.
    Fields:
    - 'slackChannel' (string), 'slackMessage' (string)
    Inputs: 'trigger'
    Outputs: 'status'

16. 'githubNode': Performs github repo actions like creating issues.
    Fields:
    - 'repo' (string), 'issueTitle' (string)
    Inputs: 'trigger'
    Outputs: 'repoEvent'

GRAPH RULES:
- Graphs must form a Directed Acyclic Graph (DAG) with no cyclic loops.
- Connect outputs (sourceHandle) to inputs (targetHandle). 
- Ensure nodes have a unique 'id' (e.g. 'customInput-1', 'llm-2', 'slackNode-3').
- Position nodes cleanly so that they are staggered (e.g. source nodes on the left with smaller x coordinates, target nodes on the right with larger x coordinates, e.g. spaced out by x spacing of 300px and y spacing of 100px).
- For each node: the 'data' field MUST contain properties:
  - 'id': matching the node's individual id
  - 'nodeType': matching the node's type
  - default fields required by that node type.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    position: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      },
                      required: ["x", "y"]
                    },
                    data: { type: Type.OBJECT }
                  },
                  required: ["id", "type", "data"]
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    sourceHandle: { type: Type.STRING },
                    targetHandle: { type: Type.STRING }
                  },
                  required: ["id", "source", "target", "sourceHandle", "targetHandle"]
                }
              }
            },
            required: ["nodes", "edges"]
          }
        }
      });

      const text = response.text || '';
      const parsedData = JSON.parse(text);
      res.status(200).json(parsedData);
    } catch (err: any) {
      console.error('Workflow generation failure:', err);
      res.status(500).json({ error: `Failed to synthesize workflow: ${err.message}` });
    }
  });

  // Vite middleware integration for asset compilation and serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve build static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom server listening on port ${PORT}`);
  });
}

startServer();
