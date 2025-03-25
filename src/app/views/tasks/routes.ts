import { Routes } from '@angular/router';
import { TasksComponent } from './tasks.component';

export const routes: Routes = [
  {
    path: '',
    component: TasksComponent,
    data: {
      title: 'Tasks'
    }
  },
  {
    path: ':client_id/:username',  // ✅ Add dynamic route
    component: TasksComponent,
    data: {
      title: 'User Tasks'
    }
  }
];
