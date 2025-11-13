import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

declare var bootstrap: any; 
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
    this.setupModalScrollSpy('alertExamplesModal', '#alertNav');
    this.setupModalScrollSpy('safetyPlanModal', '#safetyPlanNav');
  }
  
  private setupModalScrollSpy(modalId: string, targetNav: string) {
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        this.initializeScrollSpy(modalId, targetNav);
      });
      
      if (modalElement.classList.contains('show')) {
        setTimeout(() => this.initializeScrollSpy(modalId, targetNav), 300);
      }
    }
  }
  
  private scrollSpyInstances: {[key: string]: any} = {};

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
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
    
    const scrollSpyContent = modalElement.querySelector('[data-bs-spy="scroll"]') as HTMLElement;
    
    if (scrollSpyContent) {
      if (this.scrollSpyInstances[modalId]) {
        this.scrollSpyInstances[modalId].dispose();
      }
      
      scrollSpyContent.style.position = 'relative';
      
      setTimeout(() => {
        try {
            this.scrollSpyInstances[modalId] = new bootstrap.ScrollSpy(scrollSpyContent, {
            target: targetNav,
            offset: 0
          });
          
          if (this.scrollSpyInstances[modalId] && 
              typeof this.scrollSpyInstances[modalId].refresh === 'function') {
            this.scrollSpyInstances[modalId].refresh();
          }
          
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
