import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  template: ` <button (click)="plusOne()">Click me</button> `,
})
export class Button {
  value = signal(0);

  plusOne() {
    this.value.update((v) => v + 1);
  }
}
