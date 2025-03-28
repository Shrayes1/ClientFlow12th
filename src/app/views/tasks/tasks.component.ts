import { Component, ChangeDetectorRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';
import { FormsModule } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  date: string;
  url: string;
  amount?: number;
  plan: string;
  status: string;
  step?: number;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    IconModule,
    FormsModule
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private apiBaseUrl = 'https://13c7-14-143-149-238.ngrok-free.app';

  isLinear = false;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fifthFormGroup: FormGroup;
  stepCompleted: boolean[] = [false, false, false, false, false];
  completionTimes: (string | null)[] = [null, null, null, null, null];
  activeStepIndex: number = 0;

  uploadProgress = 0;
  fileName: string | null = null;
  fileSize: string | null = null;
  isUploading = false;

  uploadedDraftFiles: UploadedFile[] = [];
  filteredDraftFiles: UploadedFile[] = [];
  finalContract: UploadedFile | null = null;
  uploadedInvoiceFiles: UploadedFile[] = [];
  filteredInvoiceFiles: UploadedFile[] = [];

  searchQuery = '';
  sortOrder = 'desc';
  invoiceSearchQuery = '';
  invoiceSortOrder = 'desc';

  selectedClient: { username: string; client_id: string } = { username: '', client_id: '' };
  clientId: string = '';

  constructor(
    private _formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.firstFormGroup = this._formBuilder.group({ clientAddition: [''] });
    this.secondFormGroup = this._formBuilder.group({ draftContract: [''] });
    this.thirdFormGroup = this._formBuilder.group({ finalContract: [''] });
    this.fourthFormGroup = this._formBuilder.group({ releaseInvoice: [''] });
    this.fifthFormGroup = this._formBuilder.group({ paymentReceived: [''] });
  }

  ngOnInit() {
    console.log('TasksComponent initialized');
    try {
      const storedClient = sessionStorage.getItem('selectedClient');

      this.route.queryParams.subscribe(params => {
        this.clientId = params['clientId'] || 'default-client-id';
      });

      if (storedClient) {
        this.selectedClient = JSON.parse(storedClient);

        if (this.selectedClient?.client_id && this.selectedClient?.username) {
          console.log(`📌 Loaded client from sessionStorage: ${this.selectedClient.username} (Client ID: ${this.selectedClient.client_id})`);
          if (!this.clientId || this.clientId === 'default-client-id') {
            this.clientId = this.selectedClient.client_id;
          }
          this.loadTaskProgress(this.selectedClient.client_id);
          this.loadUserTasks(this.selectedClient.client_id, this.selectedClient.username);
          this.loadFilesForClient(this.selectedClient.client_id);
          this.fetchContracts();
        } else {
          console.warn('⚠️ Client ID or Username is missing! Redirecting...');
          this.router.navigate(['/contract-add']);
          return;
        }
      } else {
        console.warn('⚠️ No client found in sessionStorage! Redirecting to client selection...');
        this.router.navigate(['/contract-add']);
        return;
      }

      this.loadFilesForClient(this.selectedClient.client_id);

    } catch (error) {
      console.error('❌ Error loading client data:', error);
    }

    this.sortFiles();
    this.filterFiles();
    this.sortInvoiceFiles();
    this.filterInvoiceFiles();
    this.cdr.detectChanges();
  }

  loadUserTasks(clientId: string, username: string) {
    console.log(`📌 Fetching tasks for ${username} (Client ID: ${clientId})`);
    fetch(`https://13c7-14-143-149-238.ngrok-free.app/tasks?clientId=${clientId}`)
      .then(response => response.json())
      .then(tasks => {
        console.log(`✅ Loaded tasks for ${username}:`, tasks);
      })
      .catch(error => console.error('❌ Error fetching user tasks:', error));
  }

  ngAfterViewInit() {
    this.activeStepIndex = this.stepper.selectedIndex;
    this.refreshStepData();
    this.cdr.detectChanges();
  }

  onCompleteClick(step: number, stepper: any, client_id: string) {
    this.onStepComplete(step, stepper);
    this.router.navigate(['/questionnaire'], { queryParams: { clientId: this.selectedClient.client_id } });
  }

  onStepComplete(stepIndex: number, stepper: MatStepper) {
    this.stepCompleted[stepIndex] = true;
    this.completionTimes[stepIndex] = new Date().toLocaleString();
    stepper.steps.toArray()[stepIndex].completed = true;

    if (stepIndex < stepper.steps.length - 1) {
      stepper.next();
      this.activeStepIndex = stepper.selectedIndex;
      this.refreshStepData();
    }

    this.saveTaskProgress();
    this.sendTaskProgressToBackend(stepIndex);
  }

  sendTaskProgressToBackend(stepIndex: number) {
    if (!this.selectedClient) {
      console.warn('⚠️ No selected client for progress update.');
      return;
    }

    const progressUpdate = {
      client_id: this.selectedClient.client_id,
      username: this.selectedClient.username,
      step: stepIndex,
      completed: this.stepCompleted[stepIndex],
      timestamp: this.completionTimes[stepIndex]
    };

    fetch(`${this.apiBaseUrl}/task-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressUpdate)
    })
      .then(response => response.json())
      .then(data => console.log(`✅ Task progress updated for step ${stepIndex}:`, data))
      .catch(error => console.error('❌ Error updating task progress:', error));
  }

  resetStep(stepIndex: number, stepper: MatStepper) {
    this.stepCompleted[stepIndex] = false;
    this.completionTimes[stepIndex] = null;
    stepper.steps.toArray()[stepIndex].completed = false;
    if (stepIndex === 1 || stepIndex === 2 || stepIndex === 3) {
      this.cancelUpload();
    }
    this.cdr.detectChanges();
  }

  loadTaskProgress(clientId: string) {
    try {
      const progressKey = `taskProgress_${clientId}`;
      const storedProgress = localStorage.getItem(progressKey);

      if (storedProgress) {
        const parsedProgress = JSON.parse(storedProgress);
        this.stepCompleted = parsedProgress.stepCompleted?.length ? parsedProgress.stepCompleted : [false, false, false, false, false];
        this.completionTimes = parsedProgress.completionTimes?.length ? parsedProgress.completionTimes : [null, null, null, null, null];
        this.uploadedDraftFiles = parsedProgress.draftFiles || [];
        this.finalContract = parsedProgress.finalContract || null;
        this.uploadedInvoiceFiles = parsedProgress.invoiceFiles || [];
        console.log(`✅ Loaded progress for Client ID: ${clientId}`, parsedProgress);
      } else {
        console.log(`ℹ️ No saved progress for Client ID: ${clientId}, starting fresh.`);
        this.stepCompleted = [false, false, false, false, false];
        this.completionTimes = [null, null, null, null, null];
        this.uploadedDraftFiles = [];
        this.finalContract = null;
        this.uploadedInvoiceFiles = [];
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error loading task progress:', error);
    }
  }

  onFileSelected(event: Event, stepIndex: number) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only .doc, .docx, and .pdf are allowed.');
        return;
      }

      this.fileName = file.name;
      this.fileSize = (file.size / 1024).toFixed(2) + ' KB';
      this.uploadProgress = 0;
      this.isUploading = true;

      if (this.selectedClient) {
        localStorage.setItem(`uploadedFile_${this.selectedClient.client_id}_${stepIndex}`, JSON.stringify({
          name: this.fileName,
          size: this.fileSize,
          date: new Date().toLocaleString()
        }));
      }

      if (stepIndex === 2) {
        this.uploadFinalContractToBackend(file); // Fixed method
      } else if (stepIndex === 3) {
        this.uploadInvoice(file);
      } else {
        this.uploadContractToBackend(file, stepIndex);
      }

      fileInput.value = '';
    }
  }

  uploadContractToBackend(file: File, stepIndex: number) {
    if (!this.selectedClient) {
      console.error('❌ No selected client for file upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', this.selectedClient.client_id);
    formData.append('username', this.selectedClient.username);

    this.uploadProgress = 0;
    this.isUploading = true;

    this.http.post(`${this.apiBaseUrl}/upload-contract`, formData).subscribe(
      (response: any) => {
        this.isUploading = false;
        this.uploadProgress = 100;

        const uploadedFile: UploadedFile = {
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          type: this.getFileType(file.name),
          date: new Date().toLocaleString(),
          url: response.url || URL.createObjectURL(file),
          status: 'Pending',
          amount: 0,
          plan: 'Basic',
          step: stepIndex
        };

        if (stepIndex === 1) {
          this.uploadedDraftFiles.unshift(uploadedFile);
          this.sortFiles();
          this.filterFiles();
        }

        this.cdr.detectChanges();
        console.log(`✅ File uploaded to backend: ${file.name}`);
      },
      error => {
        console.error('❌ Error uploading file to backend:', error);
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    );

    const interval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      } else {
        clearInterval(interval);
      }
    }, 500);
  }

  fetchContracts(): void {
    console.log('Fetching contracts from:', `${this.apiBaseUrl}/list-contract/${this.selectedClient.username}/${this.selectedClient.client_id}`);
    this.http.get<any>(`${this.apiBaseUrl}/list-contract/${this.selectedClient.username}/${this.selectedClient.client_id}`, {
      headers: new HttpHeaders({ 'Accept': 'application/json', 'ngrok-skip-browser-warning': "69420" })
    }).subscribe({
      next: (response) => {
        const contracts = response.contracts || response || [];
        console.log('Fetched Contracts:', contracts);

        const mappedContracts: UploadedFile[] = contracts.map((contract: any) => ({
          name: contract.name,
          size: contract.size || 'Unknown',
          type: this.getFileType(contract.name),
          date: contract.date || new Date().toLocaleString(),
          url: contract.url || '',
          status: contract.status || 'Pending',
          amount: contract.amount || 0,
          plan: contract.plan || 'Basic',
          step: contract.step || undefined
        }));

        this.finalContract = mappedContracts.find(c => c.step === 2) || null;
        this.uploadedDraftFiles = mappedContracts.filter(c => c.step === 1 || c.step === undefined);
        this.uploadedInvoiceFiles = mappedContracts.filter(c => c.step === 3);
        this.filteredDraftFiles = [...this.uploadedDraftFiles];
        this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles];

        this.sortFiles();
        this.filterFiles();
        this.sortInvoiceFiles();
        this.filterInvoiceFiles();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching contracts:', error);
        alert(`Failed to fetch contracts: ${error.statusText || error.message}`);
      }
    });
  }

  simulateUpload(file: File, stepIndex: number) {
    try {
      const fileUrl = URL.createObjectURL(file);
      this.uploadProgress = 0;
      this.isUploading = true;

      const interval = setInterval(() => {
        if (this.uploadProgress < 100) {
          this.uploadProgress += 10;
        } else {
          clearInterval(interval);
          this.isUploading = false;

          const uploadedFile: UploadedFile = {
            name: file.name,
            size: this.fileSize!,
            type: this.getFileType(file.name),
            date: new Date().toLocaleString(),
            url: fileUrl,
            status: 'Pending',
            amount: 0,
            plan: 'Basic'
          };

          if (stepIndex === 1) {
            this.uploadedDraftFiles.unshift(uploadedFile);
            this.sortFiles();
            this.filterFiles();
          } else if (stepIndex === 2) {
            this.finalContract = uploadedFile;
          } else if (stepIndex === 3) {
            let latestInvoiceNumber = 1;
            if (this.uploadedInvoiceFiles.length > 0) {
              const invoiceNumbers = this.uploadedInvoiceFiles.map(file => {
                const match = file.name.match(/Invoice#(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
              });
              latestInvoiceNumber = Math.max(...invoiceNumbers) + 1;
            }
            uploadedFile.name = `Invoice#${latestInvoiceNumber}`;
            this.uploadedInvoiceFiles.unshift(uploadedFile);
            this.sortInvoiceFiles();
            this.filterInvoiceFiles();
          }

          this.cdr.detectChanges();
        }
      }, 500);
    } catch (error) {
      console.error('❌ Upload simulation failed:', error);
      this.isUploading = false;
    }
  }

  cancelUpload() {
    this.uploadProgress = 0;
    this.fileName = null;
    this.fileSize = null;
    this.isUploading = false;
    this.cdr.detectChanges();
  }

  saveAndContinue(stepIndex: number, stepper: MatStepper) {
    if (this.uploadProgress === 100) {
      alert('File uploaded successfully!');

      if (this.selectedClient) {
        const clientId = this.selectedClient.client_id;

        if (stepIndex === 1) {
          localStorage.setItem(`uploadedDraftFiles_${clientId}`, JSON.stringify(this.uploadedDraftFiles));
        } else if (stepIndex === 2) {
          localStorage.setItem(`finalContract_${clientId}`, JSON.stringify(this.finalContract));
          this.cdr.detectChanges();
        } else if (stepIndex === 3) {
          localStorage.setItem(`uploadedInvoiceFiles_${clientId}`, JSON.stringify(this.uploadedInvoiceFiles));
        }

        this.saveTaskProgress();
        this.onStepComplete(stepIndex, stepper);
      }
    } else {
      alert('File is still uploading...');
    }
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  }

  sortFiles() {
    console.log('sortFiles triggered with sortOrder:', this.sortOrder);
    if (!this.uploadedDraftFiles || this.uploadedDraftFiles.length === 0) {
      this.uploadedDraftFiles = [];
      this.filteredDraftFiles = [];
      return;
    }

    this.uploadedDraftFiles = [...this.uploadedDraftFiles].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (isNaN(dateA) || isNaN(dateB)) {
        console.warn('Invalid date format detected:', a.date, b.date);
        return 0;
      }
      console.log(`Comparing dates: ${a.date} (${dateA}) vs ${b.date} (${dateB})`);
      return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    this.filterFiles();
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('Sorted draft files:', this.uploadedDraftFiles);
  }

  filterFiles() {
    console.log('filterFiles triggered with searchQuery:', this.searchQuery);
    if (!this.uploadedDraftFiles || this.uploadedDraftFiles.length === 0) {
      this.filteredDraftFiles = [];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    if (query === '') {
      this.filteredDraftFiles = [...this.uploadedDraftFiles];
    } else {
      this.filteredDraftFiles = this.uploadedDraftFiles.filter(file => {
        const nameMatch = file.name.toLowerCase().includes(query);
        const dateMatch = file.date.toLowerCase().includes(query);
        console.log(`Checking file: ${file.name}, ${file.date} - Name match: ${nameMatch}, Date match: ${dateMatch}`);
        return nameMatch || dateMatch;
      });
    }

    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('Filtered draft files:', this.filteredDraftFiles);
  }

  async uploadFinalContractToBackend(file: File): Promise<string> {
    if (!file) {
      console.warn('⚠️ No file selected for upload.');
      return '';
    }

    if (!this.selectedClient || !this.selectedClient.client_id) {
      console.error('❌ No selected client or client_id for upload.');
      return '';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', this.selectedClient.client_id);
    formData.append('username', this.selectedClient.username); // Explicitly set step for final contract

    console.log('📤 Uploading final contract to:', `${this.apiBaseUrl}/upload-final-contract`);
    console.log('📂 File Name:', file.name);
    console.log('🆔 Client ID:', this.selectedClient.client_id);

    this.uploadProgress = 0;
    this.isUploading = true;

    try {
      const response = await this.http.post<{ message: string; filename: string }>(
        `${this.apiBaseUrl}/upload-final-contract`,
        formData,
        {
          headers: new HttpHeaders({ 'ngrok-skip-browser-warning': '69420' }),
          reportProgress: true,
          observe: 'response'
        }
      ).toPromise();

      console.log('✅ Server response:', response);

      if (response?.status === 200 && response.body) {
        const { message, filename } = response.body;
        console.log('✅ Final contract uploaded successfully:', filename);
        alert(`🎉 Success!\n${message}`);

        this.finalContract = {
          name: filename,
          size: (file.size / 1024).toFixed(2) + ' KB',
          type: this.getFileType(file.name),
          date: new Date().toLocaleString(),
          url: URL.createObjectURL(file), // Use server-provided URL if available
          status: 'Pending',
          amount: 0,
          plan: 'Basic',
          step: 2
        };

        this.uploadProgress = 100;
        this.isUploading = false;
        this.cdr.detectChanges();
        this.fetchContracts();

        return filename;
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (error: any) {
      console.error('❌ Final contract upload failed:', error);
      alert(`⚠️ File upload failed!\nError: ${error.message || error.statusText || 'Unknown error'}`);
      this.uploadProgress = 0;
      this.isUploading = false;
      this.cdr.detectChanges();
      return '';
    }
  }

  async uploadInvoice(file: File): Promise<string> {
    if (!file) {
      console.warn('⚠️ No file selected for upload.');
      return '';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', this.selectedClient.client_id);
    formData.append('username', this.selectedClient.username);
    formData.append('invoice_id', `Invoice#${Date.now()}`);

    console.log('📤 Uploading invoice to:', `${this.apiBaseUrl}/upload-bill`);
    console.log('📂 File Name:', file.name);
    console.log('🆔 Client ID:', this.selectedClient.client_id);

    try {
      const response = await this.http.post<{ message: string; filename: string }>(
        `${this.apiBaseUrl}/upload-bill`,
        formData,
        {
          headers: new HttpHeaders({ 'ngrok-skip-browser-warning': '69420' }),
          reportProgress: true,
          observe: 'response'
        }
      ).toPromise();

      if (response?.status !== 200) {
        throw new Error(`❌ Upload failed with status: ${response?.status}`);
      }

      const responseBody = response.body;
      if (responseBody?.message && responseBody?.filename) {
        console.log('✅ Invoice uploaded successfully:', responseBody.filename);
        alert(`🎉 Success!\n${responseBody.message}`);

        const uploadedFile: UploadedFile = {
          name: responseBody.filename,
          size: (file.size / 1024).toFixed(2) + ' KB',
          type: this.getFileType(file.name),
          date: new Date().toLocaleString(),
          url: URL.createObjectURL(file),
          status: 'Pending',
          amount: 0,
          plan: 'Basic',
          step: 3
        };
        this.uploadedInvoiceFiles.unshift(uploadedFile);
        this.sortInvoiceFiles();
        this.filterInvoiceFiles();
        this.cdr.detectChanges();

        this.fetchContracts();
        return responseBody.filename;
      } else {
        throw new Error('❌ Unexpected response format from the server');
      }
    } catch (err: any) {
      console.error('❌ Invoice upload failed:', err);
      alert(`⚠️ File upload failed!\nError: ${err.message || err.statusText || 'Unknown error'}`);
      return '';
    }
  }

  sortInvoiceFiles() {
    console.log('🔄 Sorting invoices...');

    if (!this.uploadedInvoiceFiles || this.uploadedInvoiceFiles.length === 0) {
      this.uploadedInvoiceFiles = [];
      this.filteredInvoiceFiles = [];
      return;
    }

    this.uploadedInvoiceFiles.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (isNaN(dateA) || isNaN(dateB)) {
        console.warn('Invalid date format detected:', a.date, b.date);
        return 0;
      }

      return dateB - dateA;
    });

    this.uploadedInvoiceFiles.forEach((file, index) => {
      file.name = `Invoice#${this.uploadedInvoiceFiles.length - index}`;
    });

    this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles];

    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('✅ Sorted and numbered invoice files:', this.filteredInvoiceFiles);
  }

  filterInvoiceFiles() {
    console.log('filterInvoiceFiles triggered with invoiceSearchQuery:', this.invoiceSearchQuery);
    if (!this.uploadedInvoiceFiles || this.uploadedInvoiceFiles.length === 0) {
      this.filteredInvoiceFiles = [];
      return;
    }

    const query = this.invoiceSearchQuery.toLowerCase().trim();
    if (query === '') {
      this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles];
    } else {
      this.filteredInvoiceFiles = this.uploadedInvoiceFiles.filter(file => {
        const nameMatch = file.name.toLowerCase().includes(query);
        const dateMatch = file.date.toLowerCase().includes(query);
        console.log(`Checking file: ${file.name}, ${file.date} - Name match: ${nameMatch}, Date match: ${dateMatch}`);
        return nameMatch || dateMatch;
      });
    }

    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('Filtered invoice files:', this.filteredInvoiceFiles);
  }

  loadFilesForClient(clientId: string) {
    try {
      console.log(`📂 Loading files for Client ID: ${clientId}`);

      const storedDraftFiles = localStorage.getItem(`uploadedDraftFiles_${clientId}`);
      this.uploadedDraftFiles = storedDraftFiles ? JSON.parse(storedDraftFiles) : [];
      this.filteredDraftFiles = [...this.uploadedDraftFiles];

      const storedFinalContract = localStorage.getItem(`finalContract_${clientId}`);
      this.finalContract = storedFinalContract ? JSON.parse(storedFinalContract) : null;

      const storedInvoiceFiles = localStorage.getItem(`uploadedInvoiceFiles_${clientId}`);
      this.uploadedInvoiceFiles = storedInvoiceFiles ? JSON.parse(storedInvoiceFiles) : [];
      this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles];

      this.sortInvoiceFiles();

      console.log(`✅ Successfully loaded files for Client ID: ${clientId}`);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error loading files for Client ID:', clientId, error);
    }
  }

  downloadFile(file: UploadedFile) {
    const link = document.createElement('a');
    link.href = file.url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (this.selectedClient) {
      const clientId = this.selectedClient.client_id;
      let downloadHistory = JSON.parse(localStorage.getItem(`downloadHistory_${clientId}`) || '[]');
      downloadHistory.push({ name: file.name, date: new Date().toLocaleString() });
      localStorage.setItem(`downloadHistory_${clientId}`, JSON.stringify(downloadHistory));
    }
  }

  selectStep(stepIndex: number) {
    console.log('Manually selecting step:', stepIndex);
    this.activeStepIndex = stepIndex;
    this.stepper.selectedIndex = stepIndex;
    this.refreshStepData();
    this.cdr.detectChanges();
  }

  onStepChange(selectedIndex: number) {
    console.log('Selection change event to:', selectedIndex);
    this.activeStepIndex = selectedIndex;
    setTimeout(() => {
      this.refreshStepData();
      this.cdr.detectChanges();
    }, 0);
  }

  saveTaskProgress() {
    try {
      if (this.selectedClient) {
        const progressKey = `taskProgress_${this.selectedClient.client_id}`;
        const progressData = {
          stepCompleted: [...this.stepCompleted],
          completionTimes: [...this.completionTimes],
          draftFiles: [...this.uploadedDraftFiles],
          finalContract: this.finalContract,
          invoiceFiles: [...this.uploadedInvoiceFiles]
        };

        localStorage.setItem(progressKey, JSON.stringify(progressData));
        console.log(`✅ Saved progress for Client ID: ${this.selectedClient.client_id}`, progressData);

        this.cdr.detectChanges();
      } else {
        console.warn('⚠️ No selected client to save progress for.');
      }
    } catch (error) {
      console.error('❌ Error saving task progress:', error);
    }
  }

  refreshStepData() {
    console.log('Refreshing step data for index:', this.activeStepIndex);
    if (this.activeStepIndex === 1) {
      this.sortFiles();
      this.filterFiles();
    } else if (this.activeStepIndex === 2) {
      this.cdr.detectChanges();
    } else if (this.activeStepIndex === 3) {
      this.sortInvoiceFiles();
      this.filterInvoiceFiles();
    }
  }

  completeTask(clientId: string) {
    this.router.navigate(['/questionnaire'], { queryParams: { clientId: clientId } });
  }
}