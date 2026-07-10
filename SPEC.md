# SafeRide Nepal — Transport Management System Specification

> Section 19 — Admin-Only Transport Module

## Access Control

Only `SUPER_ADMIN` and `SCHOOL_ADMIN` roles can access this module.

---

## Main Dashboard

Real-time transport statistics cards:

- Total Schools
- Total Buses
- Active Buses
- Offline Buses
- Drivers on Duty
- Students Assigned
- Routes
- Active Trips
- Fuel Consumption Today
- Scheduled Maintenance
- Active Incidents
- Emergency Alerts

Charts:

- Bus Utilization
- Daily Trips
- Attendance by Bus
- Driver Performance
- Fuel Consumption
- Monthly Distance
- Incident Trend

---

## Bus Management

Complete CRUD. Fields:

- Bus ID, Vehicle Number, Registration Number, School
- Bus Name, Bus Type, Manufacturer, Model, Year, Capacity
- Driver, Helper, Route, Current Trip
- GPS Device ID, Fuel Level, Odometer
- Last Service, Insurance Expiry, Pollution Certificate, Fitness Expiry
- Current Status (Active, In Service, Maintenance, Offline, Emergency)

Actions: Create, Edit, Delete, Search, Filter, Export, Assign Driver, Assign Route, Assign GPS

---

## Driver Management

Fields: Employee ID, Name, Photo, License Number, License Expiry, Phone, Email, Address, Blood Group, Emergency Contact, Assigned Bus, Assigned Route, Years Experience, Background Verification, Medical Certificate, Status

Performance Metrics: Safety Score, Average Speed, Harsh Braking, Harsh Acceleration, Attendance, Trips Completed, Student Feedback

---

## Route Management

Route editor with fields: Route ID, Name, School, Total Distance, Estimated Duration, Morning Trip, Afternoon Trip, Assigned Bus, Driver, Stops

Display on map. Actions: Create, Edit, Delete, Duplicate, Optimize, Assign

---

## Stop Management

Fields: Stop Name, GPS Coordinates, Landmark, Pickup Time, Drop Time, Students Count, Route. Show on map.

---

## Student Transport Assignment

Admin assigns: Student -> School -> Bus -> Driver -> Route -> Stop -> Seat Number -> Pickup/Drop Time. Bulk assignment supported.

---

## Trip Management

Auto-create daily trips (Morning, Afternoon, Special). Fields: Driver, Bus, Route, Students, Departure, ETA, Arrival, Delay, Status. Timeline: Scheduled -> Started -> At Stop -> Boarding -> Completed -> Cancelled -> Emergency

---

## Live Vehicle Tracking

MQTT GPS integration with Google/OpenStreetMap. Markers show: Bus Number, Driver, Speed, Heading, Last Update, Passengers, Status, Battery, GPS Signal

---

## Geofencing

Zones: Schools, Stops, Routes, Restricted Areas. Notify on: Bus leaves route, reaches stop, leaves school, idle too long, overspeed

---

## Attendance Integration

QR scan triggers: Student Attendance, Trip Attendance, Parent Notification, Bus Occupancy, Dashboard Update. Real-time.

---

## Seat Management

Visual bus seating layout. Assign, change, reserve seats. View empty seats. Prevent duplicates.

---

## Fuel Management

Track: Fuel Fill, Mileage, Fuel Cost, Average Consumption, Fuel History. Generate reports.

---

## Maintenance Management

Schedule: Oil Change, Tyres, Battery, Insurance, Fitness, Repairs. Maintenance History. Automatic reminders.

---

## Emergency Management

Emergency Button: Driver -> Incident -> Admin -> Control Center -> Parent Notification -> Live Bus Tracking -> Incident Log

---

## Transport Reports

Generate: Bus-wise Attendance, Driver Report, Fuel Report, Maintenance Report, Trips Report, Student Transport List, Route Utilization, Occupancy Report, QR Attendance Report. Export: PDF, Excel, CSV

---

## Search & Filters

Search by: Student, Driver, Bus, Vehicle Number, Parent, Class, School, Route, Stop, QR ID, Trip, Status, Date

---

## Notifications

Auto-notify: Bus Started, Reached School, Delayed, Emergency, Maintenance Due, Insurance Expiry, Driver Changed, Route Changed, Student Boarded, Student Dropped

---

## Real-Time Dashboard

Socket.IO + MQTT auto-updates without refresh.

---

## Security

Only Admin roles can Create, Edit, Delete, Assign, Generate Reports, Export Data. Regular users cannot access.

---

## UI Requirements

Professional ERP dashboard. Modern Material UI. Responsive. Dark Mode. Tables, Cards, Charts, Maps, Dialogs, Loading Skeletons, Toast Notifications, Confirmation Dialogs. Consistent spacing and typography.
