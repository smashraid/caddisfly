import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  uploadFile(file: File): void {
    console.log(file.name);
  }
}
