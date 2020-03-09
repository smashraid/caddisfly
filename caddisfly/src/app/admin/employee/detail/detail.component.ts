import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { Employee } from '../employee';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit {

  employeeForm: FormGroup;
  employee: Employee;
  isSubmitted: boolean  =  false;


  constructor(private fb: FormBuilder) {
    this.employee = new Employee();
    this.employeeForm = this.fb.group({
      title: [this.employee.title, [Validators.required]],
      firstName: [this.employee.firstName, [Validators.required]],
      lastName: [this.employee.lastName, [Validators.required]],
      gender: [this.employee.gender, [Validators.required]],
      address: [this.employee.address, [Validators.required]],
      city: [this.employee.city, [Validators.required]],
      region: [this.employee.region, [Validators.required]],
      postalCode: [this.employee.postalCode, [Validators.required]]
    });
  }

  get f() { return this.employeeForm.controls; }

  ngOnInit() {
  }

  onSubmit(): void {
    this.isSubmitted = true;
    if (!this.employeeForm.invalid) {
      console.warn(this.employeeForm.value);  
    }    
  }

}
