import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmployeeComponent } from './employee/employee.component';
import { CategoryComponent } from './category/category.component';
import { ProductComponent } from './product/product.component';
import { EmployeeDetailComponent } from './employee/detail/detail.component';


const routes: Routes = [
  {
    path: 'admin', children:
      [
        { path: 'employee', component: EmployeeDetailComponent }
      ]
  },
  {
    path: 'category', component: CategoryComponent
  },
  {
    path: 'product', component: ProductComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
