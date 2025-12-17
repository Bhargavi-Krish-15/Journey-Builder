import { useEffect, useState } from "react";
import "./App.css";
import { fetchActionBlueprintGraph } from "./api/graph";
import { transformGraph } from "./api/transform";
import type { ActionBlueprintGraph, PrefillState } from "./api/types";

type LoadState = "idle" | "loading" | "success" | "error";
type SourceFieldOption = { id: string; label: string };
type SourceFormOption = { id: string; name: string; fields: SourceFieldOption[] };
type OptionGroup = { label: string; forms: SourceFormOption[] };
type SelectedSource =
  | { kind: "form"; formId: string; fieldId?: string; label: string }
  | { kind: "global"; label: string };

const defaultPrefillState: PrefillState = {
  // Example: Form D (form-0f...) email is prefilled from Form A (form-47...) email
  "form-0f58384c-4966-4ce6-9ec2-40b96d61f745": {
    email: {
      type: "formField",
      formId: "form-47c61d17-62b0-4c42-8ca2-0eff641c9d88",
      fieldId: "email",
      label: "Form A.email"
    }
  }
};

const globalSourceOptions: OptionGroup["forms"] = [
  {
    id: "global_action_properties",
    name: "Action Properties",
    fields: [
      { id: "action_type", label: "Action Type" },
      { id: "priority", label: "Priority" },
      { id: "due_date", label: "Due Date" }
    ]
  },
  {
    id: "global_client_org",
    name: "Client Organization Properties",
    fields: [
      { id: "org_name", label: "Org Name" },
      { id: "account_tier", label: "Account Tier" }
    ]
  }
];

const buildSourceGroups = (
  graph: ActionBlueprintGraph | null,
  selectedFormId: string | null
): OptionGroup[] => {
  const emptyGroups: OptionGroup[] = [
    { label: "Direct dependencies", forms: [] },
    { label: "Transitive dependencies", forms: [] },
    { label: "Global data", forms: globalSourceOptions }
  ];

  if (!graph || !selectedFormId) return emptyGroups;

  const formMap = new Map(graph.forms.map((form) => [form.id, form]));
  const directIds = new Set(
    graph.edges.filter((edge) => edge.to === selectedFormId).map((edge) => edge.from)
  );

  const upstreamVisited = new Set<string>();
  const traverseUpstream = (formId: string) => {
    graph.edges
      .filter((edge) => edge.to === formId)
      .forEach((edge) => {
        if (!upstreamVisited.has(edge.from)) {
          upstreamVisited.add(edge.from);
          traverseUpstream(edge.from);
        }
      });
  };
  traverseUpstream(selectedFormId);

  const transitiveIds = new Set<string>(
    [...upstreamVisited].filter((id) => !directIds.has(id))
  );

  const toEntry = (id: string) => {
    const form = formMap.get(id);
    if (!form) return null;
    return {
      id: form.id,
      name: form.name,
      fields: form.fields.map((field) => ({
        id: field.id,
        label: field.label ?? field.id
      }))
    };
  };

  const directForms = [...directIds].map(toEntry).filter(Boolean) as OptionGroup["forms"];
  const transitiveForms = [...transitiveIds]
    .map(toEntry)
    .filter(Boolean) as OptionGroup["forms"];

  return [
    { label: "Direct dependencies", forms: directForms },
    { label: "Transitive dependencies", forms: transitiveForms },
    { label: "Global data", forms: globalSourceOptions }
  ];
};

