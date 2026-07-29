# Task 1 Report: Adicionar Lógica de Ordenação

**Date & Time:** 2026-07-27
**Status:** Completed

## Summary of Changes

Implemented page count sorting logic in `app/index.tsx` for equipment listing:

1. **State Addition (`sortByPageCount`)**:
   Added `sortByPageCount` state (`'none' | 'desc' | 'asc'`) initialized to `'none'`.

2. **Sorting Logic (`sortedAndFilteredEquipments`)**:
   Created `sortedAndFilteredEquipments` which sorts filtered equipments based on `sortByPageCount`:
   - `'desc'`: Equipment with `page_count === null` sorted at the bottom (`-1`).
   - `'asc'`: Equipment with `page_count === null` sorted at the bottom (`Infinity`).
   - `'none'`: Default original order.

3. **Active Filters Counter (`activeFiltersCount`)**:
   Updated the active filter count calculation to include `(sortByPageCount !== 'none' ? 1 : 0)`.
   Updated accordion header text to display `Filtros (${activeFiltersCount} ativos)`.

4. **FlatList Data Source**:
   Replaced `filteredEquipments` with `sortedAndFilteredEquipments` as `FlatList` `data` prop.

## Verification

- **Type Check**: Executed `npx tsc --noEmit` in `/home/night/Documentos/appimpressoras/mobile` - exit code 0 (Success).
- **Files Modified**: `app/index.tsx`
