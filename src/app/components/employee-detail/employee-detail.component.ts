import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { Employee } from '../../models/employee';
import { EmployeeService } from '../../services/employee/employee.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit {

  employeeForm: FormGroup;
  employee: Employee;
  isSubmitted: boolean = false;
  fileUpload: File = null;  

  constructor(
    private route: ActivatedRoute, 
    private fb: FormBuilder, 
    private employeeService: EmployeeService,
    private commonService: CommonService
    ) {
    this.employee = new Employee();
    this.employeeForm = this.fb.group({
      id: [this.employee.id],
      title: [this.employee.title, [Validators.required]],
      firstName: [this.employee.firstName, [Validators.required]],
      lastName: [this.employee.lastName, [Validators.required]],
      gender: [this.employee.gender, [Validators.required]],
      birthDate: [this.employee.birthDate, [Validators.required]],
      hireDate: [this.employee.hireDate, [Validators.required]],
      address: [this.employee.address, [Validators.required]],
      city: [this.employee.city, [Validators.required]],
      region: [this.employee.region, [Validators.required]],
      postalCode: [this.employee.postalCode, [Validators.required]],
      country: [this.employee.country, [Validators.required]],
      phone: [this.employee.phone, [Validators.required]],
      photo: [this.employee.photo, [Validators.required]],
      notes: [this.employee.notes, [Validators.required]],
      reportsTo: [this.employee.reportsTo, [Validators.required]]
    });
  }

  get f() { return this.employeeForm.controls; }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.employee = this.employeeService.get(+params.get('id'));      
    });
    // this.employee.firstName = 'Saulo';
    // this.employee.lastName = 'Tsuchida';
    // console.log(this.employee);
    this.employeeForm.setValue(this.employee);
  }

  onSubmit(): void {
    this.isSubmitted = true;
    if (!this.employeeForm.invalid) {
      console.warn(this.employeeForm.value);3
      this.commonService.uploadFile(this.fileUpload);
    }
  }

  onFileChange(files: FileList){
    this.fileUpload = files[0];    
  }
}
