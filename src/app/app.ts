import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TodosTable } from './components/todos-table';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TodosTable],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'router-pagination';
}
