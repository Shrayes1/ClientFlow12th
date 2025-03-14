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
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Define the User interface
interface User {
  name: string;
  client_id: string;
  email: string;
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
    ProgressModule,
    
  ],
  templateUrl: './contract-add.component.html',
  styleUrls: ['./contract-add.component.css']
})
export class ContractAddComponent {
  showUserForm = false;
  uploadedFiles: File[] = [];
  icons = { cilPlus };
  
  private apiBaseUrl = 'https://3fa9-14-143-149-238.ngrok-free.app';
  private addUserApi = 'https://3fa9-14-143-149-238.ngrok-free.app/add_client';//`${this.apiBaseUrl}/add_client`;  // POST URL
  private getUsersApi = 'https://3fa9-14-143-149-238.ngrok-free.app/get_all_clients';//`${this.apiBaseUrl}/get_all_clients`;  // GET URL

  users: User[] = [];
  
  newUser: User = {
    name: '',
    client_id: '',
    email: ''
  };

  constructor(private http: HttpClient) {
    this.fetchUsers(); // Load initial data
  }

  // Fetch users from the backend
  fetchUsers(): void {
    this.http.get<{ clients: User[] }>(this.getUsersApi).subscribe({
      next: (response) => {
        console.log('Fetched users:', response);
        this.users = response.clients;  // ✅ Extract the correct array
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        alert('Failed to fetch clients. Please check your connection.');
      }
    });
  }
  
  

  toggleUserForm() {
    this.showUserForm = !this.showUserForm;
  }

  addUser() {
    const payload: User = { ...this.newUser };

    console.log('Sending POST request to:', this.addUserApi);
    console.log('Payload:', JSON.stringify(payload));

    this.http.post(this.addUserApi, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json;charset=UTF-8' }),
      observe: 'response'  // Observe full response for debugging
    }).subscribe({
      next: (response) => {
        console.log('Full Response:', response);
        console.log('Response Body:', response.body);
        
        // Ensure fetchUsers() runs only if the request was successful
        if (response.status === 200 || response.status === 201) {
          this.fetchUsers(); // Refresh list from backend
          this.resetForm();
        } else {
          console.warn('Unexpected response status:', response.status);
        }
      },
      error: (err) => {
        console.error('Error adding user:', err);
        alert(`Failed to add client: ${err.message}`);
      }
    });
  }

  

  resetForm() {
    this.newUser = { 
      name: '', 
      client_id: '',
      email: ''
    };
    this.showUserForm = false;
  }

  viewContract(user: User) {
    alert(`Contract viewing for ${user.name} is not supported yet.`);
  }

  getProgressColor(percentage: number): string {
    return 'info'; // Placeholder
  }

  // File Drag & Drop Handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }

  onContractDropped(event: DragEvent) {
    event.preventDefault();
  }
}
