
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
