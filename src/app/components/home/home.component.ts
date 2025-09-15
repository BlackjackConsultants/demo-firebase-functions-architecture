import { Component, Inject } from '@angular/core';
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

  constructor(private usersService: UsersService) {}

  getUsersHandler() {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        // For now, just log; in a real UI you'd display them
        console.log('Users loaded', users);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        alert('Failed to load users. See console for details.');
      }
    });
  }

  navigateToHelp() {
    const url = `${window.location.hostname}/assets/page/index.html`;
    window.location.href = `${window.location.hostname}/assets/page/index.html`;
  }

  addUserHandler() {
    // Simple demo payload; in real UI you'd collect from a form
    const payload: CreateUser = {
      name: `User ${Date.now()}`,
      email: `user${Math.floor(Math.random() * 10000)}@example.com`
    };

    this.usersService.createUser(payload).subscribe({
      next: (created) => {
        // Push into local list for quick feedback
        this.users = [...this.users, created];
        console.log('User created', created);
        alert(`Created user: ${created.name}`);
      },
      error: (err) => {
        console.error('Failed to create user', err);
      }
    });
  }
}
