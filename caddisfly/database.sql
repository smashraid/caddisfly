CREATE TABLE employee (
    id INTEGER PRIMARY KEY NOT NULL,
    firstName  TEXT NOT NULL,
    lastName TEXT NOT NULL,
    title TEXT NOT NULL,
    gender TEXT NOT NULL,
    birthDate NUMERIC NOT NULL,
    hireDate NUMERIC NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    postalCode TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT NOT NULL,
    photo TEXT NOT NULL,
    notes TEXT not NULL,
    reportsTo INTEGER 
)