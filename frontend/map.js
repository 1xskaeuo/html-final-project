document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) return;

    const coordinates = [47.235075, 39.705473];

    const map = L.map('map').setView(coordinates, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #702080 0%, #22355e 100%);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
            ">
                •
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    const marker = L.marker(coordinates, {
        icon: customIcon,
        title: 'Memory Game Headquarters'
    }).addTo(map);

    marker.bindPopup(`
        <div style="padding: 10px; max-width: 200px;">
            <strong>Memory Game HQ</strong><br>
            ул. Текучёва, 139А<br>
            Ростов-на-Дону
        </div>
    `);

    marker.openPopup();

    L.circle(coordinates, {
        color: '#667eea',
        fillColor: '#667eea',
        fillOpacity: 0.1,
        radius: 30
    }).addTo(map);
});