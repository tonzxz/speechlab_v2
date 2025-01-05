import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../supabase.service'; // Adjust the path as necessary
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-class-lab',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './class-lab.component.html',
  styleUrls: ['./class-lab.component.css']
})
export class ClassLabComponent implements OnInit {
  userName: string = '';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  async loadUserProfile() {
    const profile = await this.supabaseService.getUserProfile();
    if (profile) {
      this.userName = `${profile.first_name} ${profile.last_name}`;
    }
  }
}
