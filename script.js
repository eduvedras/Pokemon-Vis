const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

function init() {
  createParallelCoordinates("#vi1");
  //createParallelSets("#vi2");
}

function createParallelCoordinates(id) {
  const svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    `translate(${margin.left},${margin.top})`);

  d3.csv("data.csv").then(function (data) {
    // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
  dimensions = Object.keys(data[0]).filter(function(d) { return d != "name" && d != "types" && d != "weaknesses" && d != "rarity" 
                                                        && d != "resistances" && d != "evolution" && d!=""})

  // For each dimension, I build a linear scale. I store all in a y object
  const y = {}
  for (i in dimensions) {
    dimension = dimensions[i]
    y[dimension] = d3.scaleLinear()
      .domain( d3.extent(data, function(d) { return +d[dimension]; }) )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
      return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the lines
  svg
    .selectAll("myPath")
    .data(data)
    .join("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; })
      .style("fill", "black")
  });
}

function createParallelSets(id) {
  const svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("id", "gScatterPlot")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  d3.json("data.json").then(function (data) {
    keys = Object.keys(data[0]).filter(function(d) { return d != "hp" && d != "nationalPokedexNumbers" && d != "damage" && d != "energyCost"})
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.budget)])
      .range([0, width]);
    svg
      .append("g")
      .attr("id", "gXAxis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat((x) => x / 1000000 + "M"));

    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    const radiusScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.title.length)])
      .range([4, 20]);

    svg.append("g").attr("id", "gYAxis").call(d3.axisLeft(y));

    svg
      .selectAll("circle.circleValues")
      .data(data, (d) => d.title)
      .join("circle")
      .attr("class", "circleValues itemValue")
      .attr("cx", (d) => x(d.budget))
      .attr("cy", (d) => y(d.rating))
      .attr("r", (d) => radiusScale(d.title.length))
      .style("fill", "steelblue")
      .style("stroke", "black")
      .on("mouseover", (event, d) => handleMouseOver(d))
      .on("mouseleave", (event, d) => handleMouseLeave())
      .append("title")
      .text((d) => d.title);
  });
}

function createLineChart(id) {
  const svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("id", "gLineChart")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  d3.json("data.json").then(function (data) {
    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.oscar_year))
      .range([width, 0]);
    svg
      .append("g")
      .attr("id", "gXAxis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.budget)])
      .range([height, 0]);
    svg
      .append("g")
      .attr("id", "gYAxis")
      .call(d3.axisLeft(y).tickFormat((x) => x / 1000000 + "M"));

    svg
      .append("path")
      .datum(data)
      .attr("class", "pathValue")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.oscar_year))
          .y((d) => y(d.budget))
      );

    const yMax = d3.max(data, (d) => d.budget);
    const yMin = d3.min(data, (d) => d.budget);

    svg
      .selectAll("circle.circleValues")
      .data(data, (d) => d.title)
      .join("circle")
      .attr("class", "circleValues itemValue")
      .attr("cx", (d) => x(d.oscar_year))
      .attr("cy", (d) => y(d.budget))
      .attr("r", 4)
      .style("fill", function (d, i) {
        if (d.budget == yMax) return "lightgreen";
        else if (d.budget == yMin) return "yellow";
        else return "steelblue";
      })
      .style("stroke", "black")
      .on("mouseover", (event, d) => handleMouseOver(d))
      .on("mouseleave", (event, d) => handleMouseLeave())
      .append("title")
      .text((d) => d.title);
  });
}

function updateBarChart(start, finish) {
  d3.json("data.json").then(function (data) {
    data = data.filter(function (elem) {
      return start <= elem.oscar_year && elem.oscar_year <= finish;
    });

    const svg = d3.select("#gBarChart");

    const x = d3.scaleLinear().domain([0, 10]).range([0, width]);
    svg.select("#gXAxis").call(d3.axisBottom(x));

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.oscar_year))
      .range([0, height])
      .padding(0.2);

    const barFillConvertion = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.budget)])
      .range([0, 1]);

    svg.select("#gYAxis").call(d3.axisLeft(y));

    svg
      .selectAll("rect.rectValue")
      .data(data, (d) => d.title)
      .join(
        (enter) => {
          rects = enter
            .append("rect")
            .attr("class", "rectValue itemValue")
            .attr("x", x(0))
            .attr("y", (d) => y(d.oscar_year))
            .attr("width", (d) => x(0))
            .attr("height", y.bandwidth())
            .attr("fill", function (d, i) {
              return d3.interpolateBlues(barFillConvertion(d.budget));
            })
            .style("stroke", "black")
            .on("mouseover", (event, d) => handleMouseOver(d))
            .on("mouseleave", (event, d) => handleMouseLeave());
          rects
            .transition()
            .duration(1000)
            .attr("width", (d) => x(d.rating));
          rects.append("title").text((d) => d.title);
        },
        (update) => {
          update
            .transition()
            .duration(1000)
            .attr("x", x(0))
            .attr("y", (d) => y(d.oscar_year))
            .attr("width", (d) => x(d.rating))
            .attr("height", y.bandwidth())
            .attr("fill", function (d, i) {
              return d3.interpolateBlues(barFillConvertion(d.budget));
            });
        },
        (exit) => {
          exit.remove();
        }
      );
  });
}

