import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  resource,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HighlightPipe } from '../pipes/highlight-pipe';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-todos-table',
  template: `
    <section class="todos-container" data-testid="todos-container">
      <div class="controls">
        <input
          data-testid="search-input"
          type="search"
          placeholder="Buscar por título..."
          [value]="searchTerm()"
          (input)="onSearch($event)"
        />

        <select
          data-testid="completed-filter"
          [value]="filter()"
          (change)="onFilter($event)"
        >
          <option value="all">Todos</option>
          <option value="completed">Completado</option>
          <option value="not-completed">No completado</option>
        </select>
      </div>

      @if (todos.isLoading()) {
      <div class="loading" data-testid="loading">Cargando...</div>
      } @else if (todos.error()) {
      <div class="error" data-testid="error">Error al cargar los datos</div>
      } @else {
      <table data-testid="todos-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Completado</th>
          </tr>
        </thead>
        <tbody>
          @for (todo of filteredTodos(); track todo.id) {
          <tr data-testid="todo-row" [attr.data-completed]="todo.completed">
            <td data-testid="todo-id">{{ todo.id }}</td>
            <td
              data-testid="todo-title"
              [innerHTML]="todo.title | highlight : searchTerm()"
            >
              {{ todo.title }}
            </td>
            <td data-testid="todo-completed">
              <span
                [class.completed]="todo.completed"
                data-testid="todo-completed-badge"
              >
                {{ todo.completed ? 'Sí' : 'No' }}
              </span>
            </td>
          </tr>
          } @empty {
          <tr data-testid="empty-row">
            <td colspan="3">No se encontraron resultados</td>
          </tr>
          }
        </tbody>
      </table>
      }
    </section>
  `,
  styles: [
    `
      .todos-container {
        max-width: 700px;
        margin: 2rem auto;
        padding: 1rem;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
      }

      .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        align-items: center;
      }

      input[type='search'] {
        flex: 1;
        padding: 0.5rem 1.2rem;
        font-size: 1rem;
        border: 1.5px solid #bdbdbd;
        border-radius: 999px;
        background: #fafbfc;
        transition: border-color 0.2s;
        outline: none;
        color: #222;
      }

      input[type='search']:focus {
        border-color: #1976d2;
        background: #fff;
      }

      input[type='search']::-webkit-search-cancel-button {
        cursor: pointer;
        height: 1.2em;
        width: 1.2em;
      }

      select {
        padding: 0.5rem 2.2rem 0.5rem 1rem;
        font-size: 1rem;
        border: 1.5px solid #bdbdbd;
        border-radius: 999px;
        background: #fafbfc;
        color: #222;
        min-width: 150px;
      }

      select:focus {
        border-color: #1976d2;
        background-color: #fff;
        box-shadow: 0 0 0 2px #1976d220;
      }

      option {
        background: #fafbfc;
        color: #222;
        font-size: 1rem;
        border: 1px solid black;
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: #fafbfc;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(25, 118, 210, 0.06);
      }

      th,
      td {
        padding: 0.85rem 1.3rem;
        border-bottom: 1.5px solid #e3e8ee;
        text-align: left;
        font-size: 1rem;
      }

      th {
        background: #f1f5fa;
        color: #1976d2;
        font-weight: 600;
        letter-spacing: 0.03em;
        border-bottom: 2px solid #e3e8ee;
      }

      tr:last-child td {
        border-bottom: none;
      }

      td span {
        display: inline-block;
        padding: 0.25em 0.9em;
        border-radius: 999px;
        font-size: 0.95em;
        font-weight: 500;
        background: #e3f2fd;
        color: #1976d2;
        transition: background 0.2s, color 0.2s;
      }

      td span.completed {
        background: #e8f5e9;
        color: #388e3c;
      }

      td span:not(.completed) {
        background: #ffebee;
        color: #d32f2f;
      }

      .completed {
        color: green;
        font-weight: bold;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: #888;
      }

      .error {
        text-align: center;
        padding: 2rem;
      }
    `,
  ],
  imports: [HighlightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodosTable implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly searchTerm = signal('');
  protected readonly filter = signal<'all' | 'completed' | 'not-completed'>(
    'all'
  );

  protected readonly todos = resource({
    loader: () =>
      fetch('https://jsonplaceholder.typicode.com/todos').then(
        (res) => res.json() as Promise<Todo[]>
      ),
  });

  protected readonly filteredTodos = computed(() => {
    const todos = this.todos.value() ?? [];
    const term = this.searchTerm().toLowerCase();
    const filter = this.filter();
    return todos.filter((todo) => {
      const matchesTitle = todo.title.toLowerCase().includes(term);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'completed' && todo.completed) ||
        (filter === 'not-completed' && !todo.completed);
      return matchesTitle && matchesFilter;
    });
  });

  // Sync from signals to URL query params effect
  protected readonly syncRouteParamsEffect = effect(() => {
    const q = this.searchTerm();
    const completed = this.filter();

    // Obtenemos los query params actuales
    const params = this.route.snapshot.queryParams;
    const urlQ = params['q'] ?? '';
    const urlCompleted = params['completed'] ?? 'all';

    // Si los valores son iguales, no hacemos nada
    if (q === urlQ && completed === urlCompleted) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...(q ? { q } : { q: null }),
        ...(completed !== 'all' ? { completed } : { completed: null }),
      },
      queryParamsHandling: 'merge',
      // replaceUrl: true,
    });
  });

  ngOnInit(): void {
    this.#syncRouteParams();
  }

  #syncRouteParams() {
    // Sync from URL to signals on init and when query params change
    this.route.queryParams.subscribe((params) => {
      this.searchTerm.set(params['q'] ?? '');
      this.filter.set(
        (params['completed'] as 'all' | 'completed' | 'not-completed') ?? 'all'
      );
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.searchTerm.set(value);
  }

  onFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.filter.set(value as 'all' | 'completed' | 'not-completed');
  }
}
