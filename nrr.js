'use strict';

var nr = {
    'width': 500,
    'height': 800,
    'axisWidth': 32
}; // single global to hold everything

d3.json('data.json', function(error, data) { 
    if (error) throw error;
    nr.timeline = data.timeline;
    nr.skills = data.skills; 

    // cast dates
    nr.timeline.forEach(function(d) {
        d.start = makeDate(d.start);
        d.end = makeDate(d.end);
    });

    drawTimeline();
    drawSkills();
    drawDetails();
});

function drawTimeline() {
    var innerWidth = nr.width - nr.axisWidth,
        minDate = d3.min(nr.timeline.map(d => d.start)),
        maxDate = d3.max(nr.timeline.map(d => d.end)),
        svg = d3.select('#timeline');
    nr.yScale = d3.scaleTime().domain([maxDate, minDate]).range([0, nr.height]);

    // draw boxes
    var timeline = svg.selectAll('g')
        .data(nr.timeline).enter()
        .append('g')
        .attr('transform', function(d) {
            var x = calcBoxOffset(d);
            var y = d3.min([nr.yScale(d.end), nr.height - 25]) + 1;
            return 'translate(' + x + ',' + y + ')';
        });
    timeline.append('rect')
        .attr('width', d => Math.floor(innerWidth / 3 * d.displayWidth) - 2)
        .attr('height', d => nr.yScale(d.start) - nr.yScale(d.end))
        .attr('rx', 8).attr('ry', 8)
        .attr('class', d => d.type == 'employment' ? 'timeline-emp' : 'timeline-edu');

    // label boxes
    var empText = timeline.append('text').attr('class', 'timeline-text');
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
    
    // draw axis
    var yAxis = d3.axisRight(nr.yScale)
        .ticks(d3.timeYear.every(1))
        .tickSize(0);
    svg.append('g').call(yAxis);
    // remove unnecessary vertical line
    svg.selectAll('path.domain').remove();
}

function drawSkills() {
    // d3 expects data as array, so transform here
    var skills = Object.keys(nr.skills).map(function(x) { return { 'skill': x, 'level': nr.skills[x] } });
    // can't afford to take space from timeline, so imperceptibly off-center viz section
    var vizGap = 16;
    d3.select('#skills').selectAll('div')
        .data(skills).enter()
        .append('div')
        .text(d => d.skill)
        .attr('class', d => 'skill skill' + d.level)
        .style('width', d => (nr.width - vizGap) / 5 * d.level );
}

function drawDetails() {
    var details = d3.select('#details');
    
    var empData = nr.timeline.filter(d => d.type == 'employment');
    details.append('h2').text('Employment');
    var empDivs = details.selectAll('div.empDetails')
        .data(empData).enter()
        .append('div')
        .attr('class', 'experienceDetails empDetails');
    empDivs.append('h4').html(function(d) {
        return d.subtitle + ' <span class="subtle">at</span> ' + d.title + 
        ' <span class="subtle">from</span> ' + formatDate(d.start)  + 
        ' <span class="subtle">to</span> ' + formatDate(d.end)
        });
    empDivs.append('p').text(d => d.text);

    var eduData = nr.timeline.filter(d => d.type == 'education'); 
    details.append('h2').text('Education');
    var eduDivs = details.selectAll('div.eduDetails')
        .data(eduData).enter()
        .append('div')
        .attr('class', 'experienceDetails eduDetails');
    eduDivs.append('h4').html(function(d) {
        return '<span class="subtle">Studied</span> ' + d.subtitle + ' <span class="subtle">at</span> ' + 
        d.title + ' <span class="subtle">from</span> ' + formatDate(d.start)  + 
        ' <span class="subtle">to</span> ' + formatDate(d.end)
        });

    var certData = nr.timeline.filter(d => d.type == 'certification'); 
    details.append('h2').text('Certification');
    var certDivs = details.selectAll('div.certDetails')
        .data(certData).enter()
        .append('div')
        .attr('class', 'experienceDetails certDetails');
    certDivs.append('h4').html(d => d.title + ' on ' + formatDate(d.start));

}

// helpers below

function makeDate(dateString) {
    var d = new Date(dateString);
    // dates are rounded to month, compensate for browser timezone adjustment
    return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
}

function formatDate(date) {
    var month = String("00" + (1 + date.getMonth())).slice(-2);
    return date.getFullYear() + '-' + month;
}

function calcBoxOffset(d) {
    if (d.displayWidth == 3) { return nr.axisWidth; };
    // no width=2
    if (d.type == 'employment') {
        return 2/3 * (nr.width - nr.axisWidth) + nr.axisWidth;
    } else if (d.type == 'education') {
        return 1/3 * (nr.width - nr.axisWidth) + nr.axisWidth;
    } else {
        return nr.axisWidth;
    }
}

function calcBoxSizes(d) {
    // returns class suffix, title y, subtitle y
    if (d.type == 'certification') { 
        return ['', 15, 28] 
    };
    var h = nr.yScale(d.start) - nr.yScale(d.end);
    if (d.displayWidth == 3 && h > 38) { 
        return ['-lg', 20, 40] 
    };
    if (h < 34) { 
        return ['-sm', 11, 20] 
    };
    if (d.title.length > 26 || d.subtitle.length > 30 ) { 
        return ['-sm', 11, 20] 
    };
    return ['', 15, 28];
}
