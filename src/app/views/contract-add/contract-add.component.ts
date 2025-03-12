import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { cilPlus } from '@coreui/icons';
import { IconComponent } from '@coreui/icons-angular';

import { 
  GridModule,   
  CardModule,   
  ButtonModule, 
  TableModule, 
  AvatarModule, 
  ProgressModule 
} from '@coreui/angular';

// ✅ Define the User interface
interface User {
  name: string;
  clientName: string;
  clientId: string;
  email: string;
  profilePic?: string;
  progress: number;
  stage: string;
  contract: File | null;
  contractUrl?: string;
}

@Component({
  selector: 'app-contract-add',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    GridModule,   
    CardModule,   
    ButtonModule,
    IconComponent, 
    TableModule, 
    AvatarModule, 
    ProgressModule
  ],
  templateUrl: './contract-add.component.html',
  styleUrls: ['./contract-add.component.css']
})
export class ContractAddComponent {
  showUserForm = false;
  uploadedFiles: File[] = [];
  icons = { cilPlus };

  users: User[] = [
    { name: 'John Doe', clientName: 'ABC Corp', clientId: '12345', email: 'john@example.com', progress: this.getRandomProgress(), stage: 'In Progress', contract: null, profilePic: 'assets/profile1.jpg' },
    { name: 'Jane Smith', clientName: 'XYZ Ltd', clientId: '67890', email: 'jane@example.com', progress: this.getRandomProgress(), stage: 'Review', contract: null, profilePic: 'assets/profile2.jpg' }
  ];
  
  // ✅ Function to generate a random progress value (0 - 100)
  getRandomProgress(): number {
    return Math.floor(Math.random() * 101);
  }

  newUser: User = {
    name: '',
    clientName: '',
    clientId: '',
    email: '',
    progress: 0,
    stage: 'Not Started',
    contract: null,
    profilePic: ''
  };

  toggleUserForm() {
    this.showUserForm = !this.showUserForm;
  }

  addUser() {
    if (!this.newUser.contract) {
      alert('Please upload a contract before saving.');
      return;
    }
    
    const contractUrl = URL.createObjectURL(this.newUser.contract);
    this.users = [...this.users, { ...this.newUser, contractUrl }];
    this.resetForm();
  }

  resetForm() {
    this.newUser = { name: '', clientName: '', clientId: '', email: '', progress: 0, stage: 'Not Started', contract: null, profilePic: '' };
    this.showUserForm = false;
  }

  viewContract(user: User) {
    if (user.contractUrl) {
      window.open(user.contractUrl, '_blank');
    } else {
      alert('No contract available.');
    }
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'success';  
    if (percentage >= 65) return 'info';  
    if (percentage >= 35) return 'warning';     
    return 'danger';  
  }

  // ✅ Drag & Drop for Contract Upload
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }

  onContractDropped(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.newUser.contract = event.dataTransfer.files[0] || null;
    }
  }

  onContractSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.newUser.contract = input.files[0] || null;
    }
  }

  onProfilePicSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.newUser.profilePic = URL.createObjectURL(file);
    }
  }
}
