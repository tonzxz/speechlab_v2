import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'Online' | 'Offline';
}

@Component({
  selector: 'app-a-classmanagement-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './a-classmanagement-tabs.component.html',
  styleUrl: './a-classmanagement-tabs.component.css'
})
export class AClassmanagementTabsComponent implements OnInit {
  users: User[] = [
    { id: 1, name: 'Catherine Smith', email: 'catherinesmith@example.com', status: 'Online' },
    { id: 2, name: 'John Doe', email: 'johndoe@example.com', status: 'Offline' },
    { id: 3, name: 'Jane Smith', email: 'janesmith@example.com', status: 'Online' },
    { id: 4, name: 'David Johnson', email: 'davidjohnson@example.com', status: 'Online' },
    { id: 5, name: 'Sarah Williams', email: 'sarahwilliams@example.com', status: 'Offline' },
  ];

  filteredUsers: User[] = [];
  searchTerm: string = '';
  activeTab: string = 'people';

  ngOnInit() {
    this.filteredUsers = this.users;
  }

  searchUsers() {
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  editUser(user: User) {
    console.log('Editing user:', user);
    // Implement edit logic here
  }
}