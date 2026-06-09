# DataTable

## Purpose

Provide a reusable table component capable of rendering structured data as rows and columns across the application.

The DataTable exists to provide a consistent table experience while avoiding duplicate table implementations throughout the system.

## Responsibilities

What does this own?

- Rendering tabular data
- Rendering table headers
- Rendering table rows and cells
- Displaying empty states
- Accepting column definitions
- Auto-generating columns when definitions are not provided
- Basic table styling and layout
- Rendering provided data without modification

---

## Does Not Own

- Data fetching
- API integration
- Supabase queries
- Authentication
- Authorization
- Business logic
- Form submission
- Data validation
- Search functionality
- Sorting functionality
- Pagination
- Row editing
- Bulk actions
- Export functionality
- State management outside the component

---

## Relationships

---

## Rules

- The component must accept an array of objects as its primary data source.
- The component must support explicit column definitions.
- The component must support automatic column generation when definitions are omitted.
- The component must render a safe empty state when no data exists.
- The component must not fetch its own data.
- The component must not contain page-specific business logic.
- The component must remain reusable across multiple application domains.
- Null or undefined values must display a fallback value.
- The component must be presentation-focused.

---

## Future Considerations

Ideas that may be explored later but are not currently approved.

- Column sorting
- Column filtering
- Pagination
- Virtualized rendering
- Row selection
- Bulk actions
- Inline editing
- Expandable rows
- Custom cell renderers
- Column resizing
- Column visibility controls
- CSV export
- Server-side table integration