// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// export enum ModalState {
//   None,
//   CreateCourse,
//   SaveDraftConfirmation,
//   PublishCourseConfirmation,
//   DeleteCourseConfirmation,
//   Certificate,
//   Survey
  
//   // Add more modal states as needed
// }
// @Injectable({
//   providedIn: 'root'
// })
// export class ManageCourseService {
//   [x: string]: any;
//   private manageCourseSubject = new BehaviorSubject<ModalState>(ModalState.None);
//   settings$ = this.manageCourseSubject.asObservable();

//   toggleSettings(state: ModalState) {
//     this.manageCourseSubject.next(state);
//   }
// }

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum ModalState {
  None,
  CreateCourse,
  SaveDraftConfirmation,
  PublishCourseConfirmation,
  DeleteCourseConfirmation,
  Certificate,
  Survey
  // Add more modal states as needed
}

@Injectable({
  providedIn: 'root'
})
export class ManageCourseService {
  private manageCourseSubject = new BehaviorSubject<ModalState>(ModalState.None);
  settings$ = this.manageCourseSubject.asObservable();

  private currentCourse: any = null; // Store the course to be edited

  toggleSettings(state: ModalState) {
    this.manageCourseSubject.next(state);
  }

  // Set the current course to be edited
  setCurrentCourse(course: any): void {
    this.currentCourse = course;
  }

  // Get the current course being edited
  getCurrentCourse(): any {
    return this.currentCourse;
  }

  // Reset the current course after editing or closing the modal
  resetCurrentCourse(): void {
    this.currentCourse = null;
  }
}
