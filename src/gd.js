var gd = {};

gd.data = [
    {
        type: "choropleth",
        loc: ["CAN", "USA", "RUS", "AUS", "FRA"],
        z: [80, 20, 100, 60, 40]
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
    },
    {
        type: "map-scatter",
        mode: "markers",
        lon: [-75],
        lat: [45],
        marker: {
            color: 'rgb(255, 0, 0)'
        }
    }
];

gd.layout = {
    width: 960,
    height: 960,
    map: {
        projection: {
            type: 'equirectangular',
            center: [0, 0],  // acts like svg translate (how to use this?)
            rotate: [-60, 0],
//             parallels: [0, 62],  // for certain projections
            scope: 'globe'
        },
        //
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
        oceancolor: "none",  // should this be oceanlinecolor ?
        oceanwidth: 0,
        oceanfill: "#3399FF",
        //
        showcountries: false,
        countriescolor: "#aaa",
        countrieswidth: 1,
        countriesfill: "none",
        //
        lonaxis: {
            range: [-170, 160],
//             range: 'auto', 
            bounds: []
        },
        lataxis: {
            range: [-90, 90],
            bounds: []
        }
    }
};
