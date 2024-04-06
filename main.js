import './style.css'
import * as d3 from 'd3'
import * as topojson from "topojson-client";
import axios from 'axios';

const w = 960;

const h = 600;

d3.select('#app')
  .append('h1')
  .attr('id', 'title')
  .text("United States Educational Attainment");

d3.select('#app')
  .append('h3')
  .attr('id', 'description')
  .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)");

const svg = d3.select('#app')
  .append('svg')
  .attr('id', 'main-svg')
  .attr('width', w)
  .attr('height', h);

const path = d3.geoPath();

//////////API REQUEST///////////

const urls = ['https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json', 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'];

const fetchData = async () => {
  let promise = await Promise.all(urls.map((url) => axios.get(url)))
    .then(([{ data: bachelorsOrHigherData }, { data: us }]) => {
      ready(bachelorsOrHigherData, us)
    })
};

const ready = (bachelorsOrHigherData, us) => {

  //////////LEGEND//////////

  const bachelorMin = d3.min(bachelorsOrHigherData, (d) => d.bachelorsOrHigher);

  const bachelorMax = d3.max(bachelorsOrHigherData, (d) => d.bachelorsOrHigher);

  const tickInterval = (bachelorMax - bachelorMin) / 8;

  const legendTicks = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((x) => Math.round((bachelorMin + (x * tickInterval)) * 10) / 10);

  var x = d3.scaleLinear().domain([1, 10]).rangeRound([600, 860]);

  var color = d3
    .scaleThreshold()
    .domain(d3.range(1, 10))
    .range(d3.schemeBlues[9]);

  var legend = svg
    .append("g")
    .attr('id', 'legend')
    .attr("transform", "translate(0,40)");

  legend.selectAll("rect")
    .data(
      color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("height", 8)
    .attr("x", function (d) {
      return x(d[0]);
    })
    .attr("width", function (d) {
      return x(d[1]) - x(d[0]);
    })
    .attr("fill", function (d) {
      return color(d[0]);
    });

  legend.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("text-anchor", "start")
    .text("Bachelors Degree or Higher");

  legend.call(
    d3
      .axisBottom(x)
      .tickSize(13)
      .tickFormat(function (x, i) {
        return i ? Math.round((i * tickInterval)) + "%" : Math.round(bachelorMin) + "%";
      })
      .tickValues(color.domain())
  )
    .attr('stroke', 'white')
    .select(".domain")
    .remove();

  //////////MAP COUNTIES//////////

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr('id', (d) => d.id)
    .attr("data-fips", (d) => d.id)
    .attr('data-education', (d) => bachelorsOrHigherData.find(item => item.fips === d.id).bachelorsOrHigher)
    .attr('county-name', (d) => bachelorsOrHigherData.find(item => item.fips === d.id).area_name)
    .attr('state-name', (d) => bachelorsOrHigherData.find(item => item.fips === d.id).state)
    .attr("fill", (d) => {
      let education = bachelorsOrHigherData.find(item => item.fips === d.id).bachelorsOrHigher;
      if (education < 9) {
        return color(0)
      } else if (education >= 9 && education < 18) {
        return color(1)
      } else if (education >= 18 && education < 27) {
        return color(2)
      } else if (education >= 27 && education < 36) {
        return color(3)
      } else if (education >= 36 && education < 45) {
        return color(4)
      } else if (education >= 45 && education < 54) {
        return color(5)
      } else if (education >= 54 && education < 63) {
        return color(6)
      } else if (education > 63) {
        return color(7)
      } else {
      }
    })
    .attr("d", path)

  //////////TOOLTIP/////////  

  d3.select('body')
    .append('div')
    .attr('id', 'tooltip')
    .append('p')
    .attr('id', 'tooltip-info')
    .attr('class', 'tooltipText');

  d3.selectAll('path')
    .data(topojson.feature(us, us.objects.counties).features)
    .join('path')
    .on("mouseover", function () {

      d3.select(this)
        .attr("stroke", "black")
        .attr('cursor', 'pointer');
    })
    .on("mouseout", function () {

      d3.select(this)
        .attr("stroke", "none");

      d3.select("#tooltip")
        .style("opacity", 0);
    })
    .on('mousemove', function (e) {
      const cursorX = e.clientX;
      const cursorY = e.clientY;

      const stateName = this.getAttribute('state-name');
      const countyName = this.getAttribute('county-name');
      const education = this.getAttribute('data-education');

      d3.select("#tooltip")
        .attr("data-education", education)
        .style("opacity", 1)
        .style("left", cursorX - 100 + "px")
        .style("top", cursorY - 80 + "px")
        .style('background', this.getAttribute('fill'));

      d3.select('#tooltip-info')
        .text(countyName + ", " + stateName + " " + education + "%");
    })

  //////////MAP STATES//////////  

  svg.append("path")
    .datum(
      topojson.mesh(us, us.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", path);

}

fetchData()