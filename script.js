const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

function init() {
  createParallelCoordinates("#vi1");
  createBoxPlot("#vi2");
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
    .selectAll("line.lineValue")
    .data(data)
    .join("path")
    .attr("class", "lineValue itemValue")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("stroke-width",1)
    .style("opacity", 0.5)
    .on("mouseover", (event, d) => handleMouseOver(d))
    .on("mouseleave", (event, d) => handleMouseLeave())

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

function createBoxPlot(id) {
  //var iterator = -1;
  const svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    `translate(${margin.left},${margin.top})`);

  d3.csv("data.csv").then(function (data) {
    // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
    var maxlen = 0
    var sumstat = d3.rollup(data, function(d) {
        q1 = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.25)
        median = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.5)
        q3 = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.75)
        interQuantileRange = q3 - q1
        
        //console.log(Array.from(d.map(function(g){ return g.hp;})));
        min = d3.min(Array.from(d.map(function(g){ return g.hp;})), s => +s);//tranform string in ints
        //console.log(min);
        max = d3.max(Array.from(d.map(function(g){ return g.hp;})), s => +s);
        if(max > q3 + 1.5 * interQuantileRange){
          max = q3 + 1.5 * interQuantileRange;
        }
        var data_sorted = d.map(function(g){return g.hp;}).sort(d3.ascending);
        var outliars = data_sorted.filter((d) => d > max || d < min);
        if (outliars.length > maxlen){
          maxlen = outliars.length;
        }
        //console.log(max)
        return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max, outliars: outliars})
      }, d => d.types)
    
    var sumstatArr = Array.from(sumstat);
    //console.log(sumstat)
    //console.log(sumstatArr)
    // Show the X scale
    var x = d3.scaleBand()
      .rangeRound([ 0, width ])
      .domain(["Psychic", "Water", "Colorless", "Fire", "Fighting", "Lightning", "Grass", "Metal", "Darkness"])
      .padding(0.1)
      //.paddingInner(1)
      //.paddingOuter(.5)
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))

    // Show the Y scale
    var y = d3.scaleLinear()
      .domain([0, 230])
      .range([height, 0])
    svg.append("g").call(d3.axisLeft(y))

    // Show the main vertical line
    svg
      .selectAll("vertLines")
      .data(sumstat)
      .enter()
      .append("line")
        .attr("x1", function(d){return(x(d[0])+x.bandwidth()/2);})
        .attr("x2", function(d){return(x(d[0])+x.bandwidth()/2);})
        .attr("y1", function(d){/*console.log(d[1].min);*/return(y(d[1].min))})
        .attr("y2", function(d){return(y(d[1].max))})
        .attr("stroke", "black")
        .style("width", 40)

    // rectangle for the main box
    //var boxWidth = x.bandwidth();
    svg
      .selectAll("boxes")
      .data(sumstat)
      .enter()
      .append("rect")
          .attr("x", function(d){return(x(d[0]))})
          .attr("y", function(d){/*console.log(d[1]);*/return(y(d[1].q3))})
          .attr("height", function(d){
            /*console.log(y(d.q1));
            console.log(y(d.q3));
            console.log(y(d.q1)-y(d.q3));*/
            return(y(d[1].q1)-y(d[1].q3));})
          .attr("width", function(){/*console.log(x.bandwidth());*/return x.bandwidth();} )
          .attr("stroke", "black")
          .style("fill", function(d){
            if(d[0] == "Psychic"){
              return "#4f0a5e";
            }
            if(d[0] == "Water"){
              return "#10a3cc";
            }
            if(d[0] == "Colorless"){
              return "#dfecf0";
            }
            if(d[0] == "Fire"){
              return "#f03a0c";
            }
            if(d[0] == "Fighting"){
              return "#541606";
            }
            if(d[0] == "Lightning"){
              return "#eeff05";
            }
            if(d[0] == "Grass"){
              return "#099909";
            }
            if(d[0] == "Metal"){
              return "#3d403d";
            }
            if(d[0] == "Darkness"){
              return "#111211";
            }
          })

       // Show the median
    svg
      .selectAll("medianLines")
      .data(sumstat)
      .enter()
      .append("line")
        .attr("x1", function(d){return(x(d[0])) })
        .attr("x2", function(d){return(x(d[0])+x.bandwidth()) })
        .attr("y1", function(d){return(y(d[1].median))})
        .attr("y2", function(d){return(y(d[1].median))})
        .attr("stroke", "black")
        .style("width", 80)
      
      //console.log(maxlen);
      //show outliers
      let i = 0;
      while(i < maxlen){
        svg
          .selectAll("circles")
          .data(sumstat)
          .enter()
          .append("circle")
            .attr("fill", "currentColor")
            .attr("fill-opacity", 0.2)
            .attr("stroke", "none")
            .join("circle")
              .attr("r", 2)
              .attr("cx", function(d){/*console.log(d);*/return x(d[0])+x.bandwidth()/2 + (Math.random() - 0.5) * 4;})
              .attr("cy", function(d){/*console.log(y(d[1].outliars[j]),"----->",j,"--",d[1].outliars);*/
              if(i >= d[1].outliars.length){
                return y(-1000000);//to not draw undefined values
              }
              return y(d[1].outliars[i]);});
        i = i + 1;
      }

  });
}


function handleMouseOver(item) {
  console.log("jjh");
  d3.selectAll(".itemValue")
    .filter(function (d, i) {
      return d.name == item.name;
    })
    .style("stroke-width", 5)
    .style("stroke", "red");
}

function handleMouseLeave() {
  console.log("asd")
  d3.selectAll(".itemValue")
    .style("stroke-width", 1)
    .style("stroke", "#69b3a2");
  
  /*d3.selectAll("circle.itemValue")
    .style("stroke-width", 1)
    .style("stroke", "#69b3a2");*/
}