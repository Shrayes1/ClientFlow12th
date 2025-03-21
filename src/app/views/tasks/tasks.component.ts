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

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  date: string;
  url: string;
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

  constructor(private _formBuilder: FormBuilder, private cdr: ChangeDetectorRef) {
    this.firstFormGroup = this._formBuilder.group({ clientAddition: [''] });
    this.secondFormGroup = this._formBuilder.group({ draftContract: [''] });
    this.thirdFormGroup = this._formBuilder.group({ finalContract: [''] });
    this.fourthFormGroup = this._formBuilder.group({ releaseInvoice: [''] });
    this.fifthFormGroup = this._formBuilder.group({ paymentReceived: [''] });
  }

  ngOnInit() {
    try {
      const storedDraftFiles = localStorage.getItem('uploadedDraftFiles');
      if (storedDraftFiles) {
        this.uploadedDraftFiles = JSON.parse(storedDraftFiles);
        this.filteredDraftFiles = [...this.uploadedDraftFiles];
      }
      const storedFinalContract = localStorage.getItem('finalContract');
      if (storedFinalContract) {
        this.finalContract = JSON.parse(storedFinalContract);
      }
      const storedInvoiceFiles = localStorage.getItem('uploadedInvoiceFiles');
      if (storedInvoiceFiles) {
        this.uploadedInvoiceFiles = JSON.parse(storedInvoiceFiles);
        this.filteredInvoiceFiles = [...this.uploadedInvoiceFiles];
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }

    this.sortFiles();
    this.filterFiles();
    this.sortInvoiceFiles();
    this.filterInvoiceFiles();
    this.cdr.detectChanges();
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

      this.simulateUpload(file, stepIndex);
      fileInput.value = '';
    }
  }

  simulateUpload(file: File, stepIndex: number) {
    try {
      const fileUrl = URL.createObjectURL(file);

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
            date: new Date().toLocaleString(), // Use toLocaleString for readability
            url: fileUrl
          };

          if (stepIndex === 1) {
            this.uploadedDraftFiles.unshift(uploadedFile);
            this.sortFiles();
            this.filterFiles();
          } else if (stepIndex === 2) {
            this.finalContract = uploadedFile;
          } else if (stepIndex === 3) {
            this.uploadedInvoiceFiles.unshift(uploadedFile);
            this.sortInvoiceFiles();
            this.filterInvoiceFiles();
          }
          this.cdr.detectChanges();
        }
      }, 500);
    } catch (error) {
      console.error('Upload simulation failed:', error);
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
      if (stepIndex === 1) {
        localStorage.setItem('uploadedDraftFiles', JSON.stringify(this.uploadedDraftFiles));
      } else if (stepIndex === 2) {
        localStorage.setItem('finalContract', JSON.stringify(this.finalContract));
      } else if (stepIndex === 3) {
        localStorage.setItem('uploadedInvoiceFiles', JSON.stringify(this.uploadedInvoiceFiles));
      }
      // Removed automatic step advance here; "Continue" handles it
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
    console.log('sortInvoiceFiles triggered with invoiceSortOrder:', this.invoiceSortOrder);
    if (!this.uploadedInvoiceFiles || this.uploadedInvoiceFiles.length === 0) {
      this.uploadedInvoiceFiles = [];
      this.filteredInvoiceFiles = [];
      return;
    }

    this.uploadedInvoiceFiles = [...this.uploadedInvoiceFiles].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (isNaN(dateA) || isNaN(dateB)) {
        console.warn('Invalid date format detected:', a.date, b.date);
        return 0;
      }
      console.log(`Comparing dates: ${a.date} (${dateA}) vs ${b.date} (${dateB})`);
      return this.invoiceSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    this.filterInvoiceFiles();
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    console.log('Sorted invoice files:', this.uploadedInvoiceFiles);
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

  downloadFile(file: UploadedFile) {
    const link = document.createElement('a');
    link.href = file.url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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