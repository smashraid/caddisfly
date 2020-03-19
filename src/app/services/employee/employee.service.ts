import { Injectable } from '@angular/core';

import { Employee } from '../../models/employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  constructor() { }

  getAll() {
    return [
      <Employee>{ id: 1, firstName: 'Darrell', lastName: 'Walton', title: 'Mr', gender: 'M', birthDate: new Date(1975, 2, 20), hireDate: new Date(1999, 5, 3), address: '3359 Bassell Avenue', city: 'Little Rock', region: 'AR', postalCode: '72211', country: 'US' },
      <Employee>{ id: 2, firstName: 'Joanne', lastName: 'Allgood', title: 'Mrs', gender: 'F', birthDate: new Date(1975, 2, 20), hireDate: new Date(1999, 5, 3), address: '424 School House Road', city: 'Jackson', region: 'MS', postalCode: '39201', country: 'US' },
      <Employee>{ id: 3, firstName: 'Alan', lastName: 'Richardson', title: 'Mr', gender: 'M', birthDate: new Date(1975, 2, 20), hireDate: new Date(1999, 5, 3), address: '3456 Locust View Drive', city: 'San Jose', region: 'CA', postalCode: '95134', country: 'US' }
    ]
  }
}
