import { Server, Model, Response, Factory } from 'miragejs';

const server = new Server({
    models: {
        employee: Model
    },
    factories: {
        employee: Factory.extend({
            firstName() {
                let names = ['Darrell', 'Darla', 'Gordon', 'Linda', 'Arthur', 'William', 'Rose', 'Cassidy', 'Gary'];
                return names[Math.floor(Math.random() * names.length)];
            },
            lastName() {
                let lastnames = ['Walton', 'Schwab', 'Weathers', 'Sato', 'Larson', 'McIntosh', 'Freeman', 'Ahmed', 'Henderson'];
                return lastnames[Math.floor(Math.random() * lastnames.length)];
            },
            birthDate() {
                let start = new Date(1970,1,1);
                let end = new Date(1999,1,1);
                return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            },
            hireDate() {
                let start = new Date(2000,1,1);
                let end = new Date(2019,1,1);
                return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
        })
    },
    routes() {
        this.namespace = 'api';
        this.get("/employee");
        this.get("/employee/:id");
        this.post("/employee");
        this.patch("/employee/:id");
        this.del("/employee/:id");        
    },
    seeds(server) {
        server.createList("employee", 10);
    }
});

export default server;