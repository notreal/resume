'use strict';

var nr = {}; // single global to hold everything

function makeDate(dateString) {
    // cast
    var d = new Date(dateString);
    // ignore timezone
    return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
}

d3.json('data.json', function(error, data) { 
    if (error) throw error;
    nr = data; 

    // cast dates
    nr.timeline.forEach(function(d) {
        d.start = makeDate(d.start);
        d.end = makeDate(d.end);
    });

    drawTimeline();
    //drawSkills();
});

function calcBoxOffset(d, width) {
    if (d.displayWidth == 3) { return 1; };
    // no width=2
    if (d.type == 'employment') {
        return 2 * width / 3;
    } else if (d.type == 'education') {
        return width / 3;
    } else {
        return 1;
    }
}

function calcBoxSizes(d) {
    // returns class suffix, title y, subtitle y
    if (d.type == 'certification') { return ['', 15, 28] };
    var h = nr.yScale(d.start) - nr.yScale(d.end);
    if (d.displayWidth == 3 && h > 38) { return ['-lg', 20, 40] };
    if (h < 34) { return ['-sm', 11, 20] };
    if (d.title.length > 26 || d.subtitle.length > 30 ) { return ['-sm', 11, 20] };
    return ['', 15, 28];
}

function drawTimeline() {
    var width = 500,
        axisWidth = 32,
        innerWidth = width - axisWidth,
        height = 800;
    var minDate = d3.min(nr.timeline.map(d => d.start)),
        maxDate = d3.max(nr.timeline.map(d => d.end));

    // draw axis
    nr.yScale = d3.scaleTime()
        .domain([maxDate, minDate])
        .range([0, height]);
    var yAxis = d3.axisLeft(nr.yScale)
        .ticks(d3.timeYear.every(1));
    var svg = d3.select('#timeline');
    svg.append('g')
        .attr('transform', 'translate(' + width + ',0)')
        .call(yAxis);
    
    // draw boxes
    var timeline = svg.selectAll('g.not-axis')
        .data(nr.timeline).enter()
        .append('g')
        .attr('transform', function(d) {
            var x = calcBoxOffset(d, innerWidth);
            var y = d3.min([nr.yScale(d.end), height - 25]) + 1;
            return 'translate(' + x + ',' + y + ')';
        });
    
    timeline.append('rect')
        .attr('width', d => Math.floor(innerWidth / 3 * d.displayWidth) - 2)
        .attr('height', d => nr.yScale(d.start) - nr.yScale(d.end))
        .attr('rx', 8).attr('ry', 8)
        .attr('class', d => d.type == 'employment' ? 'timeline-emp' : 'timeline-edu');

    var empText = timeline.append('text')
        .attr('class', 'timeline-text');

    empText.append('tspan')
        .attr('class', d => 'timeline-title' + calcBoxSizes(d)[0])
        .attr('x', 5)
        .attr('y', d => calcBoxSizes(d)[1])
        .text(d => d.title);

    empText.append('tspan')
        .attr('class', d => 'timeline-subtitle' + calcBoxSizes(d)[0] )
        .attr('x', 5)
        .attr('y', d => calcBoxSizes(d)[2])
        .text(d => d.subtitle);

}
