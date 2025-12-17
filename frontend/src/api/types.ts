export interface FormField {
  id: string;
  label: string;
  type: string;
}

export interface FormNode {
  id: string;
  name: string;
  fields: FormField[];
}

export interface Edge {
  from: string;
  to: string;
}

export interface ActionBlueprintGraph {
  forms: FormNode[];
  edges: Edge[];
}

export type PrefillSourceType = "formField" | "global";

export interface PrefillSource {
  type: PrefillSourceType;
  label: string;
  formId?: string;
  fieldId?: string;
}

export type PrefillMapping = Record<string, PrefillSource>;

export type PrefillState = Record<string, PrefillMapping>;

// Raw schema from action-blueprint-graph-get
export interface RawNode {
  id: string;
  type: string;
  data: {
    name: string;
    component_id: string;
    prerequisites: string[];
  };
}

export interface RawEdge {
  source: string;
  target: string;
}

export interface RawFieldSchemaProperty {
  title?: string;
  avantos_type?: string;
  type?: string | string[];
}

export interface RawFormDefinition {
  id: string;
  name: string;
  field_schema?: {
    properties?: Record<string, RawFieldSchemaProperty>;
  };
}

export interface RawActionBlueprintGraph {
  nodes: RawNode[];
  edges: RawEdge[];
  forms: RawFormDefinition[];
}
