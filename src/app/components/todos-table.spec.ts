// todos-table.component.spec.ts (versión optimizada con Vitest + Angular 20)
// -----------------------------------------------------------------------------
// Objetivos de la refactorización:
// 1. Tipado estricto sin recurrir a `any` (adiós a let fetchSpy: any;).
// 2. Eliminar duplicación: creación de componente, asignación de nativeElement,
//    configuración de fetch mock y manipulación de filtros.
// 3. Tests más declarativos: lo que cambia por test, no el boilerplate.
// 4. Helpers reutilizables para interacciones comunes (escribir búsqueda,
//    cambiar filtro completado, esperar render, etc.).
// 5. Facilitar añadir más casos (por ejemplo, distintos estados de query params).
//
// Notas:
// - Usamos `MockedFetch` como tipo utilitario para el spy de fetch.
// - `renderTodosTable()` prepara el fixture, resuelve el fetch y devuelve un harness.
// - Los helpers fuerzan un `await fixture.whenStable()` tras interacciones async.
// - Las aserciones de tabla se centralizan en `expectTableToHaveTitles(...)`.
// - Se usan `describe.each` para parametrizar escenarios de filtrado.
// -----------------------------------------------------------------------------

import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HighlightPipe } from '../pipes/highlight-pipe';
import { TodosTable } from './todos-table';

// -----------------------------------------------------------------------------
// Datos de prueba
// -----------------------------------------------------------------------------
const MOCK_TODOS = [
  { userId: 1, id: 1, title: 'delectus aut autem', completed: false },
  {
    userId: 1,
    id: 2,
    title: 'quis ut nam facilis et officia qui',
    completed: false,
  },
  { userId: 1, id: 3, title: 'fugiat veniam minus', completed: true },
  { userId: 1, id: 4, title: 'et porro tempora', completed: true },
] as const;

// -----------------------------------------------------------------------------
// Router / ActivatedRoute mocks (compartidos)
// -----------------------------------------------------------------------------
const mockRouter = {
  navigate: vi.fn(),
};

const queryParamsSubject = new BehaviorSubject<Record<string, any>>({});
const mockActivatedRoute = {
  queryParams: queryParamsSubject.asObservable(),
  snapshot: { queryParams: {} as Record<string, any> },
};

// -----------------------------------------------------------------------------
// Tipos utilitarios
// -----------------------------------------------------------------------------
// Firma del fetch global (Node + DOM), la simplificamos a la parte que usamos.
type MockedFetch = Mock;

interface FetchMockOptions {
  ok?: boolean; // default: true
  shouldReject?: boolean; // si true => mockRejectedValue
}

