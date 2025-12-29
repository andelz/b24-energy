import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive } from '@angular/router';
import { AppService } from './services/app.service';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[class.dirty]': 'databaseDirty()'
  }
})
export class App {
  #appService = inject(AppService);
  routes = routes;

  databaseDirty = this.#appService.databaseDirty;
  databaseAvailable = this.#appService.databaseAvailable;

  async open() {
    this.#appService.openDatabase();
  }
  async create() {
    this.#appService.createDatabase();
  }
  async save() {
    this.#appService.saveDatabase();
  }
}
