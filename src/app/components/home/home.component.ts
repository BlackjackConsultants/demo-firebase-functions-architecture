import { Component, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { Analytics, logEvent } from '@angular/fire/analytics'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  production = environment.production;
  splitPagesNavParam = 'split-pages';
  carLeaseNavParam = 'car-lease';
  carLoanNavParam = 'car-loan';

  constructor(private analytics: Analytics) { }

  navigateHandler(value: string) {
    logEvent(this.analytics, value, {
      category: 'navigation',
      value: 42,
    });
  }

  navigateToHelp() {
    const url = `${window.location.hostname}/assets/page/index.html`;
    window.location.href = `${window.location.hostname}/assets/page/index.html`;
  }
}
