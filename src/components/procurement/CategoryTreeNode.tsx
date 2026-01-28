import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProductCategory } from "@/hooks/useProductCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryTreeNodeProps {
  category: ProductCategory;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (category: ProductCategory) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (category: ProductCategory) => void;
  productCounts?: Record<string, number>;
}

export function CategoryTreeNode({
  category,
  depth,
  isExpanded,
  onToggleExpand,
  onEdit,
  onAddChild,
  onDelete,
  productCounts = {},
}: CategoryTreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const productCount = productCounts[category.id] || 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: category.id,
    data: {
      type: "category",
      category,
      depth,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-3 rounded-lg transition-all",
          "hover:bg-muted/50",
          isDragging && "opacity-50 bg-muted shadow-lg",
          isOver && "bg-primary/10 ring-2 ring-primary ring-offset-2",
          !category.is_active && "opacity-60"
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag Handle */}
        <button
          className={cn(
            "cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isDragging && "opacity-100"
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Expand/Collapse Toggle */}
        <button
          className={cn(
            "p-1 rounded hover:bg-muted transition-colors",
            !hasChildren && "invisible"
          )}
          onClick={() => onToggleExpand(category.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Folder Icon */}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-primary" />
          )
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Category Info */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="font-medium truncate">{category.name}</span>
          <span className="text-xs font-mono text-muted-foreground">
            {category.code}
          </span>
          {!category.is_active && (
            <Badge variant="secondary" className="text-xs">
              Inactive
            </Badge>
          )}
          {productCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {productCount} product{productCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {hasChildren && !isExpanded && (
            <span className="text-xs text-muted-foreground">
              ({category.children!.length} subcategor{category.children!.length === 1 ? "y" : "ies"})
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(category.id)}
            title="Add subcategory"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(category)}
            title="Edit category"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(category)}
            title="Delete category"
            disabled={hasChildren}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Connecting Line */}
          <div
            className="absolute left-0 top-0 bottom-0 border-l-2 border-muted"
            style={{ marginLeft: `${depth * 24 + 28}px` }}
          />
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
              productCounts={productCounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
