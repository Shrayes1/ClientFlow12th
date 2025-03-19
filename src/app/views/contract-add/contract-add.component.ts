import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { cilPlus } from '@coreui/icons';
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
  file?: string;
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
    TableModule, 
    AvatarModule, 
    ProgressModule,
  ],
  templateUrl: './contract-add.component.html',
  styleUrls: ['./contract-add.component.css']
})
export class ContractAddComponent implements OnInit {
  showUserForm = false;
  uploadedFile: File | null = null;
  icons = { cilPlus };

  // API URLs
  private apiBaseUrl = 'https://e483-14-143-149-238.ngrok-free.app/';
  private addUserApi = `${this.apiBaseUrl}add_client`;
  private createFolderApi = `${this.apiBaseUrl}create_folder`;
  private uploadFileApi = `${this.apiBaseUrl}upload`;
  private getUsersApi = `${this.apiBaseUrl}get_all_clients`;

  users: User[] = [];

  newUser: User = {
    name: '',
    client_id: '',
    email: '',
    file: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    console.log('Fetching users from:', this.getUsersApi);
    this.http.get<any>(this.getUsersApi, {
      headers: new HttpHeaders({ 'Accept': 'application/json', 'ngrok-skip-browser-warning': "69420" })
    }).subscribe({
      next: (response) => {
        this.users = response.clients || response || [];
        console.log('Fetched Users:', this.users);
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        alert(`Failed to fetch clients: ${error.statusText || error.message}`);
      }
    });
  }

  toggleUserForm() {
    this.showUserForm = !this.showUserForm;
  }

  onFileSelected(event: any) {
    this.uploadedFile = event.target.files[0] || null;
    console.log('File selected:', this.uploadedFile);
  }
  async uploadProposalFile(): Promise<string> {
    if (!this.uploadedFile) {
      console.warn('⚠️ No file selected for upload.');
      return '';
    }
  
    const formData = new FormData();
    formData.append('file', this.uploadedFile);  // 🔥 Ensure the key matches the backend
    formData.append('username', this.newUser.name);
    formData.append('client_id', this.newUser.client_id);
  
    console.log('📤 Uploading file to:', this.uploadFileApi);
    console.log('📂 File Name:', this.uploadedFile.name);
    console.log('🆔 Client ID:', this.newUser.client_id);
  
    try {
      const response = await this.http.post<{ fileUrl: string }>(
        this.uploadFileApi, 
        formData,
        { 
          headers: new HttpHeaders({
            'ngrok-skip-browser-warning': "69420"  // ✅ Do NOT set 'Content-Type'
          }),
          reportProgress: true,
          observe: 'response'
        }
      ).toPromise();
  
      console.log('✅ Upload Response:', response);
  
      if (response?.status !== 200) {
        console.error('🚨 Upload failed! Server response:', response);
        alert('⚠️ Upload failed! Check console for details.');
        return '';
      }
  
      const fileUrl = response.body?.fileUrl;
      if (!fileUrl) {
        throw new Error('🚨 File URL not returned from the server');
      }
  
      return fileUrl;
    } catch (err: any) {
      console.error('❌ File upload failed:', err);
      alert(`⚠️ File upload failed!\nError: ${err.message || err.statusText || 'Unknown error'}`);
      return '';
    }
  }
  
  
  
  
  
  async addUser() {
    if (!this.newUser.name || !this.newUser.client_id || !this.newUser.email) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      console.log('Adding client:', this.newUser);
      await this.http.post(this.addUserApi, this.newUser, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json;charset=UTF-8' }),
        observe: 'response'
      }).toPromise();
      console.log('Client Added Successfully');

      console.log('Creating folder for client:', this.newUser.name);
      await this.http.post(this.createFolderApi, {
        username: this.newUser.name,
        client_id: this.newUser.client_id
      }, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        observe: 'response'
      }).toPromise();
      console.log('Folder Created Successfully');

      if (this.uploadedFile) {
        console.log('Uploading file for:', this.newUser.name);
        const fileUrl = await this.uploadProposalFile();
        if (!fileUrl) {
          console.error('File upload failed, stopping process.');
          alert('File upload failed. Please try again.');
          return;
        }
        this.newUser.file = fileUrl;
      }

      console.log('Updating UI with new client:', this.newUser);
      this.users.unshift({ ...this.newUser });
      this.resetForm();
      alert('New client added successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing the request. Please try again.');
    }
  }

  resetForm() {
    this.newUser = { 
      name: '', 
      client_id: '',
      email: '',
      file: ''
    };
    this.uploadedFile = null;
    this.showUserForm = false;
  }

  viewContract(user: User) {
    if (user.file) {
      console.log('Opening document:', user.file);
      window.open(user.file, '_blank');
    } else {
      alert(`No document available for ${user.name}`);
    }
  }
}