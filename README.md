# BeloGuesser

BeloGuesser is a browser-based game inspired by GeoGuessr mechanics. The player navigates through random street panoramas and marks their current location on an interactive map as accurately as possible.

## Screenshots

<img width="500" alt="image_2026-06-08_18-21-10" src="https://github.com/user-attachments/assets/2c36fb6f-3345-41a6-bdc4-4040b660a77e" />
<img width="500" alt="image_2026-06-08_18-22-37" src="https://github.com/user-attachments/assets/82b4c3ab-8733-4cbe-86a4-11d4c20800cf" />
<img width="500" alt="image_2026-06-08_18-42-44" src="https://github.com/user-attachments/assets/5a419378-a767-4ba7-8677-0ce40e4171f5" />
<img width="500" alt="image_2026-06-08_18-20-53" src="https://github.com/user-attachments/assets/726f1d6e-5721-4aa3-a2a0-b151aa6516e2" />

## Key Features

* **Panoramas:** Utilizing the Yandex Maps API to display random panoramas at specific coordinates.
* **Interactive Map:** Built with Leaflet, supporting various layers (OSM, Satellite, Hybrid) and automatic regional boundary masking using the Nominatim API.
* **Scoring System:** Calculates the distance between the actual coordinates and the player's guess using the Haversine formula, converting it into points (maximum 5000 per round).
* **Statistics and Customization:** Local storage of the username, games played, wins, and round settings via `localStorage`.
* **Adaptive Interface:** Supports light and dark themes.

## Tech Stack

* HTML5 / CSS3
* Vanilla JavaScript
* Yandex Maps API
* Leaflet.js
* OpenStreetMap / ArcGIS

## Running the Project

The project consists of static files and requires no complex build process. To ensure proper network request handling (CORS) and map API functionality, it should be run through a local web server.

```bash
git clone git@github.com:NotiLo-A/BeloGuesser.git
cd BeloGuesser
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

## Future Plans

* Multiplayer implementation (creating custom rooms and joining via unique codes).
* Backend integration for managing game sessions and a global leaderboard.
