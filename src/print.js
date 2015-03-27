var Print = {};

Print.init = function init() {
    var div = document.createElement('div');
    div.setAttribute('class', 'container');

    var codeDiv = document.createElement('div');
    codeDiv.setAttribute('class', 'code-div');

    var plotDiv = document.createElement('div');
    plotDiv.setAttribute('class', 'plot-div');

    div.appendChild(codeDiv);
    div.appendChild(plotDiv);
    document.body.appendChild(div);

    return div;
}

Print.printToDOM = function printToDOM(gd) {
    var codePre = d3.select(gd.div)
                    .select('div.code-div')
                    .append('pre');

    codePre.html(JSON.stringify(
        {data: gd.data, layout: gd.layout},
        null, 2));
};

Print.removeCodeDiv = function removeCodeDiv(gd) {
    var codePre = d3.select(gd.div)
                    .select('div.code-div')
                    .remove();
};
