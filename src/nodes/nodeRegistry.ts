import { 
  Download, 
  Upload, 
  Cpu, 
  FileText, 
  Globe, 
  GitBranch, 
  Database, 
  Mail, 
  Clock,
  RefreshCw,
  Image,
  Sliders,
  GitMerge,
  Radio,
  MessageSquare,
  AlertOctagon,
  Repeat,
  Github,
  Zap,
  BookOpen
} from 'lucide-react';
import { NodeConfig } from '../types';

export const NODE_REGISTRY: Record<string, NodeConfig> = {
  // 1. INPUT CATEGORY
  customInput: {
    type: 'customInput',
    title: 'Manual Trigger Input',
    category: 'Input',
    icon: Download,
    description: 'Start your workflow manually by passing custom payloads or key-value parameters.',
    inputs: [],
    outputs: [
      { id: 'value', type: 'source', position: 'right', label: 'Trigger Value' }
    ],
    accentColor: 'emerald',
    borderColor: 'border-emerald-500/20',
    fields: [
      {
        name: 'inputName',
        label: 'Variable Name',
        type: 'text',
        defaultValue: 'payload_input',
        placeholder: 'e.g., query_term',
        required: true,
      },
      {
        name: 'inputType',
        label: 'Input Data Type',
        type: 'select',
        defaultValue: 'JSON',
        options: [
          { label: 'Structured JSON object', value: 'JSON' },
          { label: 'Plain Text String', value: 'Text' },
          { label: 'Secure Secret Key', value: 'Secret' },
          { label: 'Binary File', value: 'File' }
        ]
      }
    ]
  },

  imageInputNode: {
    type: 'imageInputNode',
    title: 'Image File Input',
    category: 'Input',
    icon: Image,
    description: 'Provide an image URL or load standard test imagery for computer vision or AI scaling.',
    inputs: [],
    outputs: [
      { id: 'imageOut', type: 'source', position: 'right', label: 'Image Output' }
    ],
    accentColor: 'pink',
    borderColor: 'border-pink-500/20',
    fields: [
      {
        name: 'imageUrl',
        label: 'Test Image Resource URL',
        type: 'text',
        defaultValue: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60',
        placeholder: 'https://example.com/asset.jpg',
        required: true,
      },
      {
        name: 'rescale',
        label: 'Autorescale to Canvas Dimensions',
        type: 'select',
        defaultValue: 'Direct',
        options: [
          { label: 'Maintain Original size', value: 'Direct' },
          { label: 'Scale down to 512x512', value: '512x512' },
          { label: 'Scale down to 1024x1024', value: '1024x1024' }
        ]
      }
    ]
  },

  webhookNode: {
    type: 'webhookNode',
    title: 'Webhook Listener',
    category: 'Input',
    icon: Radio,
    description: 'Listen to third party incoming events. Trigger workflow execution whenever a payload hits this URL.',
    inputs: [],
    outputs: [
      { id: 'payload', type: 'source', position: 'right', label: 'Incoming Body' }
    ],
    accentColor: 'cyan',
    borderColor: 'border-cyan-500/20',
    fields: [
      {
        name: 'webhookPath',
        label: 'Webhook Path Path-Suffix',
        type: 'text',
        defaultValue: '/workflows/workflow-live-run/webhook',
        placeholder: 'e.g., /receive-subscribers',
        required: true,
      },
      {
        name: 'responseMode',
        label: 'HTTP Responder Configuration',
        type: 'select',
        defaultValue: 'Immediate',
        options: [
          { label: 'Respond immediately with status 200', value: 'Immediate' },
          { label: 'Wait for downstream chain success', value: 'Downstream' }
        ]
      }
    ]
  },

  cronTriggerNode: {
    type: 'cronTriggerNode',
    title: 'Schedule Interval (Cron)',
    category: 'Input',
    icon: Clock,
    description: 'Trigger executing workflow processes on a set time delay, cycle spacing, or Cron interval.',
    inputs: [],
    outputs: [
      { id: 'scheduled_time', type: 'source', position: 'right', label: 'Tick Time' }
    ],
    accentColor: 'indigo',
    borderColor: 'border-indigo-500/20',
    fields: [
      {
        name: 'cronExpression',
        label: 'Cron Interval Pattern',
        type: 'text',
        defaultValue: '*/5 * * * *',
        placeholder: 'e.g., */15 * * * * (Every 15 mins)',
        required: true,
      },
      {
        name: 'timezone',
        label: 'Reference Timezone Location',
        type: 'select',
        defaultValue: 'UTC',
        options: [
          { label: 'Coordinated Universal Time (UTC)', value: 'UTC' },
          { label: 'America / New York (EST)', value: 'EST' },
          { label: 'Europe / London (BST)', value: 'BST' },
          { label: 'Asia / Tokyo (JST)', value: 'JST' }
        ]
      }
    ]
  },

  // 2. OUTPUT CATEGORY
  customOutput: {
    type: 'customOutput',
    title: 'Response / Output',
    category: 'Output',
    icon: Upload,
    description: 'Capture execution results and formatting states to render as markdown, figures, or base64 files.',
    inputs: [
      { id: 'value', type: 'target', position: 'left', label: 'Value Input' }
    ],
    outputs: [],
    accentColor: 'rose',
    borderColor: 'border-rose-500/20',
    fields: [
      {
        name: 'outputName',
        label: 'Response Header Label',
        type: 'text',
        defaultValue: 'output_json_body',
        placeholder: 'e.g., api_response_body',
        required: true,
      },
      {
        name: 'outputType',
        label: 'Response Target Format',
        type: 'select',
        defaultValue: 'Text',
        options: [
          { label: 'Standard Text Markdown', value: 'Text' },
          { label: 'Rendered Visual Image', value: 'Image' },
          { label: 'JSON Graph Plot', value: 'JSON' }
        ]
      }
    ]
  },

  // 3. AI CATEGORY
  llm: {
    type: 'llm',
    title: 'LLM Node (Gemini)',
    category: 'AI',
    icon: Cpu,
    description: 'Incorporate server-side Google Gemini neural modules inside your workflow context loops.',
    inputs: [
      { id: 'system', type: 'target', position: 'left', label: 'System Instructions' },
      { id: 'prompt', type: 'target', position: 'left', label: 'User Message' }
    ],
    outputs: [
      { id: 'response', type: 'source', position: 'right', label: 'AI Generation' }
    ],
    accentColor: 'purple',
    borderColor: 'border-purple-500/20',
    fields: [
      {
        name: 'model',
        label: 'Neural Model Variant',
        type: 'select',
        defaultValue: 'gemini-2.5-flash',
        options: [
          { label: 'Gemini 2.5 Flash – Speed optimized', value: 'gemini-2.5-flash' },
          { label: 'Gemini 2.5 Pro – Heavy reasoning', value: 'gemini-2.5-pro' }
        ]
      },
      {
        name: 'temperature',
        label: 'Temperature (Creativity)',
        type: 'number',
        defaultValue: 0.7,
        placeholder: '0.0 for factual, 1.0 for creative'
      }
    ]
  },

  openaiAgentNode: {
    type: 'openaiAgentNode',
    title: 'AI ReAct Agent',
    category: 'AI',
    icon: Cpu,
    description: 'Autonomous AI agent powered by GPT/Gemini equipped with standard tools with ReAct execution loops.',
    inputs: [
      { id: 'userQuery', type: 'target', position: 'left', label: 'Query Goal' }
    ],
    outputs: [
      { id: 'finalResult', type: 'source', position: 'right', label: 'Agent Reply' },
      { id: 'thoughts', type: 'source', position: 'right', label: 'ReAct Thoughts' }
    ],
    accentColor: 'purple',
    borderColor: 'border-purple-500/20',
    fields: [
      {
        name: 'agentEngine',
        label: 'Agent LLM Driver Engine',
        type: 'select',
        defaultValue: 'gpt-4o',
        options: [
          { label: 'GPT-4o (OpenAI Premium)', value: 'gpt-4o' },
          { label: 'Gemini 2.5 Pro (Google Intelligence)', value: 'gemini-2.5-pro' },
          { label: 'Claude 3.5 Sonnet (Anthropic)', value: 'claude-3.5-sonnet' },
          { label: 'Llama 3.2 (Ollama Local)', value: 'llama3-local' }
        ]
      },
      {
        name: 'systemPersona',
        label: 'Agent System Guide Prompt',
        type: 'textarea',
        defaultValue: 'You are an autonomous operations coordinator. You have access to database tools and the API. Execute steps sequentially using ReAct loops.',
        placeholder: 'Define how the Agent behaves...'
      },
      {
        name: 'toolsSelected',
        label: 'Enable Tool Kit Integrations',
        type: 'select',
        defaultValue: 'Search,API',
        options: [
          { label: 'Google Search & Calculator', value: 'Search,Calc' },
          { label: 'Database Writer & API Client', value: 'Database,API' },
          { label: 'All Operations Tools', value: 'All' }
        ]
      }
    ]
  },

  // 4. DATABASE CATEGORY
  databaseNode: {
    type: 'databaseNode',
    title: 'Database Sync (Postgres)',
    category: 'Database',
    icon: Database,
    description: 'Perform transactional SQL queries securely. Fully compatible with production Postgres and MySQL.',
    inputs: [
      { id: 'trigger', type: 'target', position: 'left', label: 'Invoke SQL' }
    ],
    outputs: [
      { id: 'rows', type: 'source', position: 'right', label: 'Row Data JSON' }
    ],
    accentColor: 'cyan',
    borderColor: 'border-cyan-500/20',
    fields: [
      {
        name: 'dialect',
        label: 'Database Engine Dialect',
        type: 'select',
        defaultValue: 'postgres',
        options: [
          { label: 'PostgreSQL - Relational', value: 'postgres' },
          { label: 'MySQL - Scale-out server', value: 'mysql' },
          { label: 'MongoDB - Document storage', value: 'mongodb' },
          { label: 'Supabase - BaaS Client', value: 'supabase' }
        ]
      },
      {
        name: 'host',
        label: 'Database Server Instance Host',
        type: 'text',
        defaultValue: 'db.shared-cluster.supabase.co',
        placeholder: 'e.g. localhost, neon.tech, aws RDS'
      },
      {
        name: 'dbUser',
        label: 'Authenticated Username',
        type: 'text',
        defaultValue: 'api_admin_user',
        placeholder: 'e.g. postgres'
      },
      {
        name: 'queryMode',
        label: 'Query Dialect Method',
        type: 'select',
        defaultValue: 'Raw SQL',
        options: [
          { label: 'Raw Structured SQL Statement', value: 'Raw SQL' },
          { label: 'Auto Query Builder (Visual GUI)', value: 'Query Builder' }
        ]
      },
      {
        name: 'query',
        label: 'SQL / Dialect Command',
        type: 'textarea',
        defaultValue: 'SELECT id, email, signup_score FROM customer_leads WHERE signup_score >= 80 LIMIT 10;',
        placeholder: 'Write database queries...'
      }
    ]
  },

  // 5. PROCESS CATEGORY
  transformNode: {
    type: 'transformNode',
    title: 'JS Code Transform',
    category: 'Process',
    icon: RefreshCw,
    description: 'Perform powerful transformations on JSON arrays, map/filter, sort objects, or execute custom JavaScript.',
    inputs: [
      { id: 'data', type: 'target', position: 'left', label: 'Payload In' }
    ],
    outputs: [
      { id: 'result', type: 'source', position: 'right', label: 'Output Body' }
    ],
    accentColor: 'amber',
    borderColor: 'border-amber-500/20',
    fields: [
      {
        name: 'transformName',
        label: 'Operational Step Alias',
        type: 'text',
        defaultValue: 'data_sanitizer',
        required: true,
      },
      {
        name: 'transformType',
        label: 'Transform Code Pattern',
        type: 'select',
        defaultValue: 'Map',
        options: [
          { label: 'Map Array Structures', value: 'Map' },
          { label: 'Filter Query Elements', value: 'Filter' },
          { label: 'Reduce Array Values', value: 'Reduce' },
          { label: 'Flatten & Merge Objects', value: 'Flatten' },
          { label: 'Custom JS Expression Script', value: 'Custom JS' }
        ]
      },
      {
        name: 'transformCode',
        label: 'Transform Logic Script',
        type: 'textarea',
        defaultValue: '// Input argument is "data"\nreturn data.map(item => ({\n  id: item.uid || item.id,\n  status: "processed",\n  timestamp: Date.now()\n}));',
        placeholder: 'e.g., return data.filter(x => x.score > 50)'
      },
      {
        name: 'outputMode',
        label: 'Output Port Configuration',
        type: 'select',
        defaultValue: 'Single Result',
        options: [
          { label: 'Single Result Body', value: 'Single Result' },
          { label: 'Success / Error Branches', value: 'Success / Error' },
          { label: 'Conditional Branching Ports', value: 'Conditional Branching' },
          { label: 'Multiple Port Splitting', value: 'Multiple Outputs' },
          { label: 'Custom Named Output Ports', value: 'Custom Outputs' }
        ]
      }
    ]
  },

  conditionNode: {
    type: 'conditionNode',
    title: 'If-Else Condition Split',
    category: 'Process',
    icon: GitBranch,
    description: 'Compare properties against values to direct the flow of your workflow.',
    inputs: [
      { id: 'input', type: 'target', position: 'left', label: 'Evaluate In' }
    ],
    outputs: [
      { id: 'truePath', type: 'source', position: 'right', label: 'True / Match' },
      { id: 'falsePath', type: 'source', position: 'right', label: 'False / Else' }
    ],
    accentColor: 'amber',
    borderColor: 'border-amber-500/20',
    fields: [
      {
        name: 'property',
        label: 'Payload Field to Check',
        type: 'text',
        defaultValue: 'http_response_code',
        required: true,
      },
      {
        name: 'operator',
        label: 'Operator',
        type: 'select',
        defaultValue: 'equals',
        options: [
          { label: 'Equals (Strict match)', value: 'equals' },
          { label: 'Not Equals (Inequality)', value: 'not_equals' },
          { label: 'Contains Substring', value: 'contains' },
          { label: 'Greater Than (Numeric)', value: 'greater_than' }
        ]
      },
      {
        name: 'value',
        label: 'Target Comparison Value',
        type: 'text',
        defaultValue: '200',
        placeholder: 'value to match'
      }
    ]
  },

  csvParserNode: {
    type: 'csvParserNode',
    title: 'CSV Data Parser',
    category: 'Process',
    icon: Sliders,
    description: 'Transform string-formatted CSV payloads into cleaner, structures array objects.',
    inputs: [
      { id: 'csvString', type: 'target', position: 'left', label: 'CSV String' }
    ],
    outputs: [
      { id: 'jsonArray', type: 'source', position: 'right', label: 'Row Objects' },
      { id: 'headers', type: 'source', position: 'right', label: 'Header Names' }
    ],
    accentColor: 'emerald',
    borderColor: 'border-emerald-500/20',
    fields: [
      {
        name: 'csvDelimiter',
        label: 'CSV Separation Delimiter',
        type: 'text',
        defaultValue: ',',
        placeholder: '; or ,',
        required: true,
      },
      {
        name: 'strictHeaders',
        label: 'Verify Uniform Row Counts',
        type: 'select',
        defaultValue: 'No',
        options: [
          { label: 'Ignore anomalies', value: 'No' },
          { label: 'Throw error on mismatch', value: 'Yes' }
        ]
      }
    ]
  },

  mergeNode: {
    type: 'mergeNode',
    title: 'Multi-Stream Merge',
    category: 'Process',
    icon: GitMerge,
    description: 'Join two incoming paths of data using joins, overrides, or custom aggregations.',
    inputs: [
      { id: 'inputA', type: 'target', position: 'left', label: 'Stream A' },
      { id: 'inputB', type: 'target', position: 'left', label: 'Stream B' }
    ],
    outputs: [
      { id: 'mergedOutput', type: 'source', position: 'right', label: 'Combined' }
    ],
    accentColor: 'indigo',
    borderColor: 'border-indigo-500/20',
    fields: [
      {
        name: 'joinStrategy',
        label: 'Merging / Overwrite Strategy',
        type: 'select',
        defaultValue: 'Concat',
        options: [
          { label: 'Concat (Merge as structural array)', value: 'Concat' },
          { label: 'Join Items on Matching ID Column', value: 'Join' },
          { label: 'Assign Stream B keys over Stream A', value: 'Assign' }
        ]
      },
      {
        name: 'joinKey',
        label: 'Join ID Column Key (Optional)',
        type: 'text',
        defaultValue: 'id',
        placeholder: 'e.g. user_id'
      }
    ]
  },

  loopNode: {
    type: 'loopNode',
    title: 'Loop (For Each batch)',
    category: 'Process',
    icon: Repeat,
    description: 'Repeat Downstream execution paths. Processes rows sequentially or in parallel batches.',
    inputs: [
      { id: 'collection', type: 'target', position: 'left', label: 'Array Items' },
      { id: 'loop_continue', type: 'target', position: 'top', label: 'Next Item' }
    ],
    outputs: [
      { id: 'loop_item', type: 'source', position: 'right', label: 'Selected Row' },
      { id: 'loop_done', type: 'source', position: 'bottom', label: 'All Items Finished' }
    ],
    accentColor: 'amber',
    borderColor: 'border-amber-500/20',
    fields: [
      {
        name: 'batchSize',
        label: 'Parallel Batch Cluster Limit',
        type: 'number',
        defaultValue: 5,
        required: true,
      },
      {
        name: 'failBehavior',
        label: 'Error Action in Batches',
        type: 'select',
        defaultValue: 'halt',
        options: [
          { label: 'Halt all downstream steps', value: 'halt' },
          { label: 'Skip error row and continue', value: 'skip' }
        ]
      }
    ]
  },

  // 6. UTILITY CATEGORY
  text: {
    type: 'text',
    title: 'Text Prompt Template',
    category: 'Utility',
    icon: FileText,
    description: 'Define prompt templates. Placing {{variable_name}} automatically instantiates target ports.',
    inputs: [],
    outputs: [
      { id: 'output', type: 'source', position: 'right', label: 'Constructed String' }
    ],
    accentColor: 'blue',
    borderColor: 'border-blue-500/20',
    fields: [
      {
        name: 'text',
        label: 'Dynamic Prompt Composition',
        type: 'textarea',
        defaultValue: 'Greetings {{lead_name}},\nWe categorized you score: {{score}}. Start processing step: {{processing_step}}.',
        placeholder: 'Template prompt here...'
      }
    ]
  },

  delayNode: {
    type: 'delayNode',
    title: 'Seconds Cron Timer',
    category: 'Utility',
    icon: Clock,
    description: 'Introduces delay buffers inside transactional sequences.',
    inputs: [
      { id: 'in', type: 'target', position: 'left', label: 'Delay In' }
    ],
    outputs: [
      { id: 'out', type: 'source', position: 'right', label: 'Timer Done' }
    ],
    accentColor: 'pink',
    borderColor: 'border-pink-500/20',
    fields: [
      {
        name: 'duration',
        label: 'Delay Buffer Number',
        type: 'number',
        defaultValue: 5,
        required: true,
      },
      {
        name: 'unit',
        label: 'Time Frame Dimensions',
        type: 'select',
        defaultValue: 'Seconds',
        options: [
          { label: 'Seconds (Real-time)', value: 'Seconds' },
          { label: 'Minutes (Standard scheduled)', value: 'Minutes' }
        ]
      }
    ]
  },

  errorNode: {
    type: 'errorNode',
    title: 'Error Retry Guard',
    category: 'Utility',
    icon: AlertOctagon,
    description: 'Declare error handling policies. Define retries and exponentially back off errors.',
    inputs: [
      { id: 'sourceStep', type: 'target', position: 'left', label: 'Process Steps' }
    ],
    outputs: [
      { id: 'onSuccess', type: 'source', position: 'right', label: 'On Success' },
      { id: 'onFailure', type: 'source', position: 'right', label: 'On Fatal Fail' }
    ],
    accentColor: 'rose',
    borderColor: 'border-rose-500/20',
    fields: [
      {
        name: 'attempts',
        label: 'Maximum Retry Threshold',
        type: 'number',
        defaultValue: 3,
        required: true,
      },
      {
        name: 'delaySec',
        label: 'Initial Timeout Delay (Seconds)',
        type: 'number',
        defaultValue: 2,
        required: true,
      },
      {
        name: 'exponential',
        label: 'Exponential Delay Factor Multiplication',
        type: 'toggle',
        defaultValue: true,
      }
    ]
  },

  // 7. AUTOMATION CATEGORY
  apiNode: {
    type: 'apiNode',
    title: 'Universal HTTP API Request',
    category: 'Automation',
    icon: Globe,
    description: 'Invoke REST queries (GET/POST/PUT/DELETE) targeting external gateways.',
    inputs: [
      { id: 'trigger', type: 'target', position: 'left', label: 'Invoke API' }
    ],
    outputs: [
      { id: 'success', type: 'source', position: 'right', label: 'Body JSON' },
      { id: 'error', type: 'source', position: 'right', label: 'Error' }
    ],
    accentColor: 'indigo',
    borderColor: 'border-indigo-500/20',
    fields: [
      {
        name: 'method',
        label: 'HTTP Connection Verb',
        type: 'select',
        defaultValue: 'POST',
        options: [
          { label: 'GET (Fetch data)', value: 'GET' },
          { label: 'POST (Submit body payload)', value: 'POST' },
          { label: 'PUT (Mutate DB rows)', value: 'PUT' },
          { label: 'PATCH (Partial edit)', value: 'PATCH' },
          { label: 'DELETE (Clean entry)', value: 'DELETE' }
        ]
      },
      {
        name: 'url',
        label: 'REST URL Target Gateway',
        type: 'text',
        defaultValue: 'https://api.example.com/v1/leads-ingestion',
        required: true,
      },
      {
        name: 'authType',
        label: 'Authentication Strategy',
        type: 'select',
        defaultValue: 'Bearer Token',
        options: [
          { label: 'No Authentication', value: 'None' },
          { label: 'Bearer Token Header', value: 'Bearer Token' },
          { label: 'Query Parameter Simple Key', value: 'API Key' },
          { label: 'Basic Username / Pass', value: 'Basic Auth' }
        ]
      },
      {
        name: 'credentials',
        label: 'Secret Access Token / Password',
        type: 'text',
        defaultValue: 'api_workflow_token_sandbox',
        placeholder: 'Credentials...'
      },
      {
        name: 'bodyType',
        label: 'Body Content Enctype Format',
        type: 'select',
        defaultValue: 'JSON',
        options: [
          { label: 'application/json Payload', value: 'JSON' },
          { label: 'form-urlencoded keys', value: 'Form Data' },
          { label: 'Raw text block', value: 'Raw' }
        ]
      },
      {
        name: 'headers',
        label: 'Manual HTTP Headers overrides',
        type: 'textarea',
        defaultValue: 'Accept: application/json\nX-Company-Workflow: True',
        placeholder: 'header: value (one per line)'
      }
    ]
  },

  emailNode: {
    type: 'emailNode',
    title: 'Gmail / SMTP Dispatcher',
    category: 'Automation',
    icon: Mail,
    description: 'Dispatch newsletter campaigns, alerts, or lead email summaries automatically.',
    inputs: [
      { id: 'trigger', type: 'target', position: 'left', label: 'Send Mail' }
    ],
    outputs: [
      { id: 'sent', type: 'source', position: 'right', label: 'Delivered' }
    ],
    accentColor: 'violet',
    borderColor: 'border-violet-500/20',
    fields: [
      {
        name: 'to',
        label: 'Recipient List (Comma spaced emails)',
        type: 'text',
        defaultValue: 'ops-team@company.com',
        required: true,
      },
      {
        name: 'subject',
        label: 'Email Subject Header',
        type: 'text',
        defaultValue: '⚙️ Pipeline Alert: High-priority lead generated!',
        required: true,
      },
      {
        name: 'body',
        label: 'Body Message Compose',
        type: 'textarea',
        defaultValue: 'Greetings Operation Team,\n\nOur pipeline found a lead matching your criteria: {{lead_email}}.\nHave an incredible day.',
        placeholder: 'Your SMTP mail body text...'
      }
    ]
  },

  slackNode: {
    type: 'slackNode',
    title: 'Slack Automation Message',
    category: 'Automation',
    icon: MessageSquare,
    description: 'Send fully formatted alert messages, charts, or alerts to active Slack or Discord channels.',
    inputs: [
      { id: 'trigger', type: 'target', position: 'left', label: 'Post' }
    ],
    outputs: [
      { id: 'status', type: 'source', position: 'right', label: 'Send Success' }
    ],
    accentColor: 'pink',
    borderColor: 'border-pink-500/20',
    fields: [
      {
        name: 'slackChannel',
        label: 'Target Slack channel',
        type: 'text',
        defaultValue: '#engineering-leads-pipeline',
        required: true,
      },
      {
        name: 'slackMessage',
        label: 'Slack Message Message composing',
        type: 'textarea',
        defaultValue: ':white_check_mark: *Pipeline Run Success*: Lead `{{id}}` parsed with score `{{score}}` is promoted to CRM!',
        placeholder: 'Message logs...'
      }
    ]
  },

  switchNode: {
    type: 'switchNode',
    title: 'Switch Router (Match Case)',
    category: 'Process',
    icon: GitBranch,
    description: 'Direct logic matching distinct string/number case arguments along dedicated output paths.',
    inputs: [
      { id: 'input_val', type: 'target', position: 'left', label: 'Evaluation Payload' }
    ],
    outputs: [
      { id: 'case_a', type: 'source', position: 'right', label: 'Case A Path' },
      { id: 'case_b', type: 'source', position: 'right', label: 'Case B Path' },
      { id: 'case_default', type: 'source', position: 'right', label: 'Default Path' }
    ],
    accentColor: 'indigo',
    borderColor: 'border-indigo-500/20',
    fields: [
      {
        name: 'switchKey',
        label: 'Switch Field Key',
        type: 'text',
        defaultValue: 'status',
        placeholder: 'e.g., plan_tier',
        required: true,
      },
      {
        name: 'caseAVal',
        label: 'Case A Match String',
        type: 'text',
        defaultValue: 'premium',
      },
      {
        name: 'caseBVal',
        label: 'Case B Match String',
        type: 'text',
        defaultValue: 'enterprise',
      }
    ]
  },

  humanApprovalNode: {
    type: 'humanApprovalNode',
    title: 'Human In-Loop Gate',
    category: 'Process',
    icon: Sliders,
    description: 'Suspend active pipeline progression until an admin manually verifies and clicks approval.',
    inputs: [
      { id: 'trigger', type: 'target', position: 'left', label: 'Incoming Payload' }
    ],
    outputs: [
      { id: 'approved', type: 'source', position: 'right', label: 'Approved Path' },
      { id: 'rejected', type: 'source', position: 'right', label: 'Rejected Path' }
    ],
    accentColor: 'amber',
    borderColor: 'border-amber-500/20',
    fields: [
      {
        name: 'approvalTitle',
        label: 'Request Summary Title',
        type: 'text',
        defaultValue: 'Verify transaction payload values before releasing payments',
      },
      {
        name: 'autoRejectHours',
        label: 'Auto-Reject Timeout (Hours)',
        type: 'number',
        defaultValue: 24,
      }
    ]
  },

  githubNode: {
    type: 'githubNode',
    title: 'GitHub Operations Node',
    category: 'Automation',
    icon: Github,
    description: 'Create repository issues, trigger workflow dispatches, or manage repository tags and branch triggers.',
    inputs: [
      { id: 'trigger', type: 'target', position: 'left', label: 'Trigger GitHub' }
    ],
    outputs: [
      { id: 'repoEvent', type: 'source', position: 'right', label: 'Webhook Data' }
    ],
    accentColor: 'violet',
    borderColor: 'border-violet-500/20',
    fields: [
      {
        name: 'repo',
        label: 'Target Repository Owner/Repo',
        type: 'text',
        defaultValue: 'orchevra/workflow-studio',
        required: true,
      },
      {
        name: 'actionType',
        label: 'GitHub Operation Action',
        type: 'select',
        defaultValue: 'Create Issue',
        options: [
          { label: 'Create Repository Issue', value: 'Create Issue' },
          { label: 'Dispatch Workflow Run', value: 'Dispatch Run' },
          { label: 'Submit Pull Request', value: 'Submit PR' }
        ]
      },
      {
        name: 'issueTitle',
        label: 'Issues Header Name',
        type: 'text',
        defaultValue: 'Critical Operations Alert: Pipeline Failure Check',
        placeholder: 'Alert header...'
      }
    ]
  }
};
