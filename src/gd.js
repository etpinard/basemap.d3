var gd = {};

gd.data = [
    {
        type: "map-scatter",
        mode: "markers",
        lon: [-75, 0, 0, -43],
        lat: [45, 0, 55, -22],
        marker: {
            color: 'rgb(255, 0, 0)'
        }
    },
    {
        type: "map-scatter",
        mode: "lines",
        lon: [-77, 116],
        lat: [39, 24],
        line: {
            color: 'rgb(0, 255, 255)',
            width: 5
        }
    }
];

gd.layout = {
    width: 960,
    height: 960,
    map: {
        projection: {
            type: 'orthographic',
            center: [0, 0],
            rotate: [-60, 0],
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
            showocean: false,
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
