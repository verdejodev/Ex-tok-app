### Task 1: Adicionar Lógica de Ordenação

**Files:**
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: `Equipment` de `lib/types.ts`
- Produces: `sortedAndFilteredEquipments` ordenado conforme o estado `sortByPageCount`.

- [ ] **Step 1: Adicionar estado local para controle da ordenação**

Modificar `app/index.tsx` para adicionar o estado de ordenação `sortByPageCount`:
```tsx
const [sortByPageCount, setSortByPageCount] = useState<'none' | 'desc' | 'asc'>('none');
```

- [ ] **Step 2: Adicionar lógica de ordenação no processamento do array**

Substituir a atribuição de `filteredEquipments` para incluir a ordenação condicional e gerar o array `sortedAndFilteredEquipments` (ou apenas substituir a referência):
```tsx
  const filteredEquipments = equipments.filter(e => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(e.type);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(e.status);
    return matchesType && matchesStatus;
  });

  const sortedAndFilteredEquipments = [...filteredEquipments].sort((a, b) => {
    if (sortByPageCount === 'desc') {
      const countA = a.page_count !== null ? a.page_count : -1;
      const countB = b.page_count !== null ? b.page_count : -1;
      return countB - countA;
    } else if (sortByPageCount === 'asc') {
      const countA = a.page_count !== null ? a.page_count : Infinity;
      const countB = b.page_count !== null ? b.page_count : Infinity;
      return countA - countB;
    }
    return 0; // 'none'
  });
```

Substituir o prop `data` da `FlatList` para usar `sortedAndFilteredEquipments`.

- [ ] **Step 3: Atualizar a contagem de filtros ativos no cabeçalho do acordeão**

Atualizar o contador de filtros ativos:
```tsx
const activeFiltersCount = selectedStatuses.length + selectedTypes.length + (sortByPageCount !== 'none' ? 1 : 0);
```

Atualizar o texto do cabeçalho para exibir `activeFiltersCount` no lugar do cálculo antigo:
```tsx
Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount} ativos)` : ''}
```

- [ ] **Step 4: Executar type check para verificar se compila**

Run: `npx tsc --noEmit`
Expected: Sucesso (código de saída 0).

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add page count sorting logic to equipments list"
```

---

