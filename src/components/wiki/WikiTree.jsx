import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, FileText, Trash2, Edit3, RefreshCw } from "lucide-react";
import {
  fetchWikiEntries,
  deleteWikiEntry,
  setSelectedEntryId,
  fetchWikiEntryContent,
  reindexWikiEntry,
  selectWikiEntries,
  selectWikiSelectedId,
} from "../../store/wikiSlice.js";

export default function WikiTree() {
  const dispatch = useDispatch();
  const entries = useSelector(selectWikiEntries);
  const selectedId = useSelector(selectWikiSelectedId);

  useEffect(() => {
    dispatch(fetchWikiEntries());
  }, [dispatch]);

  const handleSelect = (id) => {
    dispatch(setSelectedEntryId(id));
    dispatch(fetchWikiEntryContent(id));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      dispatch(deleteWikiEntry(id));
    }
  };

  const handleReindex = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Cập nhật lại chỉ mục tìm kiếm cho tài liệu này?")) {
      dispatch(reindexWikiEntry(id));
    }
  };

  if (!entries || entries.length === 0) {
    return (
      <div
        className="py-4 text-center px-4"
        style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}
      >
        <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
        <p>Private Wiki trống</p>
        <p className="text-xs mt-1">
          Upload tài liệu bên thanh Chat để AI tự động trích xuất và xây dựng
          Wiki
        </p>
      </div>
    );
  }

  // Very basic list rendering for Wiki entries
  // In a real app we might group by source_file or hierarchical sections.
  return (
    <ul className="space-y-0.5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative group/list flex items-center">
          <button
            onClick={() => handleSelect(entry.id)}
            type="button"
            className="flex items-center gap-2 flex-1 min-w-0 text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors"
            style={{
              background:
                selectedId === entry.id
                  ? "var(--color-surface-strong)"
                  : "transparent",
              color:
                selectedId === entry.id
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              if (selectedId !== entry.id)
                e.currentTarget.style.background = "var(--color-bg-card)";
            }}
            onMouseLeave={(e) => {
              if (selectedId !== entry.id)
                e.currentTarget.style.background = "transparent";
            }}
          >
            <FileText size={14} className="shrink-0 opacity-70" />
            <span className="text-xs leading-snug truncate flex-1 block">
              {entry.filename || "Untitled Document"}
            </span>
          </button>

          <button
            onClick={(e) => handleDelete(e, entry.id)}
            type="button"
            className="opacity-0 group-hover/list:opacity-100 shrink-0 p-0.5 rounded cursor-pointer transition-opacity duration-150 relative z-10"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-error)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-text-muted)")
            }
            title="Xóa tài liệu"
          >
            <Trash2 size={12} className="pointer-events-none" />
          </button>

          <button
            onClick={(e) => handleReindex(e, entry.id)}
            type="button"
            className="opacity-0 group-hover/list:opacity-100 shrink-0 p-0.5 rounded cursor-pointer transition-opacity duration-150 relative z-10"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-text-muted)")
            }
            title="Cập nhật chỉ mục tìm kiếm"
          >
            <RefreshCw size={12} className="pointer-events-none" />
          </button>
        </li>
      ))}
    </ul>
  );
}
