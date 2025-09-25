import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/service/api.service';
import { PageTitleComponent } from "../../../shared/modules/pagetitle/pagetitle.component";

@Component({
  selector: 'wtz-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./wtz-sidebar.html',
  styleUrl: './wtz-sidebar.scss'
})
export class WtzSidebarComponent implements OnInit {
  ngOnInit(): void { }

  @Input() searchTerm = '';
  @Input() contacts: Contact[] = [];
  @Input() filteredContacts : Contact[] = [];
  @Input() filteredGroups: Group[] = [];
  @Input() groups: Group[] = [];
  @Input() activeTab: 'contacts' | 'groups' = 'contacts';

  // filterContacts() {
  //   const term = this.searchTerm.toLowerCase();

  //   this.filteredContacts = this.contacts.filter(contact =>
  //     contact.name.toLowerCase().includes(term) ||
  //     contact.phone.includes(term)
  //   );

  //   this.filteredGroups = this.groups.filter(group =>
  //     group.Name.toLowerCase().includes(term) ||
  //     group.description.toLowerCase().includes(term)
  //   );
  // }

}
