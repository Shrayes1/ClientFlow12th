import { Routes } from '@angular/router';

import { TasksComponent } from './tasks.component';

export const routes: Routes = [
  {
    path: '',
    component: TasksComponent,
    data: {
      title: 'Tasks'
    }
  }
];