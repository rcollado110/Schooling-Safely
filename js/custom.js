function initialize() {
    var map = new google.maps.Map(
      document.getElementById("map"), {
        center: new google.maps.LatLng(37.4419, 70.1419),
        zoom: 3,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
    map.data.addGeoJson(SchoolDistricts.geojson);
    map.data.setStyle({
      strokeColor: "blue"
    })
  
  }

      // School and Criminal data D3

      var width = 900,
      height = 600;

    var svg = d3.select("#map-container").append("svg")
      .attr("width", width)
      .attr("height", height);

    var projection = d3.geo.mercator() // mercator makes it easy to center on specific lat/long
      .scale(50000)
      .center([-73.94, 40.70]); // long, lat of NYC


    var pathGenerator = d3.geo.path()
      .projection(projection);

    var tooltip = d3.select("body").append("div").attr("class", "!tooltip");

    d3.json("/../SchoolDistricts.geojson", function (error, boroughs) {
      if (error) return console.error(error);
      //console.log(boroughs);

      svg.selectAll("path")
        .data(boroughs.features)
        .enter()
        .append("path")
        .attr("class", "boroughs")
        .attr("d", pathGenerator)
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

      // With map made, load data and add it to our map
      d3.csv('/../nyc-crime-subset.csv', function (error2, crimeData) {
        if (error2) return console.error(error2);

        addPointsToMap(crimeData);
      });

    });

    var tooltipOffset = { x: 5, y: -25 };

    //Create a tooltip, hidden at the start
    function showTooltip(d) {
      moveTooltip();

      tooltip.style("display", "block")
        .text("School District: " + d.properties.school_dist);
        tooltip.color("purple");
    }

    //Move the tooltip to track the mouse
    function moveTooltip() {
      tooltip.style("top", (d3.event.pageY + tooltipOffset.y) + "px")
        .style("left", (d3.event.pageX + tooltipOffset.x) + "px");
    }

    function hideTooltip() {
      tooltip.style("display", "none");
    }

    var addPointsToMap = function (crimeData) {
      var colorScale = d3.scale.category10();

      var radiusScale = d3.scale.sqrt()
        .domain(d3.extent(crimeData, function (crime) { return +crime.TOT; }))
        .range([2, 15]);

      // Add the tooltip container to the vis container
      // it's invisible and its position/contents are defined during mouseover
      var tooltip = d3.select("#map-container").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      // tooltip mouseover event handler
      var tipMouseover = function (d) {
        this.setAttribute("class", "circle-hover"); // add hover class to emphasize

        var color = colorScale(d.CR);
        var html = "<span style='color:" + color + ";'>" + d.CR + "</span><br/>" +
          "Count: " + d.TOT + "<br/>Date: " + d.MO + "/" + d.YR;

        tooltip.html(html)
          .style("left", (d3.event.pageX - 285) + "px")
          .style("top", (d3.event.pageY - 500) + "px")
          .transition()
          .duration(200)
          .style("opacity", .9) // started as 0!!!
      };

      //this is our tooltip mouseout event handler
      var tipMouseout = function (d) {
        this.classList.remove("circle-hover"); // remove hover class

        tooltip.transition()
          .duration(300)
          .style("opacity", 0); // don't care about position! sorry not sorry.
      };

      svg.selectAll("circle")
        .data(crimeData)
        .enter().append("circle")
        .attr("fill", function (d) { return colorScale(d.CR); })
        .attr("cx", function (d) { return projection([+d.longitude, +d.latitude])[0]; })
        .attr("cy", function (d) { return projection([+d.longitude, +d.latitude])[1]; })
        .attr("r", function (d) { return radiusScale(+d.TOT); })
        .on("mouseover", tipMouseover)
        .on("mouseout", tipMouseout);
    };