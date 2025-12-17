import type {
  ActionBlueprintGraph,
  Edge,
  FormField,
  FormNode,
  RawActionBlueprintGraph
} from "./types";

const normalizeFieldType = (value: { avantos_type?: string; type?: string | string[] }) => {
  if (!value) return "unknown";
  if (value.avantos_type) return value.avantos_type;
  if (Array.isArray(value.type)) return value.type.join("|");
  return value.type ?? "unknown";
};

const fromRawSchema = (raw: RawActionBlueprintGraph): ActionBlueprintGraph => {
  const formDefinitions = new Map(raw.forms.map((form) => [form.id, form]));

  const forms: FormNode[] = (raw.nodes ?? []).map((node) => {
    const formDef = formDefinitions.get(node.data.component_id);
    const properties = formDef?.field_schema?.properties ?? {};

    const fields: FormField[] = Object.entries(properties).map(([key, value]) => ({
      id: key,
      label: value.title ?? key,
      type: normalizeFieldType(value)
    }));

    return {
      id: node.id,
      name: node.data.name,
      fields
    };
  });

  const edges: Edge[] = (raw.edges ?? []).map((edge) => ({
    from: edge.source,
    to: edge.target
  }));

  return { forms, edges };
};

const fromLegacyShape = (raw: any): ActionBlueprintGraph => {
  const forms: FormNode[] = (raw.forms ?? []).map((form: any) => ({
    id: form.id,
    name: form.name,
    fields: (form.fields ?? []).map((field: any) => ({
      id: field.id,
      label: field.label ?? field.id,
      type: field.type ?? "unknown"
    }))
  }));

  const edges: Edge[] = (raw.edges ?? []).map((edge: any) => ({
    from: edge.from ?? edge.source,
    to: edge.to ?? edge.target
  }));

  return { forms, edges };
};

/**
 * Transforms incoming graph JSON (new or legacy shape) into UI-friendly form.
 */
export const transformGraph = (raw: any): ActionBlueprintGraph => {
  if (raw && Array.isArray(raw.nodes) && Array.isArray(raw.forms)) {
    return fromRawSchema(raw as RawActionBlueprintGraph);
  }
  return fromLegacyShape(raw);
};
