var gd = {};

gd.data = [
    {
        type: "map-scatter",
        mode: "markers",
        lon: [-75, 0, 0],
        lat: [45, 0, 55],
        marker: {
            size: [10, 20, 30],
            color: ['red', 'blue', 'green']
        }
    }
];

gd.layout = {
    width: 960,
    height: 960,
    map: {
        projection: {
            type: 'mercator',
            center: [0, 0],
            rotate: [0, 0, 0],
            scope: 'globe'
        },
        coastlines: { }
    }
};
