
const socket = io();
let userMarker = null; 
let currentRoute = null; 

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });

           
            if (!userMarker) {
                userMarker = L.marker([latitude, longitude], { title: "You" }).addTo(map);
            } else {
                userMarker.setLatLng([latitude, longitude]);
            }
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 50000,
            maximumAge: 0,
        }
    );
}

const map = L.map("map").setView([0, 0], 40);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "openstreetmap",
}).addTo(map);

const markers = {};

const redIcon = L.icon({
    iconUrl: "https://img.icons8.com/isometric/50/FA5252/marker.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const landmarks = [
    { name: "Calcutta Orphange", imageUrl: "./images/Calcutta Orphange4.jpg",location:"12/1, Balaram Ghosh Street, Shyambazar, Kolkata - 700004 (Near Shyampukur Police Station)",contact:"phone.no :  03325555192",children: "120 children",cost:"  120-130/-per plate" , latitude: 22.59884086070276, longitude: 88.37078588465711 },   
    { name: "sahyog a child(help a child)", imageUrl: "./images/sahyog a child(help a child).jpg ",location:"rishnapur, Kestopur, Kolkata, West Bengal 700102, Krishnapur, Kolkata - 700102 (Chandiberia, Near Ankur Club)",contact:"phone.no : 7947106203",children: "34 children",cost:"  65/-per plate" , latitude: 22.59310629484466, longitude:  88.43878670489134 },  
    { name: "Save the Orphan", imageUrl: "./images/Save the Orphan2.jpg ",location:"Rania Nabarun Pur, Bansdroni Near Metro Station Master The Surjo Sen, Post Office ; Boral Pin Code; 700154, Tollygunge, Kolkata - 700033 (Near Rania Power House)",contact:"phone.no : 9830096152", children: "70 children, 15 old, 12 staff",cost:" 175-200/-per plate" ,latitude: 22.455350464839466, longitude:  88.34948290108458}, 
    { name: "Universal smile",imageUrl: "./images/Universal smile.jpg ",location:" 143/74, Picnic Garden Road, Tiljala, Kolkata - 700039",contact:"phone.no:7947106203", children: "38 children",cost:" 110-125/-per plate" ,latitude: 22.528781897130525, longitude: 88.38600906231345}, 
];


const openRouteServiceApiKey = '5b3ce3597851110001cf624830174d651e40431086ea4ce874e8d351'; // Replace with your API key


let distanceElement = document.getElementById('distance');
let durationElement = document.getElementById('duration');

function updateRouteAndInfo(userLat, userLng, destinationLat, destinationLng) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${openRouteServiceApiKey}&start=${userLng},${userLat}&end=${destinationLng},${destinationLat}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const route = data.features[0].geometry.coordinates;
            const latLngs = route.map(coord => [coord[1], coord[0]]);
            
            // Update the route polyline on the map
            if (currentRoute) {
                map.removeLayer(currentRoute);
            }
            currentRoute = L.polyline(latLngs, { color: 'blue' }).addTo(map);

            // Update the distance and time info
            const distance = (data.features[0].properties.segments[0].distance / 1000).toFixed(2); // in km
            const duration = (data.features[0].properties.segments[0].duration / 60).toFixed(2);  // in minutes
            distanceElement.textContent = `${distance} km`;
            durationElement.textContent= `${duration} min`;

            // Fit the map to the route
            map.fitBounds(currentRoute.getBounds());
        })
        .catch(error => {
            console.error('Error fetching route:', error);
        });
}

// When the user moves, update the route and info in real-time
navigator.geolocation.watchPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("send-location", { latitude, longitude });

        if (userMarker) {
            userMarker.setLatLng([latitude, longitude]);

            // Assuming destination is selected when user clicks on the landmark
            if (currentLandmark) {
                updateRouteAndInfo(latitude, longitude, currentLandmark.latitude, currentLandmark.longitude);
            }
        }
    },
    (error) => {
        console.error(error);
    },
    {
        enableHighAccuracy: true,
        timeout: 50000,
        maximumAge: 0,
    }
);

let currentLandmark = null;

landmarks.forEach((landmark) => {
    const popupContent = `
        <div>
            <h3>${landmark.name}</h3>
            <h3>${landmark.location}</h3>
            <h3>${landmark.contact}</h3>
            <h3>${landmark.cost}</h3>
            <h3>${landmark.children}</h3>
            <img src="${landmark.imageUrl}" alt="${landmark.name}" style="width: 100px; height: auto;" />
        </div>
    `;
    const marker = L.marker([landmark.latitude, landmark.longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup(popupContent)
        .on("click", () => {
            currentLandmark = landmark; // Set the clicked landmark as the destination

            if (userMarker) {
                updateRouteAndInfo(userMarker.getLatLng().lat, userMarker.getLatLng().lng, landmark.latitude, landmark.longitude);
            }
        });
});

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    map.setView([latitude, longitude], 12);
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