function updateScatterPlot(start, finish) {
  d3.json("data.json").then(function (data) {
    data = data.filter(function (elem) {
      return start <= elem.oscar_year && elem.oscar_year <= finish;
    });

    const svg = d3.select("#gScatterPlot");

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.budget)])
      .range([0, width]);
    svg
      .select("#gXAxis")
      .call(d3.axisBottom(x).tickFormat((x) => x / 1000000 + "M"));

    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    const radiusScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.title.length)])
      .range([4, 20]);

    svg.select("gYAxis").call(d3.axisLeft(y));

    svg
      .selectAll("circle.circleValues")
      .data(data, (d) => d.title)
      .join(
        (enter) => {
          circles = enter
            .append("circle")
            .attr("class", "circleValues itemValue")
            .attr("cx", (d) => x(d.budget))
            .attr("cy", (d) => y(0))
            .attr("r", (d) => radiusScale(d.title.length))
            .style("fill", "steelblue")
            .style("stroke", "black")
            .on("mouseover", (event, d) => handleMouseOver(d))
            .on("mouseleave", (event, d) => handleMouseLeave());
          circles
            .transition()
            .duration(1000)
            .attr("cy", (d) => y(d.rating));
          circles.append("title").text((d) => d.title);
        },
        (update) => {
          update
            .transition()
            .duration(1000)
            .attr("cx", (d) => x(d.budget))
            .attr("cy", (d) => y(d.rating))
            .attr("r", (d) => radiusScale(d.title.length));
        },
        (exit) => {
          exit.remove();
        }
      );
  });
}

function updateLineChart(start, finish) {
  d3.json("data.json").then(function (data) {
    data = data.filter(function (elem) {
      return start <= elem.oscar_year && elem.oscar_year <= finish;
    });

    const svg = d3.select("#gLineChart");

    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.oscar_year))
      .range([width, 0]);
    svg.select("#gXAxis").call(d3.axisBottom(x));

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.budget)])
      .range([height, 0]);
    svg
      .select("#gYAxis")
      .call(d3.axisLeft(y).tickFormat((x) => x / 1000000 + "M"));

    svg
      .select("path.pathValue")
      .datum(data)
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.oscar_year))
          .y((d) => y(d.budget))
      );

    const yMax = d3.max(data, (d) => d.budget);
    const yMin = d3.min(data, (d) => d.budget);

    svg
      .selectAll("circle.circleValues")
      .data(data, (d) => d.title)
      .join(
        (enter) => {
          circles = enter
            .append("circle")
            .attr("class", "circleValues itemValue")
            .attr("cx", (d) => x(d.oscar_year))
            .attr("cy", (d) => y(0))
            .attr("r", 4)
            .style("fill", function (d, i) {
              if (d.budget == yMax) return "lightgreen";
              else if (d.budget == yMin) return "yellow";
              else return "steelblue";
            })
            .style("stroke", "black")
            .on("mouseover", (event, d) => handleMouseOver(d))
            .on("mouseleave", (event, d) => handleMouseLeave());
          circles
            .transition()
            .duration(1000)
            .attr("cy", (d) => y(d.budget));
          circles.append("title").text((d) => d.title);
        },
        (update) => {
          update
            .transition()
            .duration(1000)
            .attr("cx", (d) => x(d.oscar_year))
            .attr("cy", (d) => y(d.budget))
            .attr("r", 4)
            .style("fill", function (d, i) {
              if (d.budget == yMax) return "lightgreen";
              else if (d.budget == yMin) return "yellow";
              else return "steelblue";
            });
        },
        (exit) => {
          exit.remove();
        }
      );
  });
}

function handleMouseOver(item) {
  d3.selectAll(".itemValue")
    .filter(function (d, i) {
      return d.title == item.title;
    })
    .style("stroke-width", 5)
    .style("stroke", "red");
}

function handleMouseLeave() {
  d3.selectAll("rect.itemValue")
    .style("stroke-width", 1)
    .style("stroke", "black");

  d3.selectAll("circle.itemValue")
    .style("stroke-width", 1)
    .style("stroke", "black");
}
