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
  isLinear = true;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fifthFormGroup: FormGroup;
  stepCompleted: boolean[] = [false, false, false, false, false];

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

  updateStepProgress(stepIndex: number, event: any) {
    const checkboxes = document.querySelectorAll(
      `mat-vertical-stepper:nth-child(${stepIndex + 1}) mat-checkbox input`
    );
    const checkedCheckboxes = document.querySelectorAll(
      `mat-vertical-stepper:nth-child(${stepIndex + 1}) mat-checkbox input:checked`
    );
    
    this.stepCompleted[stepIndex] = checkedCheckboxes.length === checkboxes.length;
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.fileName = file.name;
      this.fileSize = (file.size / 1024).toFixed(2) + ' KB';
      this.uploadProgress = 0;
      this.isUploading = true;

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

  saveAndContinue() {
    if (this.uploadProgress === 100) {
      alert('File uploaded successfully!');
    } else {
      alert('File is still uploading...');
    }
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  }
}
