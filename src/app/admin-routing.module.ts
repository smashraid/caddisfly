import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductComponent } from './components/product/product.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './components/employee-detail/employee-detail.component';


import { AdminComponent } from './layout/admin/admin.component';


const routes: Routes = [
  {
    path: 'admin', component: AdminComponent, children:
      [
        { path: 'employee', component: EmployeeListComponent },
        { path: 'employee/:id', component: EmployeeDetailComponent },
      ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
