import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'image-upload',
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
  private apiUrl = environment?.apiUrl;

  @Output() imagePath = new EventEmitter<string>();

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      this.http.post(`${this.apiUrl}images/upload`, formData, { responseType: 'text' })
        .subscribe(path => this.imagePath.emit(path));
    }
  }
}
