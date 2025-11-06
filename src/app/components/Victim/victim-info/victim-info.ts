import { Component, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

declare var bootstrap: any; // Declare bootstrap to avoid TypeScript errors

@Component({
  selector: 'app-victim-info',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './victim-info.html',
  styleUrl: './victim-info.css'
})
export class VictimInfoComponent implements AfterViewInit {
  private modalRef: NgbModalRef | null = null;
  private modalElement: any;
  private scrollSpyInstance: any;
  
  constructor() {}

  ngAfterViewInit() {
    // Set up scrollspy for alert examples modal
    this.setupModalScrollSpy('alertExamplesModal', '#alertNav');
    
    // Set up scrollspy for safety plan modal
    this.setupModalScrollSpy('safetyPlanModal', '#safetyPlanNav');
  }
  
  private setupModalScrollSpy(modalId: string, targetNav: string) {
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      // Add event listener for when the modal is shown
      modalElement.addEventListener('shown.bs.modal', () => {
        this.initializeScrollSpy(modalId, targetNav);
      });
      
      // Also initialize scrollspy if modal is already open (during development)
      if (modalElement.classList.contains('show')) {
        setTimeout(() => this.initializeScrollSpy(modalId, targetNav), 300);
      }
    }
  }
  
  private scrollSpyInstances: {[key: string]: any} = {};

  // Smooth scroll to section by ID
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      // Add a small offset to account for fixed header
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  private initializeScrollSpy(modalId: string, targetNav: string) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;
    
    // Find the scrollspy content within this specific modal
    const scrollSpyContent = modalElement.querySelector('[data-bs-spy="scroll"]') as HTMLElement;
    
    if (scrollSpyContent) {
      // Remove any existing scrollspy instance for this modal
      if (this.scrollSpyInstances[modalId]) {
        this.scrollSpyInstances[modalId].dispose();
      }
      
      // Add position relative if not already set
      scrollSpyContent.style.position = 'relative';
      
      // Set a small delay to ensure the DOM is fully updated
      setTimeout(() => {
        try {
          // Initialize new scrollspy instance for this specific modal
          this.scrollSpyInstances[modalId] = new bootstrap.ScrollSpy(scrollSpyContent, {
            target: targetNav,
            offset: 0
          });
          
          // Manually refresh scrollspy to ensure it's properly initialized
          if (this.scrollSpyInstances[modalId] && 
              typeof this.scrollSpyInstances[modalId].refresh === 'function') {
            this.scrollSpyInstances[modalId].refresh();
          }
          
          // Force update the active nav item on scroll
          scrollSpyContent.addEventListener('scroll', () => {
            if (this.scrollSpyInstances[modalId]?.refresh) {
              this.scrollSpyInstances[modalId].refresh();
            }
          });
          
        } catch (e) {
          console.error(`Error initializing scrollspy for ${modalId}:`, e);
        }
      }, 100);
    }
  }
}
