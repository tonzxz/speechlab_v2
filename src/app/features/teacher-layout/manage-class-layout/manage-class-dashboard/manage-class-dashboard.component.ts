import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { CreateClassComponent } from "../../../modal/manage-class/create-class/create-class.component";
import { RouterModule } from '@angular/router';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { DeleteClassComponent } from '../../../modal/manage-class/delete-class/delete-class.component';
import { ManageClassService, ModalState } from '../../../../../app-services/manage-class/manage-class.service';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../../../supabase.service';

@Component({
  selector: 'app-manage-class-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CreateClassComponent,
    DeleteClassComponent,
    RouterModule,
    ClickOutsideDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './manage-class-dashboard.component.html',
  styleUrls: ['./manage-class-dashboard.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('200ms', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class ManageClassDashboardComponent implements OnInit, OnDestroy {
  public ModalState = ModalState;
  currentModal: ModalState = ModalState.None; // Modal is closed by default
  private subscription!: Subscription;
  private realTimeSubscription!: Subscription;
  selectedId: any | null = null;
  classes: any[] = []; // Array to store fetched classes

  constructor(
    private manageClassService: ManageClassService,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    this.subscription = this.manageClassService.settings$.subscribe(state => {
      this.currentModal = state;
    });

    this.loadUserClasses(); // Fetch user's profile and classes on initialization

    // Subscribe to real-time class changes
    this.subscribeToRealTimeClassChanges();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
    }
  }

  async loadUserClasses() {
    try {
      console.log('Fetching user profile and classes...');
      const result = await this.supabaseService.getUserClasses();
      console.log('Fetched user and classes:', result);

      if (result) {
        this.classes = result.classes;
        console.log('Filtered classes for user:', this.classes);
      } else {
        console.error('No user or classes fetched.');
      }
    } catch (error) {
      console.error('Error fetching user classes:', error);
    }
  }

  subscribeToRealTimeClassChanges() {
    this.realTimeSubscription = this.supabaseService.subscribeToClassChanges((newClass) => {
      this.classes.push(newClass); // Add the new class to the array
      console.log('New class added:', newClass);
    });
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

  openModal(item: { id: any; name: string }) {
    this.manageClassService.toggleSettings(item.id);
    this.selectedId = item.id;
  }

  closeSelectedModal() {
    this.manageClassService.toggleSettings(ModalState.None);
  }

  dropDown: { [key: string]: boolean } = {};
  openedDropDownId: string | null = null;
  // Show dropdown for a specific class item
  showDropDown(id: string, event: Event) {
    event.preventDefault();
    if (this.openedDropDownId === id) {
      // If the clicked dropdown is already opened, close it
      this.openedDropDownId = null;
    } else {
      // Otherwise, set the opened dropdown to the current one
      this.openedDropDownId = id;
    }
  }

  // Close the dropdown
  closeDropDown() {
    this.openedDropDownId = null; // Reset to close the dropdown
  }


  // Open modal when the "Create Class" button is clicked
  showModal() {
    this.currentModal = ModalState.CreateClass; // Open the create class modal
  }

  closeModal() {
    this.currentModal = ModalState.None;  // Ensure modal is set to None to hide it
  }

  onClassCreated() {
    this.loadUserClasses();  // Reload classes after creating a new class
    this.closeModal();       // Close the modal after creation
  }

  actionList = [
    { id: 1, name: 'Edit' },
    { id: 2, name: 'Delete' },
  ];
}
