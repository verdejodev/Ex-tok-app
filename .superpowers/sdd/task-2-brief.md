### Task 2: Adicionar Elementos de UI dos Chips de Ordenação

**Files:**
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: Estado `sortByPageCount` e setter `setSortByPageCount`.
- Produces: Renderização da seção "Classificação por Contador" na área de filtros expandida.

- [ ] **Step 1: Inserir a UI dos chips na seção de filtros expandida**

Na renderização do painel de filtros (`filtersContentContainer`), após a listagem de status, incluir a seção de ordenação:
```tsx
          <Text style={styles.filterGroupLabel}>Ordenação por Contador</Text>
          <View style={styles.chipsContainer}>
            <TouchableOpacity
              style={[styles.typeChip, sortByPageCount === 'none' && styles.chipActive]}
              onPress={() => setSortByPageCount('none')}
            >
              <Text style={[styles.chipText, sortByPageCount === 'none' && styles.chipTextActive]}>
                Padrão
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, sortByPageCount === 'desc' && styles.chipActive]}
              onPress={() => setSortByPageCount('desc')}
            >
              <Text style={[styles.chipText, sortByPageCount === 'desc' && styles.chipTextActive]}>
                Maior para menor ⬇
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, sortByPageCount === 'asc' && styles.chipActive]}
              onPress={() => setSortByPageCount('asc')}
            >
              <Text style={[styles.chipText, sortByPageCount === 'asc' && styles.chipTextActive]}>
                Menor para maior ⬆
              </Text>
            </TouchableOpacity>
          </View>
```

- [ ] **Step 2: Executar type check para garantir que compila**

Run: `npx tsc --noEmit`
Expected: Sucesso (código de saída 0).

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: render sorting chips inside filters container"
```

---

## Plano de Verificação

### Testes Automatizados
- Executar `npx tsc --noEmit` no diretório do projeto móvel.

### Verificação Manual
1. Abrir a tela principal do aplicativo.
2. Abrir o acordeão de "Filtros".
3. Verificar que a nova seção "Ordenação por Contador" está disponível.
4. Clicar em "Maior para menor ⬇". Validar se impressoras com maiores contadores de páginas aparecem primeiro.
5. Clicar em "Menor para maior ⬆". Validar se impressoras com menores contadores de páginas aparecem primeiro.
6. Clicar em "Padrão". Validar se a ordenação retorna ao padrão.
7. Validar se equipamentos sem contador (como computadores/notebooks) são exibidos no final da lista quando qualquer uma das ordenações está ativa.
