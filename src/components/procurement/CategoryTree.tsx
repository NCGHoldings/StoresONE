import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ProductCategory } from "@/hooks/useProductCategories";
import { CategoryTreeNode } from "./CategoryTreeNode";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryTreeProps {
  categories: ProductCategory[];
  flatCategories: ProductCategory[];
  onEdit: (category: ProductCategory) => void;
  onAddChild: (parentId: string | null) => void;
  onDelete: (category: ProductCategory) => void;
  onReorder: (updates: { id: string; parent_id: string | null; sort_order: number }[]) => void;
  productCounts?: Record<string, number>;
}

export function CategoryTree({
  categories,
  flatCategories,
  onEdit,
  onAddChild,
  onDelete,
  onReorder,
  productCounts = {},
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Start with root categories expanded
    return new Set(categories.map((c) => c.id));
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Flatten tree for sortable context (only visible items)
  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (items: ProductCategory[]) => {
      items.forEach((item) => {
        ids.push(item.id);
        if (item.children && expandedIds.has(item.id)) {
          traverse(item.children);
        }
      });
    };
    traverse(categories);
    return ids;
  }, [categories, expandedIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(flatCategories.map((c) => c.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Check if target is a descendant of source (prevent cycles)
  const isDescendant = (sourceId: string, targetId: string): boolean => {
    const findInChildren = (items: ProductCategory[]): boolean => {
      for (const item of items) {
        if (item.id === targetId) return true;
        if (item.children && findInChildren(item.children)) return true;
      }
      return false;
    };

    const sourceCategory = flatCategories.find((c) => c.id === sourceId);
    if (!sourceCategory?.children) return false;
    return findInChildren(sourceCategory.children);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeCategory = flatCategories.find((c) => c.id === active.id);
    const overCategory = flatCategories.find((c) => c.id === over.id);

    if (!activeCategory || !overCategory) return;

    // Prevent dropping onto descendants
    if (isDescendant(active.id as string, over.id as string)) {
      return;
    }

    // Determine new parent and sort order
    const newParentId = overCategory.parent_id;
    const siblings = flatCategories
      .filter((c) => c.parent_id === newParentId && c.id !== active.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const overIndex = siblings.findIndex((c) => c.id === over.id);
    
    // Build updates for reordering
    const updates: { id: string; parent_id: string | null; sort_order: number }[] = [];
    
    // Insert active category at the new position
    const newSiblings = [...siblings];
    newSiblings.splice(overIndex, 0, activeCategory);
    
    newSiblings.forEach((sibling, index) => {
      const update = {
        id: sibling.id,
        parent_id: newParentId,
        sort_order: index,
      };
      
      // Only include if something changed
      if (
        sibling.id === active.id ||
        sibling.sort_order !== index
      ) {
        updates.push(update);
      }
    });

    if (updates.length > 0) {
      onReorder(updates);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Could add visual feedback here
  };

  const activeCategory = activeId
    ? flatCategories.find((c) => c.id === activeId)
    : null;

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No categories yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first category to start organizing products
        </p>
        <Button onClick={() => onAddChild(null)}>Create Root Category</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expand/Collapse Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          <ChevronDown className="h-4 w-4 mr-1" />
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          <ChevronRight className="h-4 w-4 mr-1" />
          Collapse All
        </Button>
        <span className="text-sm text-muted-foreground ml-2">
          Drag categories to reorder or change hierarchy
        </span>
      </div>

      {/* Tree */}
      <div className="border rounded-lg bg-card p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
            {categories.map((category) => (
              <CategoryTreeNode
                key={category.id}
                category={category}
                depth={0}
                isExpanded={expandedIds.has(category.id)}
                onToggleExpand={toggleExpand}
                onEdit={onEdit}
                onAddChild={onAddChild}
                onDelete={onDelete}
                productCounts={productCounts}
              />
            ))}
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeCategory && (
              <div className="flex items-center gap-2 py-2 px-3 bg-card border rounded-lg shadow-lg">
                <Folder className="h-4 w-4 text-primary" />
                <span className="font-medium">{activeCategory.name}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {activeCategory.code}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
