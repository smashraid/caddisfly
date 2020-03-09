import { Injectable } from '@angular/core';

import { Product} from './product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  constructor() { }

  getProducts (): Array<Product> {
    return [
      new Product('Phone XL', 799, 'A large phone with one of the best screens'),
      new Product('Phone Mini', 699, 'A great phone with one of the best cameras'),
      new Product('Phone Standard', 299, ''),
    ]
  }
}
