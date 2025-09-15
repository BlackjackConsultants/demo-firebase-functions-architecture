import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BasicCrudComponent } from './components/basic-crud/basic-crud.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'crud', component: BasicCrudComponent }
];
