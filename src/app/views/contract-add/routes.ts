import { Routes } from '@angular/router';

import { ContractAddComponent } from './contract-add.component';

export const routes: Routes = [
  {
    path: '',
    component: ContractAddComponent,
    data: {
      title: 'Clients'
    }
  }
];