function App() {
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<ActionBlueprintGraph | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [prefillState, setPrefillState] = useState<PrefillState>(defaultPrefillState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);

  const selectedForm =
    graph?.forms.find((form) => form.id === selectedFormId) ?? null;
  const selectedPrefill = selectedFormId ? prefillState[selectedFormId] ?? {} : {};
  const activeField =
    selectedForm?.fields.find((field) => field.id === activeFieldId) ?? null;
  const groupedSources: OptionGroup[] = buildSourceGroups(graph, selectedFormId);

  useEffect(() => {
    const loadGraph = async () => {
      setStatus("loading");
      try {
        const payload = await fetchActionBlueprintGraph();
        const normalized = transformGraph(payload);
        console.log("Fetched action blueprint graph:", payload);
        console.log("Normalized graph:", normalized);
        setGraph(normalized);
        setSelectedFormId((prev) => prev ?? normalized.forms[0]?.id ?? null);
        setStatus("success");
      } catch (err) {
        console.error("Failed to load graph", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    };

    loadGraph();
  }, []);

  return (
    <main className="app-shell">
      <h1>Journey Builder Prefill</h1>
      <div className="status">
        <span className="label">Status:</span>
        <span data-status={status}>{status}</span>
        {error && <span className="error">({error})</span>}
      </div>

      <section aria-label="Forms list">
        <h2>Forms</h2>
        <p className="muted">Click a form to select it.</p>
        <div className="selected-banner">
          <span className="label">Selected:</span>
          <span className="selected-value">
            {graph?.forms && selectedFormId
              ? graph.forms.find((f) => f.id === selectedFormId)?.name ?? "Unknown form"
              : "None"}
          </span>
        </div>
        {status === "loading" && <p className="muted">Loading forms…</p>}
        {status === "error" && <p className="error">Unable to load forms.</p>}
        {status === "success" && graph?.forms?.length === 0 && (
          <p className="muted">No forms available.</p>
        )}
        {graph?.forms?.length ? (
          <ul className="forms">
            {graph.forms.map((form) => (
              <li
                key={form.id}
                className={`form-card ${selectedFormId === form.id ? "selected" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedFormId(form.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedFormId(form.id);
                  }
                }}
              >
                <header>
                  <span className="form-name">{form.name}</span>
                  <span className="form-id">({form.id})</span>
                </header>
                <div className="fields">
                  <span className="field-count">{form.fields.length} fields</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-label="Fields list">
        <h2>Fields</h2>
        {!selectedForm && <p className="muted">Select a form to view its fields.</p>}
        {selectedForm && (
          <>
            <p className="muted">
              Showing fields for <strong>{selectedForm.name}</strong>. Mapping state shown per
              field.
            </p>
            <ul className="fields-list">
              {selectedForm.fields.map((field) => (
                <li key={field.id} className="field-card">
                  <div>
                    <div className="field-name">{field.label}</div>
                    <div className="field-meta">
                      <span className="pill pill-id">{field.id}</span>
                      <span className="pill">{field.type}</span>
                    </div>
                  </div>
                  <div className="field-actions">
                    {selectedPrefill[field.id] ? (
                      <>
                        <span className="pill pill-mapped">
                          Prefilled from {selectedPrefill[field.id].label}
                        </span>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            setPrefillState((prev) => {
                              const next = { ...prev };
                              const formMapping = { ...(next[selectedFormId ?? ""] ?? {}) };
                              delete formMapping[field.id];
                              next[selectedFormId ?? ""] = formMapping;
                              return next;
                            });
                          }}
                        >
                          Clear
                        </button>
                      </>
                    ) : (
                      <span className="pill pill-empty">No mapping</span>
                    )}
                    <button
                      className="ghost-button"
                      onClick={() => {
                        setActiveFieldId(field.id);
                        setSelectedSource(null);
                        setIsModalOpen(true);
                      }}
                    >
                      {selectedPrefill[field.id] ? "Edit mapping" : "Add mapping"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {isModalOpen && activeField && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            setIsModalOpen(false);
            setActiveFieldId(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Select data element to map"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h3>Select data element to map</h3>
                <p className="muted">
                  Field: <strong>{activeField.label}</strong> ({activeField.id})
                </p>
              </div>
              <button
                className="ghost-button"
                onClick={() => {
                  setIsModalOpen(false);
                  setActiveFieldId(null);
                }}
              >
                Close
              </button>
            </header>

            <div className="modal-body">
              <p className="muted">
                Available sources grouped by relationship to the selected form.
              </p>
              {selectedSource && (
                <div className="pill pill-selected">
                  Selected source: {selectedSource.label}
                </div>
              )}
              <div className="source-groups">
                {groupedSources.map((group) => (
                  <div key={group.label} className="source-group">
                    <div className="source-group-header">{group.label}</div>
                    {group.forms.length === 0 ? (
                      <div className="muted small">No sources in this group.</div>
                    ) : (
                      <ul className="source-list">
                        {group.forms.map((form) => (
                          <li key={form.id} className="source-item">
                            <div className="source-name">{form.name}</div>
                            <div className="muted small">
                              {form.fields.length} field{form.fields.length === 1 ? "" : "s"}
                            </div>
                            <div className="source-fields">
                              {form.fields.length === 0 ? (
                                <span className="muted small">No fields available</span>
                              ) : (
                                form.fields.map((field) => {
                                  const isSelected =
                                    (selectedSource?.kind === "form" &&
                                      selectedSource.formId === form.id &&
                                      selectedSource.fieldId === field.id) ||
                                    (group.label === "Global data" &&
                                      selectedSource?.kind === "global" &&
                                      selectedSource.label === `${form.name}.${field.id}`);
                                  return (
                                    <button
                                      key={`${form.id}-${field.id}`}
                                      className={`chip ${isSelected ? "chip-selected" : ""}`}
                                      onClick={() =>
                                        setSelectedSource(
                                          group.label === "Global data"
                                            ? {
                                                kind: "global",
                                                label: `${form.name}.${field.id}`
                                              }
                                            : {
                                                kind: "form",
                                                formId: form.id,
                                                fieldId: field.id,
                                                label: `${form.name}.${field.id}`
                                              }
                                        )
                                      }
                                    >
                                      <span className="chip-label">{field.label}</span>
                                      <span className="chip-sub">({field.id})</span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <footer className="modal-footer">
              <button
                className="ghost-button"
                onClick={() => {
                  setIsModalOpen(false);
                  setActiveFieldId(null);
                  setSelectedSource(null);
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={!selectedSource || !selectedFormId || !activeFieldId}
                onClick={() => {
                  if (!selectedSource || !selectedFormId || !activeFieldId) return;

                  setPrefillState((prev) => {
                    const next = { ...prev };
                    const currentFormMapping = { ...(next[selectedFormId] ?? {}) };

                    if (selectedSource.kind === "form") {
                      currentFormMapping[activeFieldId] = {
                        type: "formField",
                        formId: selectedSource.formId,
                        fieldId: selectedSource.fieldId,
                        label: selectedSource.label
                      };
                    } else {
                      currentFormMapping[activeFieldId] = {
                        type: "global",
                        label: selectedSource.label
                      };
                    }

                    next[selectedFormId] = currentFormMapping;
                    return next;
                  });

                  setIsModalOpen(false);
                  setActiveFieldId(null);
                  setSelectedSource(null);
                }}
              >
                Select
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
