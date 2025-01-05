import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../../supabase.service';
import { ManageClassService, ModalState } from '../../../../app-services/manage-class/manage-class.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { CreateClassComponent } from '../../modal/manage-class/create-class/create-class.component';
import { DeleteClassComponent } from '../../modal/manage-class/delete-class/delete-class.component';
import { RouterModule } from '@angular/router'; 
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EditClassComponent } from '../../modal/manage-class/edit-class/edit-class.component'; 

@Component({
  selector: 'app-a-classmanagement',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ClickOutsideDirective,
    CreateClassComponent,
    DeleteClassComponent,
    EditClassComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './a-classmanagement.component.html',
  styleUrls: ['./a-classmanagement.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ],
})
export class AClassmanagementComponent implements OnInit, OnDestroy {
  public ModalState = ModalState;
  currentModal: ModalState = ModalState.None;
  private subscription!: Subscription;
  classes: any[] = [];
  courses: { id: string; title: string }[] = []; 

  // Variables to manage the edit modal state
  editModalVisible: boolean = false;  // Controls visibility of the edit modal
  selectedClass: any = null;          // Stores the data of the class being edited

  constructor(
    private manageClassService: ManageClassService,
    private supabaseService: SupabaseService 
  ) { }

  ngOnInit(): void {
    this.subscription = this.manageClassService.settings$.subscribe(state => {
      this.currentModal = state;
    });

    this.loadClasses(); 
    this.loadCourses(); 
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async loadClasses(courseIdFilter: string = '') {
    this.classes = await this.supabaseService.getClasses(courseIdFilter);
  }

  async loadCourses() {
    this.courses = await this.supabaseService.getCourses(); 
  }

  actionList = [
    { id: 1, name: 'Edit' },
    { id: 2, name: 'Delete' },
  ];

  // Action modal
  selectedId: any | null = null;
  openModal(item: { id: any; name: string }) {
    if (item.name === 'Delete') {
      this.deleteClass(item.id);  // Call the delete function here
    } else if (item.name === 'Edit') {
      // Open the Edit Modal when "Edit" is clicked
      this.editModalVisible = true;  // Show the edit modal
      this.selectedClass = this.classes.find(classItem => classItem.class_id === item.id);  // Find and assign selected class
    } else {
      this.manageClassService.toggleSettings(item.id);
      this.selectedId = item.id;
    }
  }

  closeSelectedModal() {
    this.manageClassService.toggleSettings(ModalState.None);
  }

  // Close the edit modal
  closeEditModal() {
    this.editModalVisible = false;  // Hide the edit modal
  }

  async onClassUpdated(updatedClassData: any) {
    try {
      // Convert array of selected days to a comma-separated string
      if (Array.isArray(updatedClassData.day_schedule)) {
        updatedClassData.day_schedule = updatedClassData.day_schedule.join(', ');
      }
  
      // Call the Supabase service to update the class in the database
      await this.supabaseService.updateClass(updatedClassData.class_id, updatedClassData);
      
      // Reload the classes after the update to reflect the changes
      await this.loadClasses();
  
      // Close the edit modal
      this.editModalVisible = false; 
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  }
  
  dropDown: any | null = null;
  showDropDown(classCode: any, event: Event) {
    event.preventDefault();
    this.dropDown = this.dropDown === classCode ? null : classCode; 
  }

  closeDropDown() {
    this.dropDown = null;
  }

  showModal() {
    this.manageClassService.toggleSettings(ModalState.CreateClass);
  }

  closeModal() {
    this.manageClassService.toggleSettings(ModalState.None);
  }

  filterByCourse(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedCourseId = selectElement.value;
    this.loadClasses(selectedCourseId); 
  }

  async deleteClass(classId: string) {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        await this.supabaseService.deleteClass(classId); 
        this.loadClasses(); 
      } catch (error) {
        console.error('Failed to delete class:', error);
      }
    }
  }

  onClassCreated() {
    this.loadClasses();  // Reload classes to include newly created class
  }
}
