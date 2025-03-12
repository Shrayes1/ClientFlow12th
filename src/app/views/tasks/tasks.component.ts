import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';

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
    IconModule
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent {
  isLinear = false; // Non-linear to allow free movement and clicking on completed/active steps
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fifthFormGroup: FormGroup;
  stepCompleted: boolean[] = [false, false, false, false, false];
  completionTimes: (string | null)[] = [null, null, null, null, null]; // Array to store completion times
  activeStepIndex: number = 0; // Track the active step for file upload display

  uploadProgress = 0;
  fileName: string | null = null;
  fileSize: string | null = null;
  isUploading = false;

  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({
      clientAddition: ['', Validators.required]
    });

    this.secondFormGroup = this._formBuilder.group({
      draftContract: ['', Validators.required]
    });

    this.thirdFormGroup = this._formBuilder.group({
      finalContract: ['', Validators.required]
    });

    this.fourthFormGroup = this._formBuilder.group({
      releaseInvoice: ['', Validators.required]
    });

    this.fifthFormGroup = this._formBuilder.group({
      paymentReceived: ['', Validators.required]
    });
  }

  // Method to handle step completion and move to the next step
  onStepComplete(stepIndex: number, stepper: any) {
    this.stepCompleted[stepIndex] = true;
    this.completionTimes[stepIndex] = new Date().toLocaleString(); // Log current date and time
    stepper.steps.toArray()[stepIndex].completed = true; // Mark the step as completed for UI
    if (stepIndex < stepper.steps.length - 1) { // Prevent moving past the last step
      this.activeStepIndex = stepIndex + 1; // Update active step
      stepper.next(); // Move to the next step
    }
  }

  // Method to reset a specific step
  resetStep(stepIndex: number, stepper: any) {
    this.stepCompleted[stepIndex] = false;
    this.completionTimes[stepIndex] = null; // Clear completion time
    stepper.steps.toArray()[stepIndex].completed = false; // Mark step as incomplete
    if (stepIndex === 1 || stepIndex === 2) { // Reset file upload if applicable
      this.cancelUpload();
    }
  }

  updateStepProgress(stepIndex: number, event: any) {
    const checkboxes = document.querySelectorAll(
      `mat-vertical-stepper:nth-child(${stepIndex + 1}) mat-checkbox input`
    );
    const checkedCheckboxes = document.querySelectorAll(
      `mat-vertical-stepper:nth-child(${stepIndex + 1}) mat-checkbox input:checked`
    );
    
    this.stepCompleted[stepIndex] = checkedCheckboxes.length === checkboxes.length;
  }

  onFileSelected(event: Event, stepIndex: number) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.fileName = file.name;
      this.fileSize = (file.size / 1024).toFixed(2) + ' KB';
      this.uploadProgress = 0;
      this.isUploading = true;
      this.activeStepIndex = stepIndex; // Set the active step for file display

      // Simulating upload progress
      this.simulateUpload();
    }
  }

  simulateUpload() {
    const interval = setInterval(() => {
      if (this.uploadProgress < 100) {
        this.uploadProgress += 10;
      } else {
        clearInterval(interval);
        this.isUploading = false;
      }
    }, 500);
  }

  cancelUpload() {
    this.uploadProgress = 0;
    this.fileName = null;
    this.fileSize = null;
    this.isUploading = false;
  }

  saveAndContinue(stepIndex: number, stepper: any) {
    if (this.uploadProgress === 100) {
      alert('File uploaded successfully!');
      this.onStepComplete(stepIndex, stepper); // Move to next step after save
    } else {
      alert('File is still uploading...');
    }
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  }
}