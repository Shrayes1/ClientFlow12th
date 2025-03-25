import { Routes } from '@angular/router';
import { QuestionnaireComponent } from './questionnaire.component';  // ✅ Ensure this matches the class name

export const routes: Routes = [
  {
    path: '',
    component: QuestionnaireComponent,  // ✅ Use the correct component name
    data: { title: 'Questionnaire' }
  }
];