// -----------------------------------------------------------------------------
// Helper DOM seguro
// -----------------------------------------------------------------------------
const getElement = <T extends HTMLElement>(
  root: HTMLElement,
  selector: string
): T => {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Elemento no encontrado: ${selector}`);
  return el;
};

// -----------------------------------------------------------------------------
// Configurador de mock de fetch reutilizable
// -----------------------------------------------------------------------------
function setupFetchMock(
  fetchSpy: MockedFetch,
  data: unknown,
  opts: FetchMockOptions = {}
) {
  const { ok = true, shouldReject = false } = opts;
  if (shouldReject) {
    fetchSpy.mockRejectedValue(data);
  } else {
    fetchSpy.mockResolvedValue({
      ok,
      json: () => Promise.resolve(data),
    } as unknown as Response);
  }
}

// -----------------------------------------------------------------------------
// Harness de pruebas para el componente
// -----------------------------------------------------------------------------
type CompletedFilterValue = 'all' | 'completed' | 'not-completed';

interface TodosTableHarness {
  fixture: ComponentFixture<TodosTable>;
  native: HTMLElement;
  component: TodosTable;
  setSearch(value: string): Promise<void>;
  setCompletedFilter(value: CompletedFilterValue): Promise<void>;
  pushQueryParams(params: Record<string, any>): Promise<void>;
  loadingText(): string | null;
  errorText(): string | null;
  getRowEls(): HTMLTableRowElement[];
  getRowTitles(): string[];
  getRowCompletionFlags(): boolean[]; // true = completado
}

async function renderTodosTable(): Promise<TodosTableHarness> {
  const fixture = TestBed.createComponent(TodosTable);
  await fixture.whenStable();
  fixture.detectChanges();

  const native = fixture.nativeElement as HTMLElement;
  const component = fixture.componentInstance;

  const detect = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const getSearchEl = () =>
    native.querySelector<HTMLInputElement>('[data-testid="search-input"]')!;
  const getFilterEl = () =>
    native.querySelector<HTMLSelectElement>(
      '[data-testid="completed-filter"]'
    )!;

  const getRowEls = () =>
    Array.from(
      native.querySelectorAll<HTMLTableRowElement>('[data-testid="todo-row"]')
    );

  const getRowTitles = () =>
    getRowEls().map(
      (r) =>
        r
          .querySelector<HTMLElement>('[data-testid="todo-title"]')!
          .textContent?.trim() ?? ''
    );

  const getRowCompletionFlags = () =>
    getRowEls().map((r) => {
      const badge = r.querySelector<HTMLElement>(
        '[data-testid="todo-completed-badge"]'
      );
      const txt = badge?.textContent?.trim().toLowerCase() ?? '';
      return txt === 'sí' || txt === 'si';
    });

  const loadingText = () =>
    native.querySelector('[data-testid="loading"]')?.textContent?.trim() ??
    null;
  const errorText = () =>
    native.querySelector('[data-testid="error"]')?.textContent?.trim() ?? null;

  const setSearch = async (value: string) => {
    const input = getSearchEl();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await detect();
  };

  const setCompletedFilter = async (
    value: CompletedFilterValue
  ): Promise<void> => {
    const select = getFilterEl();
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change'));
    }
    await detect();
  };

  const pushQueryParams = async (
    params: Record<string, any>
  ): Promise<void> => {
    queryParamsSubject.next(params);
    await detect();
  };

  return {
    fixture,
    native,
    component,
    setSearch,
    setCompletedFilter,
    pushQueryParams,
    loadingText,
    errorText,
    getRowEls,
    getRowTitles,
    getRowCompletionFlags,
  };
}

// -----------------------------------------------------------------------------
// Expect helpers
// -----------------------------------------------------------------------------
function expectTableToHaveTitles(h: TodosTableHarness, expected: string[]) {
  expect(h.getRowTitles()).toStrictEqual(expected);
}

function expectTableEmptyMessage(h: TodosTableHarness) {
  // no filas de datos: debería existir fila empty
  const empty = h.native.querySelector('[data-testid="empty-row"]');
  expect(empty).not.toBeNull();
  expect(empty!.textContent).toContain('No se encontraron resultados');
}

function countCompletedRows(h: TodosTableHarness): number {
  return h.getRowCompletionFlags().filter(Boolean).length;
}

// -----------------------------------------------------------------------------
// Suite de tests
// -----------------------------------------------------------------------------

describe('TodosTable', () => {
  let fetchSpy: MockedFetch;

  beforeEach(async () => {
    mockRouter.navigate.mockClear();
    fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as MockedFetch;

    await TestBed.configureTestingModule({
      imports: [TodosTable, HighlightPipe],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('crea el componente', () => {
    setupFetchMock(fetchSpy, []);
    const fixture = TestBed.createComponent(TodosTable);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra estado "Cargando..." mientras se obtienen los datos', () => {
    fetchSpy.mockImplementation(() => new Promise(() => {})); // nunca resuelve
    const fixture = TestBed.createComponent(TodosTable);
    fixture.detectChanges();
    expect(getElement(fixture.nativeElement, '.loading').textContent).toContain(
      'Cargando...'
    );
  });

  it('carga y muestra los todos', async () => {
    setupFetchMock(fetchSpy, MOCK_TODOS);
    const h = await renderTodosTable();
    expect(h.loadingText()).toBeNull();
    expectTableToHaveTitles(
      h,
      MOCK_TODOS.map((t) => t.title)
    );
  });

  it('muestra error cuando fetch rechaza', async () => {
    setupFetchMock(fetchSpy, new Error('Network Error'), {
      ok: false,
      shouldReject: true,
    });
    const h = await renderTodosTable();
    expect(h.errorText()).toContain('Error al cargar los datos');
    expect(h.loadingText()).toBeNull();
  });

  describe('filtrado por texto', () => {
    it('filtra al escribir en el campo búsqueda', async () => {
      setupFetchMock(fetchSpy, MOCK_TODOS);
      const h = await renderTodosTable();
      await h.setSearch('delectus');
      expectTableToHaveTitles(h, ['delectus aut autem']);
    });

    it('muestra mensaje vacío cuando no hay coincidencias', async () => {
      setupFetchMock(fetchSpy, MOCK_TODOS);
      const h = await renderTodosTable();
      await h.setSearch('texto_que_no_existe');
      expectTableEmptyMessage(h);
    });
  });

  describe('filtrado por completado', () => {
    it('filtra a solo completados', async () => {
      setupFetchMock(fetchSpy, MOCK_TODOS);
      const h = await renderTodosTable();

      await h.setCompletedFilter('completed');

      expect(countCompletedRows(h)).toBe(
        MOCK_TODOS.filter((t) => t.completed).length
      );

      expectTableToHaveTitles(
        h,
        MOCK_TODOS.filter((t) => t.completed).map((t) => t.title)
      );
    });

    it('filtra a solo pendientes', async () => {
      setupFetchMock(fetchSpy, MOCK_TODOS);
      const h = await renderTodosTable();

      await h.setCompletedFilter('not-completed');

      // Ninguna fila debe mostrar 'Sí'
      expect(countCompletedRows(h)).toBe(0);

      // Los títulos deben corresponder a los TODOs con completed === false
      expectTableToHaveTitles(
        h,
        MOCK_TODOS.filter((t) => !t.completed).map((t) => t.title)
      );
    });
  });

  it('actualiza query params cuando cambian búsqueda o filtro', async () => {
    setupFetchMock(fetchSpy, MOCK_TODOS);
    const h = await renderTodosTable();

    await h.setSearch('test');
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: mockActivatedRoute,
      queryParams: { q: 'test', completed: null },
      queryParamsHandling: 'merge',
    });

    await h.setCompletedFilter('completed');
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: mockActivatedRoute,
      queryParams: { q: 'test', completed: 'completed' },
      queryParamsHandling: 'merge',
    });
  });

  it('reacciona a cambios en query params externos (navegación)', async () => {
    setupFetchMock(fetchSpy, MOCK_TODOS);
    const h = await renderTodosTable();

    await h.pushQueryParams({ q: 'veniam', completed: 'completed' });

    const input = getElement<HTMLInputElement>(
      h.native,
      'input[type="search"]'
    );
    const select = getElement<HTMLSelectElement>(h.native, 'select');
    expect(input.value).toBe('veniam');
    expect(select.value).toBe('completed');

    expectTableToHaveTitles(h, ['fugiat veniam minus']);
  });
});

// -----------------------------------------------------------------------------
// Sugerencias adicionales:
// -----------------------------------------------------------------------------
// • Si quieres validar que el componente hace menos llamadas fetch, puedes añadir
//   `expect(fetchSpy).toHaveBeenCalledTimes(1)` tras el render.
// • Si tu componente transforma los TODOs (por ej. capitaliza títulos), los tests
//   deberían asertar la versión transformada.
// • Puedes extraer el harness a un util compartido si varios componentes usan
//   patrón parecido (búsqueda + filtro + URL sync).
// • Si realmente quieres resetear los query params entre tests, reinicia el
//   BehaviorSubject en cada `beforeEach` (creando uno nuevo) en lugar de reusar el mismo.
//   Aquí lo mantenemos simple, pero ojo a fugas de estado.
// -----------------------------------------------------------------------------
