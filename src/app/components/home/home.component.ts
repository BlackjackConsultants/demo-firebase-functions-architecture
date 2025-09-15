import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { UsersService, User, CreateUser } from '../../core/users.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  production = environment.production;
  splitPagesNavParam = 'split-pages';
  carLeaseNavParam = 'car-lease';
  carLoanNavParam = 'car-loan';
  users: User[] = [];
  
  constructor(private router: Router) { }

  navigateToCrud() {
    this.router.navigate(['/crud']);
  }
}
