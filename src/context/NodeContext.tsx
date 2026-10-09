import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StrixNode, NodeLevel, NodeContent } from "../types";

const STORAGE_KEY = "strix:nodes:v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AddNodeInput {
  parentId: string | null;
  level: NodeLevel;
  title: string;
  icon?: string;
  description?: string;
  content?: NodeContent;
}

interface NodeContextValue {
  nodes: StrixNode[];
  loading: boolean;
  addNode: (input: AddNodeInput) => StrixNode;
  updateNode: (id: string, patch: Partial<StrixNode>) => void;
  deleteNode: (id: string) => void;
  reorderChildren: (parentId: string | null, orderedIds: string[]) => void;
  getChildren: (parentId: string | null) => StrixNode[];
  getNode: (id: string) => StrixNode | undefined;
  getPath: (id: string) => StrixNode[]; // root -> node, for breadcrumbs
  recentNodes: (limit?: number) => StrixNode[];
}

const NodeContext = createContext<NodeContextValue | null>(null);

export function NodeProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<StrixNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Load once on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setNodes(normalizeSortOrder(JSON.parse(raw)));
        else setNodes(seedData());
      } catch {
        // Fixed message only: JSON parse errors can embed a fragment of the
        // note text, which must never reach console output.
        console.warn("STRIX: could not load saved notes — starting fresh");
        setNodes(seedData());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)).catch(() =>
      console.warn("STRIX: failed to save notes")
    );
  }, [nodes, loading]);

  const value = useMemo<NodeContextValue>(() => {
    const getNode = (id: string) => nodes.find((n) => n.id === id);

    const getChildren = (parentId: string | null) =>
      nodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => {
          const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
          return aOrder === bOrder ? a.title.localeCompare(b.title) : aOrder - bOrder;
        });

    const getPath = (id: string) => {
      const path: StrixNode[] = [];
      let current = getNode(id);
      while (current) {
        path.unshift(current);
        current = current.parentId ? getNode(current.parentId) : undefined;
      }
      return path;
    };

    const addNode = (input: AddNodeInput) => {
      const now = Date.now();
      const node: StrixNode = {
        id: uid(),
        parentId: input.parentId,
        level: input.level,
        title: input.title.trim(),
        icon: input.icon,
        description: input.description?.trim() || undefined,
        content: input.content,
        sortOrder: nodes.filter((item) => item.parentId === input.parentId).length,
        createdAt: now,
        updatedAt: now,
      };
      setNodes((prev) => [...prev, node]);
      return node;
    };

    const updateNode = (id: string, patch: Partial<StrixNode>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
        )
      );
    };

    // Deletes a node and (recursively) everything beneath it.
    const deleteNode = (id: string) => {
      setNodes((prev) => {
        const toDelete = new Set<string>([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const n of prev) {
            if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
              toDelete.add(n.id);
              changed = true;
            }
          }
        }
        return prev.filter((n) => !toDelete.has(n.id));
      });
    };

    const reorderChildren = (parentId: string | null, orderedIds: string[]) => {
      const order = new Map(orderedIds.map((id, index) => [id, index]));
      setNodes((previous) => previous.map((node) =>
        node.parentId === parentId && order.has(node.id)
          ? { ...node, sortOrder: order.get(node.id), updatedAt: Date.now() }
          : node
      ));
    };

    const recentNodes = (limit = 5) =>
      [...nodes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);

    return {
      nodes,
      loading,
      addNode,
      updateNode,
      deleteNode,
      reorderChildren,
      getChildren,
      getNode,
      getPath,
      recentNodes,
    };
  }, [nodes, loading]);

  return (
    <NodeContext.Provider value={value}>{children}</NodeContext.Provider>
  );
}

export function useNodes() {
  const ctx = useContext(NodeContext);
  if (!ctx) throw new Error("useNodes must be used within a NodeProvider");
  return ctx;
}

// A few starter Fields so the app isn't empty on first launch —
// matches the examples shown in the mockups (Tech, Food, Schedule, etc).
function seedData(): StrixNode[] {
  const now = Date.now();
  const fields = ["Tech", "Food", "Schedule", "Health", "School", "Career", "Personal"];
  return fields.map((title, i) => ({
    id: uid(),
    parentId: null,
    level: "field" as NodeLevel,
    title,
    createdAt: now - i,
      updatedAt: now - i,
      sortOrder: i,
  }));
}

// Older local trees predate sortOrder. Give each sibling a stable initial
// alphabetical order exactly once, then preserve any later drag arrangement.
function normalizeSortOrder(nodes: StrixNode[]): StrixNode[] {
  const byParent = new Map<string | null, StrixNode[]>();
  nodes.forEach((node) => {
    const siblings = byParent.get(node.parentId) ?? [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  });
  const order = new Map<string, number>();
  byParent.forEach((siblings) => {
    siblings
      .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title))
      .forEach((node, index) => order.set(node.id, node.sortOrder ?? index));
  });
  return nodes.map((node) => ({ ...node, sortOrder: order.get(node.id) }));
}
