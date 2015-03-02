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
            showcoastlines: false,
            coastlinescolor: "#aaa",
            coastlineswidth: 2,
            coastlinesfill: "none",
            //
            showland: true,
            landcolor: "#aaa",
            landwidth: 2,
            landfill: "#CCFFCC",
            //
            showocean: true,
            oceancolor: "none",
            oceanwidth: 0,
            oceanfill: "#3399FF",
            //
            showcountries: true,
            countriescolor: "#aaa",
            countrieswidth: 1,
            countriesfill: "none"
        }
    },
    lonaxis: {
        range: [] 
    },
    lataxis: {
        range: [] 
    }

    
};
