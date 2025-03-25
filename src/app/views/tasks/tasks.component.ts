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
interface UploadedFile {
  name: string;
  size: string;
  type: string;
  date: string;
  url: string;
  amount?: number;
  plan: string;
  status: string;
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
  sortOrder = 'desc'; // Default: Newest First
  invoiceSearchQuery = '';
  invoiceSortOrder = 'desc'; // Default: Newest First

  selectedClient: { username: string; client_id: string } = { username: '', client_id: '' };

  constructor(private _formBuilder: FormBuilder, private cdr: ChangeDetectorRef,private route: ActivatedRoute,   private router: Router) {
    this.firstFormGroup = this._formBuilder.group({ clientAddition: [''] });
    this.secondFormGroup = this._formBuilder.group({ draftContract: [''] });
    this.thirdFormGroup = this._formBuilder.group({ finalContract: [''] });
    this.fourthFormGroup = this._formBuilder.group({ releaseInvoice: [''] });
    this.fifthFormGroup = this._formBuilder.group({ paymentReceived: [''] });
  }
  ngOnInit() {
    try {
        // 🔹 Retrieve client_id & username from sessionStorage
        const storedClient = sessionStorage.getItem('selectedClient');

        if (storedClient) {
            this.selectedClient = JSON.parse(storedClient);

            // ✅ Ensure selectedClient is valid before accessing properties
            if (this.selectedClient?.client_id && this.selectedClient?.username) {
                console.log(`📌 Loaded client from sessionStorage: ${this.selectedClient.username} (Client ID: ${this.selectedClient.client_id})`);

                // ✅ Load task progress for this client
                this.loadTaskProgress(this.selectedClient.client_id);

                // ✅ Load user tasks from the backend
                this.loadUserTasks(this.selectedClient.client_id, this.selectedClient.username);

                // ✅ Load files for this client
                this.loadFilesForClient(this.selectedClient.client_id);
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

        // 🔹 Ensure files are properly loaded for the client
        this.loadFilesForClient(this.selectedClient.client_id);
        
    } catch (error) {
        console.error('❌ Error loading client data:', error);
    }

    // 🔹 Update UI
    this.sortFiles();
    this.filterFiles();
    this.sortInvoiceFiles();
    this.filterInvoiceFiles();
    this.cdr.detectChanges();
}

  
  
  
  
  
  // ✅ Function to load user tasks
  loadUserTasks(clientId: string, username: string) {
    console.log(`📌 Fetching tasks for ${username} (Client ID: ${clientId})`);

    fetch(`https://9aae-14-143-149-238.ngrok-free.app=${clientId}`)
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

  fetch('https://9aae-14-143-149-238.ngrok-free.app', {
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

      // Save file details for tracking per user
      if (this.selectedClient) {
        localStorage.setItem(`uploadedFile_${this.selectedClient.client_id}_${stepIndex}`, JSON.stringify({ 
          name: this.fileName, 
          size: this.fileSize,
          date: new Date().toLocaleString()
        }));
      }

      this.simulateUpload(file, stepIndex);
      fileInput.value = '';
    }
}

// In simulateUpload method - fixed to handle both draft and invoice files correctly
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

        // Handle different steps appropriately
        if (stepIndex === 1) {  // Draft contracts
          this.uploadedDraftFiles.unshift(uploadedFile);
          this.sortFiles();
          this.filterFiles();
        } else if (stepIndex === 2) {  // Final contract
          this.finalContract = uploadedFile;
        } else if (stepIndex === 3) {  // Invoices
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
          this.cdr.detectChanges();  // Force update to show final contract
        } else if (stepIndex === 3) {
          localStorage.setItem(`uploadedInvoiceFiles_${clientId}`, JSON.stringify(this.uploadedInvoiceFiles));
        }
  
        this.saveTaskProgress();
        this.onStepComplete(stepIndex, stepper);  // Progress to next step
      }
    } else {
      alert('File is still uploading...');
    }
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  }

  // Draft Files (Stage 2)
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
      this.filteredDraftFiles = [...this.uploadedDraftFiles]; // Show all files if query is empty
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

  // Invoice Files (Stage 4)
  sortInvoiceFiles() {
    console.log('🔄 Sorting invoices...');

    if (!this.uploadedInvoiceFiles || this.uploadedInvoiceFiles.length === 0) {
        this.uploadedInvoiceFiles = [];
        this.filteredInvoiceFiles = [];
        return;
    }

    // 🔹 Step 1: Sort invoices by date in DESCENDING ORDER (latest first)
    this.uploadedInvoiceFiles.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        if (isNaN(dateA) || isNaN(dateB)) {
            console.warn('Invalid date format detected:', a.date, b.date);
            return 0;
        }

        return dateB - dateA; // Newest invoices first
    });

    // 🔹 Step 2: Assign invoice numbers in descending order
    this.uploadedInvoiceFiles.forEach((file, index) => {
        file.name = `Invoice#${this.uploadedInvoiceFiles.length - index}`;
    });

    this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles]; // Update filtered list

    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('✅ Sorted and numbered invoice files:', this.filteredInvoiceFiles);
}

sortInvoicesByDateAndAssignNumbers() {
  // 🔹 Step 1: Sort invoices by date in DESCENDING ORDER (latest first)
  this.uploadedInvoiceFiles.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // 🔹 Step 2: Assign invoice numbers (latest invoice gets the highest number)
  this.uploadedInvoiceFiles.forEach((file, index) => {
      file.name = `Invoice#${this.uploadedInvoiceFiles.length - index}`; // Highest number first
  });

  console.log("✅ Invoices sorted and numbered:", this.uploadedInvoiceFiles);
}


  filterInvoiceFiles() {
    console.log('filterInvoiceFiles triggered with invoiceSearchQuery:', this.invoiceSearchQuery);
    if (!this.uploadedInvoiceFiles || this.uploadedInvoiceFiles.length === 0) {
      this.filteredInvoiceFiles = [];
      return;
    }

    const query = this.invoiceSearchQuery.toLowerCase().trim();
    if (query === '') {
      this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles]; // Show all files if query is empty
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

        // ✅ Load Draft Files
        const storedDraftFiles = localStorage.getItem(`uploadedDraftFiles_${clientId}`);
        this.uploadedDraftFiles = storedDraftFiles ? JSON.parse(storedDraftFiles) : [];
        this.filteredDraftFiles = [...this.uploadedDraftFiles];

        // ✅ Load Final Contract
        const storedFinalContract = localStorage.getItem(`finalContract_${clientId}`);
        this.finalContract = storedFinalContract ? JSON.parse(storedFinalContract) : null;

        // ✅ Load Invoice Files
        const storedInvoiceFiles = localStorage.getItem(`uploadedInvoiceFiles_${clientId}`);
        this.uploadedInvoiceFiles = storedInvoiceFiles ? JSON.parse(storedInvoiceFiles) : [];
        this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles];

        // 🔹 Ensure invoice sorting and numbering is updated properly
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

    // Track file downloads per user
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
          stepCompleted: [...this.stepCompleted],  // Save current step progress
          completionTimes: [...this.completionTimes], // Save completion timestamps
          draftFiles: [...this.uploadedDraftFiles],  // Save uploaded draft files
          finalContract: this.finalContract,  // Save final contract
          invoiceFiles: [...this.uploadedInvoiceFiles]  // Save uploaded invoices
        };
  
        // ✅ Store per user
        localStorage.setItem(progressKey, JSON.stringify(progressData));
        console.log(`✅ Saved progress for Client ID: ${this.selectedClient.client_id}`, progressData);
  
        // 🔹 Force UI update
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
}