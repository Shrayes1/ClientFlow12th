import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { cilPlus } from '@coreui/icons';
import { Router } from '@angular/router';
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
  private apiBaseUrl = 'https://add-list-new-client.onrender.com/';
  private addUserApi = `${this.apiBaseUrl}add_client`;
  private createFolderApi = `https://a691-14-143-149-238.ngrok-free.app/create_folder`;
  private uploadFileApi = `https://a691-14-143-149-238.ngrok-free.app/upload_proposal/`;
  private getUsersApi = `${this.apiBaseUrl}get_all_clients`;

  users: User[] = [];

  newUser: User = {
    name: '',
    client_id: '',
    email: '',
    file: ''
  };

  constructor(private http: HttpClient,  private router: Router) {}

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
    formData.append('file', this.uploadedFile);
    formData.append('username', this.newUser.name);
    formData.append('client_id', this.newUser.client_id);

    console.log('📤 Uploading file to:', this.uploadFileApi);
    console.log('📂 File Name:', this.uploadedFile.name);
    console.log('🆔 Client ID:', this.newUser.client_id);

    try {
        const response = await this.http.post<{ message: string; filename: string }>(
            this.uploadFileApi,
            formData,
            {
                headers: new HttpHeaders({ 'ngrok-skip-browser-warning': "69420" }),
                reportProgress: true,
                observe: 'response'
            }
        ).toPromise();

        if (response?.status !== 200) {
            throw new Error(`❌ Upload failed with status: ${response?.status}`);
        }

        const responseBody = response.body;
        if (responseBody?.message && responseBody?.filename) {
            console.log('✅ File uploaded successfully:', responseBody.filename);
            alert(`🎉 Success!\n${responseBody.message}`);
            return responseBody.filename;
        } else {
            throw new Error('❌ Unexpected response format from the server');
        }

    } catch (err: any) {
        console.error('❌ File upload failed:', err);
        alert(`⚠️ File upload failed!\nError: ${err.message || err.statusText || 'Unknown error'}`);
        return '';
    }
}


async addUser() {
  if (!this.isFormValid()) {
      alert('Please fill in all required fields.');
      return;
  }

  try {
      // Step 1: Add client to backend
      console.log('Adding client:', this.newUser);
      const addResponse = await this.http.post(this.addUserApi, this.newUser, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json;charset=UTF-8' }),
          observe: 'response'
      }).toPromise();

      if (!addResponse || (addResponse.status !== 201 && addResponse.status !== 200)) {
          throw new Error('Failed to add client');
      }
      console.log('✅ Client Added Successfully');

      // Step 2: Ensure the folder is created BEFORE uploading the file
      console.log('📂 Creating folder for client:', this.newUser.name);
      const formData = new FormData();
      formData.append('username', this.newUser.name);
      formData.append('client_id', this.newUser.client_id);

      const folderResponse = await this.http.post(this.createFolderApi, formData, {
          headers: new HttpHeaders({ 'ngrok-skip-browser-warning': "69420" }),
          observe: 'response'
      }).toPromise();

      if (!folderResponse || (folderResponse.status !== 201 && folderResponse.status !== 200)) {
          throw new Error('Failed to create folder');
      }
      console.log('✅ Folder Created Successfully');

      // Step 3: Upload file **AFTER** folder is created
      let fileUrl = '';
      if (this.uploadedFile) {
          console.log('📤 Uploading file for:', this.newUser.name);
          fileUrl = await this.uploadProposalFile();
          if (!fileUrl) {
              throw new Error('File upload failed');
          }
          this.newUser.file = fileUrl;
      }

      // Step 4: Update UI in real-time by adding new user to the top
      console.log('✅ Updating UI with new client:', this.newUser);
      this.users.unshift({ ...this.newUser }); // Adds to top of array
      this.resetForm();
      alert('🎉 New client added successfully!');

  } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`⚠️ An error occurred: ${error.message || 'Please try again.'}`);
  }
}


  isFormValid(): boolean {
    return !!(this.newUser.name && this.newUser.client_id && this.newUser.email);
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

  storeClientData(user: any): void {
    console.log('🔹 Storing client data and navigating:', user);
  
    // ✅ Store client details in sessionStorage
    sessionStorage.setItem('selectedClient', JSON.stringify({
      username: user.name,
      client_id: user.client_id
    }));
  
    // ✅ Retrieve & print stored values
    const storedClient = JSON.parse(sessionStorage.getItem('selectedClient') || '{}');
    console.log('✅ Stored Username:', storedClient.username);
    console.log('✅ Stored Client ID:', storedClient.client_id);
  
    // ✅ Navigate to the tasks page
    this.router.navigate(['/tasks']);
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