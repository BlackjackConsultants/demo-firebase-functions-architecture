import { Component, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

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


  navigateHandler(value: string) {

  }

  navigateToHelp() {
    const url = `${window.location.hostname}/assets/page/index.html`;
    window.location.href = `${window.location.hostname}/assets/page/index.html`;
  }
}
