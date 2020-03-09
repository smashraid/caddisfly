import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { EmployeeComponent } from './employee/employee.component';
import { CategoryComponent } from './category/category.component';
import { ProductComponent } from './product/product.component';
import { EmployeeDetailComponent } from './employee/detail/detail.component';
import { EmployeeListComponent } from './employee/list/list.component';


@NgModule({
  declarations: [EmployeeComponent, CategoryComponent, ProductComponent, EmployeeDetailComponent, EmployeeListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
