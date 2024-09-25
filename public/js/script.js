
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
    { name: "Helping Hands Ngo", imageUrl: " ", latitude: 22.542556, longitude: 88.3825428 },   
    { name: "Society For Indian Children's Welfare", latitude: 22.5373426, longitude: 88.3637687 },  
    { name: "The Hope Foundation Ltd", latitude: 22.5052385, longitude: 88.3569133 }, 
    { name: "Hope Kolkata Foundation", latitude: 22.5209543, longitude: 88.3582089 }, 
];


landmarks.forEach((landmark) => {
        const popupContent = `
            <div>
                <h3>${landmark.name}</h3>
                <img src="${landmark.imageUrl}" alt="${landmark.name}" style="width: 200px; height: auto;" />
            </div>
        `;
    const marker = L.marker([landmark.latitude, landmark.longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup(landmark.name)
        .on("click", () => {
            if (userMarker) {
                
                if (currentRoute) {
                    map.removeControl(currentRoute);
                }
                
                currentRoute = L.Routing.control({
                    waypoints: [
                        L.latLng(userMarker.getLatLng()), 
                        L.latLng(landmark.latitude, landmark.longitude) 
                    ],
                    routeWhileDragging: true,
                    createMarker: function() { return null; }
                }).addTo(map);
                
                
                //map.fitBounds([
                    //userMarker.getLatLng(),
                    //[ landmark.latitude, landmark.longitude]
               // ]);
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
