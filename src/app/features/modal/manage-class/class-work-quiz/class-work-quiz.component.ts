// import { CommonModule } from '@angular/common';
// import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// interface Option {
//   text: string;
// }

// interface Question {
//   mode: string;
//   text: string;
//   options: Option[];
// }
// @Component({
//   selector: 'app-class-work-quiz',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
//   templateUrl: './class-work-quiz.component.html',
//   styleUrl: './class-work-quiz.component.css'
// })
// export class ClassWorkQuizComponent {
//   @Output() closeModal = new EventEmitter<void>();

//   close() {
//     this.closeModal.emit();
//   }

//   cancel() {
//     this.close();
//   }
//   deleteQuestion(index: number) {
//     if (this.questions.length > 1) {
//       this.questions.splice(index, 1);
//     } else {
//       // Optionally, show an alert or message that at least one question is required
//       console.log('At least one question is required');
//     }
//   }
//   removeOption(questionIndex: number, optionIndex: number) {
//     if (this.questions[questionIndex].options.length > 2) {
//       this.questions[questionIndex].options.splice(optionIndex, 1);
//     } else {
//       // Optionally, show an alert or message that a minimum of 2 options are required
//       console.log('A minimum of 2 options are required');
//     }
//   }

//   questions: Question[] = [
//     { mode: '', text: '', options: [{text: ''}, {text: ''}] }
//   ];

//   addQuestion() {
//     if (this.questions.length < 10) { // Limit to 10 questions, adjust as needed
//       this.questions.push({ mode: '', text: '', options: [{text: ''}, {text: ''}] });
//     }
//   }

//   addOption(questionIndex: number) {
//     if (this.questions[questionIndex].options.length < 4) {
//       this.questions[questionIndex].options.push({text: ''});
//     }
//   }
// }


import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../supabase.service'; // Adjust the path as needed

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  mode: string;
  text: string;
  options: Option[];
  correctAnswer?: string; // For true/false and enumeration
}

@Component({
  selector: 'app-class-work-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './class-work-quiz.component.html',
  styleUrl: './class-work-quiz.component.css'
})
export class ClassWorkQuizComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  quizTitle: string = '';
  quizDescription: string = '';
  timeLimit: string = '';
  deadline: string = '';
  selectedCourseId: string = '';
  randomizedQuestion: boolean = false;
  allowBacktracking: boolean = false;
  allowReviewAfterSubmission: boolean = false;
  courses: any[] = []; // To store the list of courses

  questions: Question[] = [
    { mode: '', text: '', options: [{text: '', isCorrect: false}, {text: '', isCorrect: false}] }
  ];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadCourses();
  }

  async loadCourses() {
    const coursesData = await this.supabaseService.getCourses();
    if (coursesData && Array.isArray(coursesData)) {
      this.courses = coursesData;
    } else {
      console.error('Error loading courses or unexpected data format');
    }
  }

  close() {
    this.closeModal.emit();
  }

  cancel() {
    this.close();
  }

  deleteQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
    } else {
      console.log('At least one question is required');
    }
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (this.questions[questionIndex].options.length > 2) {
      this.questions[questionIndex].options.splice(optionIndex, 1);
    } else {
      console.log('A minimum of 2 options are required');
    }
  }

  addQuestion() {
    if (this.questions.length < 10) {
      this.questions.push({ mode: '', text: '', options: [{text: '', isCorrect: false}, {text: '', isCorrect: false}] });
    }
  }

  addOption(questionIndex: number) {
    if (this.questions[questionIndex].options.length < 4) {
      this.questions[questionIndex].options.push({text: '', isCorrect: false});
    }
  }

  async saveQuiz() {
    if (!this.validateQuestions()) {
      console.error('Quiz validation failed. Please fill all questions and options.');
      // Show an error message to the user
      return;
    }
  
    const user = await this.supabaseService.getUserProfile();
    if (!user) {
      console.error('No user logged in');
      return;
    }
  
    const timeLimitInMinutes = this.convertTimeToMinutes(this.timeLimit);
  
    const quizData = {
      title: this.quizTitle,
      description: this.quizDescription,
      timeLimit: timeLimitInMinutes,
      deadline: this.deadline,
      courseId: this.selectedCourseId,
      randomizeQuestion: this.randomizedQuestion,
      allowBacktracking: this.allowBacktracking,
      allowReviewAfterSubmission: this.allowReviewAfterSubmission,
      createdBy: user.profile_id
    };
  
    const { data, error } = await this.supabaseService.createQuiz(quizData, this.questions);
  
    if (error) {
      console.error('Error saving quiz:', error);
      // Handle error (show message to user, etc.)
    } else {
      console.log('Quiz saved successfully:', data);
      this.close();
    }
  }
  
  // Helper method to convert time string to minutes
  private convertTimeToMinutes(timeString: string): number {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private validateQuestions(): boolean {
    for (const question of this.questions) {
      if (!question.text.trim()) {
        console.error('Question text is empty');
        return false;
      }
      if (question.options.some(option => !option.text.trim())) {
        console.error('Some options are empty');
        return false;
      }
    }
    return true;
  }
}