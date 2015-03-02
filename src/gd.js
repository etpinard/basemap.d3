var gd = {};

gd.data = [
    {
        type: "map-scatter",
        mode: "markers",
        lon: [-75, 0, 0, -43],
        lat: [45, 0, 55, -22]
    }
];

gd.layout = {
    width: 960,
    height: 960,
    map: {
        projection: {
            type: 'orthographic',
            center: [0, 0],
            rotate: [0, 0, 0],
//             parallels: [0, 62],
            scope: 'globe',
        },
        basemap: {
            showcoastlines: true,
            showland: true,
            showoceans: true,
            showcountries: true,
            showsubunits: true
        }
    },
    lonaxis: {
        range: [] 
    },
    lataxis: {
        range: [] 
    }

    
};
