import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

// Core Services
import { ComplaintService } from '../../../services/complaint.service';

// Date validator function
function notFutureDate(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate > today) {
    return { futureDate: true };
  }
  return null;
}

@Component({
  selector: 'app-victim-complaint',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    HttpClientModule,
    RouterLink,
  
  ],
  templateUrl: './victim-complaint.html',
  styleUrls: ['./victim-complaint.css']
})
export class VictimComplaintComponent implements OnInit {
  currentStep = 1;
  complaintForm: FormGroup;
  isSubmitting = false;
  selectedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private complaintService: ComplaintService,
    private router: Router,
    private authService: AuthService
  ) {
    this.complaintForm = this.fb.group({
      // Step 1
      incidentDate: ['', [Validators.required, notFutureDate]],
      incidentLocation: [''],
      violenceType: ['', Validators.required],
      description: [
        '', 
        [
          Validators.required, 
          Validators.minLength(20), 
          Validators.maxLength(2000)
        ]
      ],
      
      // Step 2 - Updated field names to match backend DTO
      aggressorFullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      aggressorRelationship: ['', Validators.required],
      aggressorAdditionalDetails: ['', Validators.maxLength(1000)]
    });
  }

  // Getter for easy access to form fields
  get f() { return this.complaintForm.controls; }

  // Check if field is invalid
  isFieldInvalid(field: string) {
    const formControl = this.complaintForm.get(field);
    return formControl?.invalid && (formControl?.dirty || formControl?.touched);
  }

  ngOnInit(): void {}

  getFirstInvalidStep(): number {
    const step1Controls = ['incidentDate', 'violenceType', 'description'];
    const step2Controls = ['aggressorFullName', 'aggressorRelationship'];
    
    // Check step 1 fields
    const isStep1Valid = step1Controls.every(control => 
      !this.complaintForm.get(control)?.invalid
    );
    
    if (!isStep1Valid) return 1;
    
    // Check step 2 fields
    const isStep2Valid = step2Controls.every(control => 
      !this.complaintForm.get(control)?.invalid
    );
    
    if (!isStep2Valid) return 2;
    
    return 3; // All steps are valid
  }

  nextStep() {
    // Validate current step before proceeding
    let currentStepValid = true;
    
    if (this.currentStep === 1) {
      const step1Controls = ['incidentDate', 'violenceType', 'description'];
      step1Controls.forEach(control => {
        const controlObj = this.complaintForm.get(control);
        controlObj?.markAsTouched();
        if (controlObj?.invalid) {
          currentStepValid = false;
        }
      });
    } 
    else if (this.currentStep === 2) {
      const step2Controls = ['aggressorFullName', 'aggressorRelationship'];
      step2Controls.forEach(control => {
        const controlObj = this.complaintForm.get(control);
        controlObj?.markAsTouched();
        if (controlObj?.invalid) {
          currentStepValid = false;
        }
      });
    }
    
    // Only proceed to next step if current step is valid
    if (currentStepValid && this.currentStep < 3) {
      this.currentStep++;
      // Scroll to top of the form when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
    }
  }

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  async onSubmit() {
    // Check if user is logged in using AuthService
    if (!this.authService.isAuthenticated()) {
      // Redirect to login with return URL
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: this.router.routerState.snapshot.url 
        } 
      });
      return;
    }

    // If not on the last step, go to the next step instead of submitting
    if (this.currentStep < 3) {
      this.nextStep();
      return;
    }
    
    // Make sure all steps are completed
    const firstInvalidStep = this.getFirstInvalidStep();
    if (firstInvalidStep < 3) {
      this.currentStep = firstInvalidStep;
      // Wait for the view to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show message about incomplete steps
      alert('Por favor complete todos los pasos del formulario antes de enviar.');
      return;
    }

    // Mark all fields as touched to trigger validation messages
    Object.keys(this.complaintForm.controls).forEach(key => {
      const control = this.complaintForm.get(key);
      control?.markAsTouched();
    });

    // Check if form is valid
    if (this.complaintForm.invalid) {
      // Find the first invalid step
      const firstInvalidStep = this.getFirstInvalidStep();
      if (firstInvalidStep !== this.currentStep) {
        this.currentStep = firstInvalidStep;
        // Wait for the view to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Scroll to the first invalid control
      const firstInvalidControl = document.querySelector('.ng-invalid');
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Show error message
      const invalidFields: string[] = Object.keys(this.complaintForm.controls)
        .filter(key => this.complaintForm.get(key)?.invalid);
      
      console.error('Invalid fields:', invalidFields);
      
      // Get user-friendly field names
      const fieldNames: {[key: string]: string} = {
        'incidentDate': 'Fecha del incidente',
        'violenceType': 'Tipo de violencia',
        'description': 'Descripción',
        'aggressorFullName': 'Nombre completo del agresor',
        'aggressorRelationship': 'Relación con el agresor'
      };
      
      const invalidFieldNames = invalidFields.map(field => fieldNames[field] || field);
      
      alert(`Por favor complete correctamente los siguientes campos obligatorios:\n\n• ${invalidFieldNames.join('\n• ')}`);
      return;
    }

    this.isSubmitting = true;
    
    const formValues = this.complaintForm.value;
    
    // Prepare the complaint data to match the backend DTO
const complaintData = {
  ...this.complaintForm.value,
  status: 'PENDING', // Add this line
  // Make sure to include all other required fields
  description: this.complaintForm.value.description,
  violenceType: this.complaintForm.value.violenceType,
  incidentDate: this.complaintForm.value.incidentDate,
  incidentLocation: this.complaintForm.value.incidentLocation,
  aggressorFullName: this.complaintForm.value.aggressorFullName,
  aggressorRelationship: this.complaintForm.value.aggressorRelationship,
  aggressorAdditionalDetails: this.complaintForm.value.aggressorAdditionalDetails
};
    
    console.log('Submitting complaint data:', complaintData);

    try {
      // First, create the complaint
      const response: any = await this.complaintService.createComplaint(complaintData).toPromise();
      
      console.log('Denuncia creada exitosamente', response);
      
      // If there are files to upload, handle them after the complaint is created
      if (this.selectedFiles.length > 0) {
        const complaintId = response.body?.id || response.id;
        if (!complaintId) {
          throw new Error('No se pudo obtener el ID de la denuncia');
        }
        
        console.log('Uploading', this.selectedFiles.length, 'files...');
        
        // Upload each file
        for (const file of this.selectedFiles) {
          try {
            console.log('Uploading file:', file.name);
            await this.complaintService.uploadFile(complaintId, file).toPromise();
            console.log('File uploaded successfully:', file.name);
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
            // Continue with next file even if one fails
          }
        }
      }
      
      alert('¡Denuncia y archivos enviados exitosamente!');
      
      // Reset form
      this.complaintForm.reset();
      this.selectedFiles = [];
      this.currentStep = 1;
      
    } catch (error: any) {
      console.error('Error al enviar la denuncia', error);
      
      let errorMessage = 'Error al enviar la denuncia. Por favor, inténtalo de nuevo.';
      
      if (error.status === 400 && error.error) {
        if (error.error.detailMessage) {
          errorMessage = Array.isArray(error.error.detailMessage) 
            ? error.error.detailMessage.join('\n')
            : error.error.detailMessage;
        }
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        // Clear any existing auth data
        localStorage.removeItem('currentUser');
        // Redirect to login
        this.router.navigate(['/login']);
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor, inténtalo más tarde.';
      }
      
      alert(errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }
}
