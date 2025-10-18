# Filter Improvements - Fix & Features 🔧

## Problemi Risolti

### 1. ✅ Input Value Non Editabile

**Problema**: Il campo "Value" nei filtri non era editabile - non si poteva scrivere testo.

**Causa**: Gli `onChange` handlers erano stub con commenti `// Update filter value logic will be added` ma non implementavano l'aggiornamento dello stato.

**Soluzione**:
- Implementati correttamente tutti gli `onChange` handlers
- Usato `updateFilter` dallo store per aggiornare column, operator e value
- Aggiunto `focus:ring-2` per feedback visivo quando il campo è attivo

**File Modificato**: `components/filters/FilterBuilder.tsx`

```typescript
// Prima (non funzionante)
onChange={(e) => {
  // Update filter value logic will be added
}}

// Dopo (funzionante)
onChange={(e) => {
  updateFilter(filter.id, { value: e.target.value });
}}
```

---

### 2. ✅ Ricerca Globale Implementata

**Feature Richiesta**: Campo di ricerca che filtra su tutti i campi della tabella.

**Implementazione**:

#### Frontend (`FilterBuilder.tsx`)

Aggiunto campo di ricerca globale in cima ai filtri:

```typescript
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <input
    type="text"
    value={globalSearch}
    onChange={(e) => setGlobalSearch(e.target.value)}
    placeholder="Search across all columns..."
    className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
```

**Caratteristiche**:
- Icona search a sinistra
- Placeholder "Search across all columns..."
- Focus ring blu
- Full width

#### Backend (`filter-engine.ts`)

Aggiornata funzione `applyFilters` per supportare global search:

```typescript
export function applyFilters(data: any[], config: IFilterConfig, globalSearch?: string): any[] {
  let filteredData = data;

  // Apply global search first
  if (globalSearch && globalSearch.trim()) {
    const searchTerm = globalSearch.toLowerCase();
    filteredData = filteredData.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }

  // Then apply specific filters...
}
```

**Come Funziona**:
1. Ricerca globale applicata **prima** dei filtri specifici
2. Case-insensitive (tutto in lowercase)
3. Cerca in **tutte le colonne** usando `Object.values(row)`
4. Match parziale con `.includes()`
5. Skip valori null/undefined
6. Poi applica i filtri specifici sul risultato

#### API Route (`api/filter/route.ts`)

Aggiunto supporto per `globalSearch` nel body:

```typescript
const { sessionId, filters, combinator, pagination, globalSearch } = body;
// ...
const filteredData = applyFilters(data, filterConfig, globalSearch);
```

---

## User Experience Migliorata

### Prima ❌

- Input Value non editabile
- Solo filtri specifici su singole colonne
- Difficile cercare un valore senza sapere la colonna

### Dopo ✅

- Input Value completamente editabile
- Focus ring visivo per feedback
- Ricerca globale rapida su tutte le colonne
- Combinazione di global search + filtri specifici

---

## Come Usare

### Ricerca Globale

1. Digita nel campo "Search across all columns..."
2. La ricerca cerca in **tutte** le colonne
3. Match case-insensitive
4. Click "Apply Filters" per applicare

**Esempio**:
- Cerca "john" → trova "John", "johnson", "johnathan" in qualsiasi colonna

### Filtri Specifici

1. Click "Add Filter"
2. Seleziona colonna
3. Seleziona operatore
4. **Ora puoi digitare il valore!**
5. Click "Apply Filters"

### Combinare Global Search + Filtri

Puoi usare entrambi contemporaneamente:

**Esempio**:
- Global search: "apple"
- Filter: Amount > 1000
- Risultato: Tutte le righe che contengono "apple" in qualsiasi colonna E hanno Amount > 1000

---

## File Modificati

1. **components/filters/FilterBuilder.tsx**
   - ✅ Fix onChange handlers
   - ✅ Aggiunto global search input
   - ✅ Aggiunto useState per globalSearch
   - ✅ Passato globalSearch all'API

2. **lib/processing/filter-engine.ts**
   - ✅ Aggiunto parametro globalSearch
   - ✅ Implementata logica di ricerca globale
   - ✅ Ordine: global search → specific filters

3. **app/api/filter/route.ts**
   - ✅ Destructure globalSearch dal body
   - ✅ Passato a applyFilters()

---

## Testing

### Test 1: Input Editabile ✅
1. Aggiungi un filtro
2. Verifica che puoi digitare nel campo "Value"
3. Il testo deve apparire mentre digiti

### Test 2: Global Search ✅
1. Digita un termine nel campo search globale
2. Click "Apply Filters"
3. Verifica che vengono mostrate solo le righe che contengono quel termine in qualsiasi colonna

### Test 3: Global Search + Filtri ✅
1. Digita "test" nel global search
2. Aggiungi filtro: Amount > 500
3. Click "Apply Filters"
4. Verifica che vengono mostrate solo le righe con "test" E Amount > 500

### Test 4: Case Insensitive ✅
1. Digita "JOHN" nel global search
2. Deve matchare "john", "John", "JOHN", "JoHn"

---

## Performance Notes

La global search è **efficiente** perché:
- Filtra in memoria (no query DB)
- Usa `.some()` che si ferma al primo match
- Caching dei risultati filtrati (1 ora TTL)

Per dataset **molto grandi** (>100k righe):
- Considera debouncing del global search input
- Mostra loading indicator durante filtering
- Future: implementare indexing per search più veloce

---

**Data Fix**: 18 Ottobre 2025
**Status**: ✅ Implementato e Testato
**Breaking Changes**: Nessuno
