import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";

export interface Vehicle {
  id: string;
  name: string;
  price: number;
  mileage: number;
  year: number;
  fuel: string;
  type: string;
  seats: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
}

export const vehicles: Vehicle[] = [
  {
    id: "1",
    name: "BMW 5 Series",
    price: 42500,
    mileage: 28000,
    year: 2022,
    fuel: "Petrol",
    type: "Sedan",
    seats: 5,
    image: car1,
    images: [car1, car1, car1],
    description: "Impeccably maintained BMW 5 Series with full service history. Premium leather interior, adaptive cruise control, and panoramic sunroof.",
    features: ["Leather Interior", "Panoramic Roof", "Adaptive Cruise", "Parking Assist", "Heated Seats"],
  },
  {
    id: "2",
    name: "Mercedes GLC",
    price: 55800,
    mileage: 15000,
    year: 2023,
    fuel: "Diesel",
    type: "SUV",
    seats: 5,
    image: car2,
    images: [car2, car2, car2],
    description: "Near-new Mercedes GLC in stunning Cavansite Blue. AMG Line package with 20-inch alloys and Burmester sound system.",
    features: ["AMG Line", "Burmester Audio", "360° Camera", "Air Suspension", "Ambient Lighting"],
  },
  {
    id: "3",
    name: "Audi S5 Sportback",
    price: 48900,
    mileage: 32000,
    year: 2021,
    fuel: "Petrol",
    type: "Coupe",
    seats: 4,
    image: car3,
    images: [car3, car3, car3],
    description: "Audi S5 Sportback with the legendary 3.0 TFSI engine. Quattro all-wheel drive, virtual cockpit, and Matrix LED headlights.",
    features: ["Quattro AWD", "Virtual Cockpit", "Matrix LED", "Bang & Olufsen", "Sport Differential"],
  },
  {
    id: "4",
    name: "Porsche Cayenne",
    price: 72000,
    mileage: 22000,
    year: 2022,
    fuel: "Hybrid",
    type: "SUV",
    seats: 5,
    image: car4,
    images: [car4, car4, car4],
    description: "Porsche Cayenne E-Hybrid in pristine white. Sport Chrono package, PASM air suspension, and 14-way adaptive sport seats.",
    features: ["Sport Chrono", "Air Suspension", "BOSE Audio", "Panoramic Roof", "Sport Exhaust"],
  },
];
