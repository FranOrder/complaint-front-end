import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ComplaintService } from '../../../services/complaint.service';

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
      
      aggressorFullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      aggressorRelationship: ['', Validators.required],
      aggressorAdditionalDetails: ['', Validators.maxLength(1000)]
    });
  }

  get f() { return this.complaintForm.controls; }

  isFieldInvalid(field: string) {
    const formControl = this.complaintForm.get(field);
    return formControl?.invalid && (formControl?.dirty || formControl?.touched);
  }

  ngOnInit(): void {}

  getFirstInvalidStep(): number {
    const step1Controls = ['incidentDate', 'violenceType', 'description'];
    const step2Controls = ['aggressorFullName', 'aggressorRelationship'];
    
    const isStep1Valid = step1Controls.every(control => 
      !this.complaintForm.get(control)?.invalid
    );
    
    if (!isStep1Valid) return 1;
    
    const isStep2Valid = step2Controls.every(control => 
      !this.complaintForm.get(control)?.invalid
    );
    
    if (!isStep2Valid) return 2;
    
    return 3;
  }

  nextStep() {
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
    
    if (currentStepValid && this.currentStep < 3) {
      this.currentStep++;
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
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: this.router.routerState.snapshot.url 
        } 
      });
      return;
    }

    if (this.currentStep < 3) {
      this.nextStep();
      return;
    }
    
    const firstInvalidStep = this.getFirstInvalidStep();
    if (firstInvalidStep < 3) {
      this.currentStep = firstInvalidStep;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      alert('Por favor complete todos los pasos del formulario antes de enviar.');
      return;
    }

    Object.keys(this.complaintForm.controls).forEach(key => {
      const control = this.complaintForm.get(key);
      control?.markAsTouched();
    });

    if (this.complaintForm.invalid) {
      const firstInvalidStep = this.getFirstInvalidStep();
      if (firstInvalidStep !== this.currentStep) {
        this.currentStep = firstInvalidStep;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const firstInvalidControl = document.querySelector('.ng-invalid');
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      const invalidFields: string[] = Object.keys(this.complaintForm.controls)
        .filter(key => this.complaintForm.get(key)?.invalid);
      
      console.error('Invalid fields:', invalidFields);
      
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
    
    const complaintData = {
      ...this.complaintForm.value,
      status: 'PENDING', 
      description: this.complaintForm.value.description,
      violenceType: this.complaintForm.value.violenceType,
      incidentDate: this.complaintForm.value.incidentDate,
      incidentLocation: this.complaintForm.value.incidentLocation,
  aggressorFullName: this.complaintForm.value.aggressorFullName,
  aggressorRelationship: this.complaintForm.value.aggressorRelationship,
  aggressorAdditionalDetails: this.complaintForm.value.aggressorAdditionalDetails
};

    try {
      const response: any = await this.complaintService.createComplaint(complaintData).toPromise();
      
      if (this.selectedFiles.length > 0) {
        const complaintId = response.body?.id || response.id;
        if (!complaintId) {
          throw new Error('No se pudo obtener el ID de la denuncia');
        }
        
        for (const file of this.selectedFiles) {
          try {
           
            await this.complaintService.uploadFile(complaintId, file).toPromise();
           
          } catch (error) {
            console.error('Error uploading file:', file.name, error);
          }
        }
      }
      
      alert('¡Denuncia y archivos enviados exitosamente!');
      
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
        localStorage.removeItem('currentUser');
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
