import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'image-upload',
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
  @Output() imagePath = new EventEmitter<string>();

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      this.http.post('/api/v1/images/upload', formData, { responseType: 'text' })
        .subscribe(path => this.imagePath.emit(path));
    }
  }
}