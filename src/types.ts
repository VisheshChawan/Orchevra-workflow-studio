import { LucideIcon } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'toggle';

export interface FieldOption {
  label: string;
  value: string;
}

export interface NodeField {
  name: string;
  label: string;
  type: FieldType;
  defaultValue?: any;
  options?: FieldOption[]; // for select
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export interface NodeHandleConfig {
  id: string; // e.g., "exec_in", "input_data"
  label?: string;
  type: 'target' | 'source';
  position: 'left' | 'right' | 'top' | 'bottom';
  dataType?: string; // used for future validation / visual hints
}

export interface NodeConfig {
  type: string; // unique node type, e.g., "customInput", "apiNode"
  title: string;
  category: 'Input' | 'Output' | 'Process' | 'Action' | 'Utility' | 'AI' | 'Database' | 'Automation';
  icon: string | LucideIcon; // Can be a string matching our map or the Lucide component itself
  description: string;
  inputs: NodeHandleConfig[];
  outputs: NodeHandleConfig[];
  fields: NodeField[];
  accentColor: string; // e.g., "emerald", "blue", "amber", "rose", "purple", "violet"
  borderColor: string; // e.g., "border-emerald-500/25", "border-blue-500/25", etc.
}
