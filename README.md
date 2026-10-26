# GIS_based_Smart_Municipal_Waste_collection_and_Route_Optimization_System
A web application for municipal waste management that uses GIS technology includes interactive waste mapping, management of fleets and facilities, and route optimization through the Haversine formula and nearest-neighbor heuristic, along with analytics for fuel, costs, and time.
**Developed using Python, Flask, Leaflet.js, OpenStreetMap, Chart.js, and JSON.**

---

## Live Demo

- **Live Website:** [https://gis-based-smart-municipalwaste.onrender.com/](https://gis-based-smart-municipalwaste.onrender.com/)
- **GitHub Repository:** [https://github.com/Jerry3906/GIS-based-Smart-Municipal-Waste-collection-and-Route-Optimization-System](https://github.com/Jerry3906/GIS-based-Smart-Municipal-Waste-collection-and-Route-Optimization-System)


---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Objectives](#objectives)
4. [Features](#features)
5. [GIS Mapping and Visualization](#gis-mapping-and-visualization)
6. [Route Optimization Algorithm](#route-optimization-algorithm)
7. [Fleet and Waste Safety Management](#fleet-and-waste-safety-management)
8. [Technology Stack](#technology-stack)
9. [System Architecture](#system-architecture)
10. [Project Structure](#project-structure)
11. [Installation and Local Setup](#installation-and-local-setup)
12. [Deployment](#deployment)
13. [Sample Dataset](#sample-dataset)
14. [Limitations](#limitations)
15. [Future Enhancements](#future-enhancements)
16. [Academic Project Information](#academic-project-information)

---

## 1. Overview

The Smart Municipal Waste Collection & Route Optimization System is a GIS-enabled web application designed to demonstrate how municipal waste collection operations can be organized through geographic mapping, waste categorization, vehicle compatibility checks, and heuristic route planning.

The system provides a unified dashboard for managing simulated waste sources, geographic zones, collection vehicles, processing facilities, and collection history.

It compares a traditional collection plan with an optimized plan that groups compatible waste streams and orders collection stops using a nearest-neighbour heuristic.

The application also estimates travel distance, fuel consumption, collection time, and fuel cost, while keeping chemical and hazardous waste separate from ordinary municipal waste.

**Project scope:** This is an academic software prototype using simulated data. It is not a live municipal deployment, and its estimated savings have not been validated against real-world operations.

## 2. Problem Statement

Municipal waste collection requires coordination among waste sources, geographic zones, collection vehicles, and disposal facilities. Inefficient stop ordering can lead to unnecessary travel, increased fuel consumption, and longer collection times.

Different waste streams also require different handling arrangements. Chemical and hazardous waste must be assigned to specialized vehicles and compatible facilities rather than ordinary collection vehicles and general landfills.

This project demonstrates a software-based approach to organizing these operations through GIS visualization, vehicle compatibility information, route planning, and operational analytics.

## 3. Objectives

- Visualize waste collection sources on an interactive map.
- Organize collection locations into geographic zones.
- Categorize waste into five different streams.
- Manage a simulated fleet of collection vehicles and processing facilities.
- Generate and compare traditional and optimized collection plans.
- Order collection stops using the Haversine distance and nearest-neighbour heuristic.
- Estimate route distance, fuel usage, travel time, and fuel cost.
- Separate chemical and hazardous waste from ordinary municipal waste.
- Present waste composition, collection trends, and short-term forecasts through charts and dashboards.

## 4. Features

### Executive Dashboard

- Key operational indicators and waste statistics.
- Waste composition visualization.
- Interactive geographic map.
- Route optimization comparison metrics.

### GIS Map and Geographic Visualization

- Interactive map powered by Leaflet.js and OpenStreetMap.
- Color-coded markers for waste collection sources.
- Separate markers for processing facilities and the central depot.
- Geographic collection zone boundaries.
- Waste density heatmap.
- Route lines displayed on the map.

### Waste Source Management

- View and inspect simulated waste collection sources.
- Display waste categories and quantities.
- Organize sources by geographic zone.
- Filter and examine collection locations.

### Collection Zone Management

The prototype includes four geographic zones:

- Zone A — North Residential
- Zone B — East Commercial
- Zone C — South Industrial
- Zone D — West Mixed

### Fleet Management

- View five simulated collection vehicles.
- Display vehicle capacities, fuel types, and mileage.
- Review supported waste categories.
- Inspect vehicle assignments and utilization information.

### Collection Planning

- Generate a traditional collection plan.
- Generate an optimized collection plan.
- Display collection stop sequences and routes.
- Compare estimated distance, fuel, time, and cost.
- Show route loads and vehicle utilization.

### Truck Route Viewer

- View the route assigned to a particular vehicle.
- Inspect the order of collection stops.
- Display route information and vehicle load progression.

### Processing Facilities Directory

- View recycling, composting, landfill, chemical treatment, and hazardous disposal facilities.
- Display facility information and geographic coordinates.
- Associate waste streams with compatible processing destinations.

### Analytics and Forecasting

- Visualize waste composition by category.
- Compare waste distribution across zones.
- Review historical waste trends.
- Analyze waste quantities by source type.
- Display short-term forecast cards based on historical averages.

### Collection History

- Review simulated collection records.
- Inspect quantities, collection dates, assigned vehicles, and facilities.

### Authentication

- Session-based login with a demonstration manager account.
- Login protection for application pages and APIs.

**Implementation note:** The current authentication is a basic demonstration mechanism, not a production identity-management system. The source-entry form is a mock-up and does not persist new entries. The vehicle assignment validation endpoint exists in the backend but is not currently connected to the corresponding interface.

## 5. GIS Mapping and Visualization

The geographic visualization is implemented using Leaflet.js and OpenStreetMap.

The map displays simulated waste collection locations around South Bengaluru, Karnataka, India, along with the central depot, processing facilities, and collection zones.

Map functionality includes:

- Interactive geographic markers.
- Source and facility identification.
- Zone boundary visualization.
- Waste density heatmap.
- Route polylines for collection plans.
- Geographic context for collection planning.

The map uses OpenStreetMap tiles. The displayed collection points and operational data are simulated and should not be interpreted as verified municipal infrastructure.

## 6. Route Optimization Algorithm

The application uses the Haversine formula and a nearest-neighbour heuristic to estimate distances and organize collection stops.

### Haversine Distance

The Haversine formula estimates the great-circle distance between two geographic coordinates using latitude and longitude.

The implementation uses an Earth radius of 6,371 km.

An urban road-distance approximation is obtained by multiplying the straight-line distance by a factor of 1.4.

### Nearest-Neighbour Heuristic

The optimized plan repeatedly selects the nearest unvisited collection source from the current location.

The planned journey follows this general sequence:

**Depot → Collection Sources → Compatible Processing Facility → Depot**

### Traditional Plan vs. Optimized Plan

The traditional plan uses separate vehicle assignments for individual waste streams and visits sources in identifier order.

The optimized plan groups compatible recyclable, organic, and general waste collection across selected zones and orders the stops using the nearest-neighbour heuristic. Chemical and hazardous waste remain assigned to the specialized HazChem vehicle in separate routes.

The application estimates and compares:

- Travel distance in kilometres.
- Fuel consumption in litres.
- Collection time in minutes.
- Fuel cost in Indian rupees.
- Vehicle load and utilization.

**Algorithm limitation:** Nearest-neighbour is a heuristic, not an exact optimization algorithm. It does not guarantee the globally shortest route. Distances use an approximation rather than live road-network routing, and the resulting estimates should not be treated as verified operational savings.

## 7. Fleet and Waste Safety Management

The prototype models five vehicles with different capacities, mileage values, and waste compatibility rules.

Five waste categories are represented:

- Recyclable
- Organic
- General
- Chemical
- Hazardous

The specialized HazChem vehicle is intended for chemical and hazardous waste. Standard collection vehicles are not permitted for those categories under the backend compatibility rules.

A backend assignment-validation endpoint is implemented to reject incompatible assignments. However, the current interface does not invoke that endpoint, so this functionality requires further integration before it can be relied upon as an end-to-end safety control.

The project demonstrates compatibility-based planning; it is not a certified regulatory compliance system.

## 8. Technology Stack

| Component | Technology |
|---|---|
| Programming language | Python 3 |
| Backend framework | Flask 3.0.0 |
| Frontend | HTML5, CSS3, JavaScript |
| Template rendering | Jinja2 / Flask templates |
| Geographic mapping | Leaflet.js |
| Map data and tiles | OpenStreetMap |
| Heatmap visualization | Leaflet.heat |
| Charts and analytics | Chart.js |
| Data storage | Local JSON files |
| Distance calculation | Haversine formula |
| Route ordering | Nearest-neighbour heuristic |
| Python dependency management | pip and requirements.txt |

The current implementation does not use a separate SQL database or live GPS tracking service.

## 9. System Architecture

The application follows a simple three-part architecture.

1. **Data layer:** JSON files store waste sources, zones, vehicles, facilities, depot information, and collection history.
2. **Backend layer:** Flask processes application requests, reads the datasets, generates collection plans, calculates route metrics, and serves API responses.
3. **Presentation layer:** HTML templates, CSS, JavaScript, Leaflet.js, and Chart.js provide the dashboard, maps, tables, routes, and analytics.

The frontend requests data from the Flask backend, which processes the stored datasets and returns the information needed for visualization.

### Architecture Flow

```text
User
 |
 v
Web Dashboard
(HTML, CSS, JavaScript)
 |
 v
Flask Application
(Routes, APIs, Planning, Analytics)
 |
 v
JSON Data Files
 |
 v
Processed Data and Route Plans
 |
 v
Maps, Charts, Tables, and Comparisons
```

OpenStreetMap supplies the map tiles used by the geographic interface.

## 10. Project Structure

```text
smart-municipal-waste-collection/
├── app.py
├── requirements.txt
├── data/
│   ├── waste_sources.json
│   ├── zones.json
│   ├── trucks.json
│   ├── facilities.json
│   └── collection_history.json
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── img/
└── templates/
    ├── base.html
    ├── login.html
    ├── dashboard.html
    ├── gis_map.html
    ├── collection_planning.html
    ├── truck_route.html
    ├── waste_sources.html
    ├── trucks.html
    ├── facilities.html
    ├── zones.html
    ├── analytics.html
    ├── collection_history.html
    └── about.html
```

The structure above describes the documented project layout. Use the actual filenames in your repository if they differ.

## 11. Installation and Local Setup

### Prerequisites

- Python 3.
- Git (optional, for cloning the repository).
- A modern web browser.
- An internet connection for loading OpenStreetMap tiles and externally hosted frontend libraries.

### Step 1: Clone the Repository

Replace the example URL with your actual GitHub repository URL.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd smart-municipal-waste-collection
```

Alternatively, download the repository as a ZIP file and extract it.

### Step 2: Create a Virtual Environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

macOS or Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Run the Application

```bash
python app.py
```

Open the local address printed by Flask in your terminal, typically:

`http://127.0.0.1:5000`

If the application uses a different port, follow the address shown in the terminal.

### Step 5: Explore the Dashboard

Navigate through the dashboard, GIS map, collection planning, fleet, facilities, zones, analytics, and collection history pages.

Use the collection planning page to compare the traditional and optimized route plans.

## 12. Deployment

The Flask backend can be deployed as a web service on a Python-compatible hosting platform.

For Render deployment:

1. Push the complete application to GitHub.
2. Ensure `requirements.txt` includes Flask and the production server dependency, Gunicorn.
3. Create a new Render Web Service and connect the GitHub repository.
4. Set the build command to `pip install -r requirements.txt`.
5. Set the start command to `gunicorn app:app`, assuming `app.py` defines an application variable named `app`.
6. Deploy and review the build logs.
7. Open the assigned HTTPS URL and test the application.

The exact start command may need adjustment if the Flask application object has a different name or location.

**Deployment considerations:**

- Keep passwords, secret keys, and other credentials out of the public repository.
- Configure authentication secrets through environment variables before using a public deployment.
- The current project uses local JSON files rather than persistent database storage.
- Do not rely on changes to local files surviving redeployment or replacement of a hosting instance.
- Test every page and backend operation after deployment.

## 13. Sample Dataset

The prototype uses a simulated dataset consisting of:

- 25 waste collection sources.
- 4 geographic zones.
- 5 collection vehicles.
- 5 processing facilities.
- 5 waste categories.
- 49 historical collection records covering 29 September to 6 October 2026.

The documented dataset contains approximately 1,268.3 kg of waste across the five categories.

These values are for demonstration and testing. They do not represent independently verified municipal waste measurements.

## 14. Limitations

The current prototype has several limitations:

- Uses simulated rather than live municipal data.
- Stores operational data in JSON files rather than a database.
- Does not provide live GPS tracking.
- Uses straight-line geographic distances scaled by a fixed road factor.
- Does not account for real-time traffic, road closures, or one-way streets.
- Uses a nearest-neighbour heuristic rather than a globally optimal routing solver.
- Uses fixed zone-to-vehicle assignments.
- Does not automatically split overloaded routes.
- Provides a demonstration login rather than production-grade identity management.
- Includes a source-entry mock-up that does not persist new records.
- Has a backend compatibility-validation endpoint that is not yet integrated with the interface.
- Uses a simple short-term forecasting method rather than a validated predictive model.

Consequently, the application is intended to demonstrate software design and planning concepts, not to replace a production municipal operations platform.

## 15. Future Enhancements

Possible future improvements include:

- Integrating a persistent database such as PostgreSQL.
- Adding full create, read, update, and delete operations for sources, vehicles, zones, and facilities.
- Implementing secure authentication with multiple user roles.
- Connecting the vehicle assignment validation endpoint to the interface and route-planning workflow.
- Adding road-network routing and traffic-aware route calculations.
- Introducing capacity-aware route splitting and improved vehicle routing algorithms.
- Integrating live vehicle location tracking.
- Improving waste forecasting with additional data and validated forecasting methods.
- Adding report export functionality and richer operational reporting.
- Using real municipal datasets after appropriate validation and authorization.

These are proposed enhancements and should not be considered implemented features.

## 16. Academic Project Information

**Project Title:** Smart Municipal Waste Collection & Route Optimization System

**Institution:** Vellore Institute of Technology (VIT), Chennai

**Submitted by:**
- Bharanidaran S
- Jerome Louie P

**Project Type:** Academic software prototype

The project demonstrates the application of web development, GIS visualization, heuristic route planning, data processing, and analytics to a simulated municipal waste collection scenario.

---

## Acknowledgements

This project uses open-source software and mapping technologies, including Flask, Leaflet.js, OpenStreetMap, and Chart.js.

Please refer to the respective projects' documentation and licensing terms when redistributing or extending the software.
