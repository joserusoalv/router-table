import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <section class="counter-container">
      <h2>Contador: {{ count() }}</h2>
      <div class="counter-actions">
        <button (click)="decrement()">-</button>
        <button (click)="reset()">Reset</button>
        <button (click)="increment()">+</button>
      </div>
    </section>
  `,
  styles: [
    `
      .counter-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 2rem 0;
      }

      .counter-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
      }

      button {
        padding: 0.5rem 1.5rem;
        font-size: 1.5rem;
        cursor: pointer;
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Counter {
  protected readonly count = signal(0);

  increment() {
    this.count.update((c) => c + 1);
  }

  decrement() {
    this.count.update((c) => c - 1);
  }

  reset() {
    this.count.set(0);
  }
}
