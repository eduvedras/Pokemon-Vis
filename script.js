const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 700 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const brushHeight = 40;
var arr = [];
var sMap = {};
var flag = 0;

function init() {
  createParallelCoordinates("#vi1");
  createBoxPlot("#vi2");
}

function placeOutlier(data,stats,width,posX,posY){
  const outlen = stats.get(data.types).outliers.length;
  if(arr.includes("["+ posX+","+posY+"]")){
    var auxPlace = 1;
    var auxPlace2 = -1;
    var pos = 0;
    while(auxPlace<=outlen){
      pos = posX + width/2 + auxPlace * 8;
      if(!arr.includes("["+pos+","+posY+"]")){
        break;
      }
      pos = posX + width/2 + auxPlace2 * 8;
      if(!arr.includes("["+pos+","+posY+"]")){
        break;
      }
      auxPlace = auxPlace +1;
      auxPlace2 = auxPlace2 -1;
    }
    if(pos != 0){
      arr.push("["+ pos + "," + posY + "]");
      return pos;
    }
  }
  else{
    arr.push("["+ posX + "," + posY + "]");
    return posX + width/2;
  }
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
  keys = Object.keys(data[0]).filter(function(d) { return d != "id" && d != "outlier" && d != "name" && d != "types" && d != "weaknesses" && d != "rarity" 
                                                        && d != "resistances" && d != "evolution" && d!=""})

  const brush = d3.brushY()
  .extent([
    [-(brushHeight/2), 0],
    [(brushHeight/2), height]
  ])
  .on("start brush end", brushed);

  line = d3.line()
  .defined(([, value]) => value != null)
  .y(([key, value]) => y.get(key)(value))
  .x(([key]) => x(key))

  label = d => d.name

  colors = d3.interpolateLab("blue", "blue")

  deselectedColor = "#ddd"
  
    //height = keys.length * 120
  
  y = new Map(Array.from(keys, key => [key, d3.scaleLinear().domain(d3.extent(data, d => +d[key])).range([height,0])]))
  //x = d3.scalePoint(keys, [margin.top, height - margin.bottom])

  x = d3.scalePoint()
    .range([0, width])
    .padding(0.5)
    .domain(keys);


  const path = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.4)
      .selectAll("line.lineValue")
      //.data(data.slice().sort((a, b) => d3.ascending(a[keyz], b[keyz])))
      .data(data)
      .join("path")
        //.attr("stroke", d => z(d[keyz]))
        .attr("class", "lineValue itemValue")
        .attr("stroke", "blue")
        .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])));


  path.append("title")
  .text(label);
  
  svg.append("g")
    .selectAll("g")
    .data(keys)
    .join("g")
      .attr("transform", d => `translate(${x(d)},0)`)
      .each(function(d) { d3.select(this).call(d3.axisLeft(y.get(d))); })
      .call(g => g.append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .attr("fill", "currentColor")
        .text(d => d))
      .call(g => g.selectAll("text")
        .clone(true).lower()
        .attr("fill", "none")
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
        .attr("stroke", "white"))
      .call(brush);

  path.on("mouseover", (event, d) => handleMouseOver(d))
  .on("mouseleave", (event, d) => handleMouseLeave())
  .append("title")
  .text((d) => d.name)

    const selections = new Map();

    function brushed({selection}, key) {
      flag = 1;
      if (selection === null) selections.delete(key);
      else selections.set(key, selection.map(y.get(key).invert));
      const selected = [];
      path.each(function(d) {
        const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
        //d3.select(this).style("stroke", active ? z(d[keyz]) : deselectedColor);
        d3.select(this).style("stroke", function(){
          if(active){
            //console.log(this);
            sMap[this.getAttribute('d')] = 1;
             return "blue"; 
          }
          else{
            sMap[this.getAttribute('d')] = 0;
            return deselectedColor;
          }});
        if (active) {
          d3.select(this).raise();
          selected.push(d);
        }
      });
      svg.property("value", selected).dispatch("input");
    }
  
    return svg.property("value", data).node();
  });
}

function createBoxPlot(id) {
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
        outliars.sort(function(a, b){return a - b});
        //console.log(max)
        return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max, outliers: outliars})
      }, d => d.types)
    

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
      .append("text")
      .style("text-anchor", "middle")
      .attr("x", 595)
      .text("types")
      .style("fill", "black")

    // Show the Y scale
    var y = d3.scaleLinear()
      .domain([0, 230])
      .range([height, 0])
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text("hp")
      .style("fill", "black")

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
      .selectAll("boxes.boxValue")
      .data(sumstat)
      .enter()
      .append("rect")
          .attr("class", "boxValue bValue")
          .attr("x", function(d){return(x(d[0]))})
          .attr("y", function(d){return(y(d[1].q3))})
          .attr("height", function(d){
            return(y(d[1].q1)-y(d[1].q3));})
          .attr("width", function(){return x.bandwidth();} )
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
          .on("mouseover", (event, d) => handleMouseOver(d))
          .on("mouseleave", (event, d) => handleMouseLeave())
          .append("title")
          .text(function(d) { return "median - " + d[1].median; })
          

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
      

      svg
        .selectAll("point.pointValues")
        .data(data)
        .enter()
        .append("circle")
          .attr("class", "pointValues pValue")
          .attr("cx", (d) => x(d.types) + x.bandwidth()/2)
          .attr("cy", (d) => y(d.hp))
          .attr("r", 4)
          .attr("fill","none");

      svg
        .selectAll("outlier.outlierValues")
        .data(data)
        .enter()
        .append("circle")
          .attr("class", "outlierValues oValue")
          .attr("cx", (d) => placeOutlier(d,sumstat,x.bandwidth(),x(d.types),d.hp))//x(d.types) + x.bandwidth()/2)
          .attr("cy", (d) => y(d.hp))
          .attr("r", 3)
          .attr("fill",function(d){
            if(parseFloat(d.hp) > parseFloat(d.outlier)){
              return "currentColor";
            }
            else{
              return "none";
            }
          })
          .attr("fill-opacity", 0.2)
          .on("mouseover", (event, d) => handleMouseOver(d))
          .on("mouseleave", (event, d) => handleMouseLeave())
          .append("title")
          .text((d) => d.name);
  });
}


function handleMouseOver(item) {
  d3.selectAll(".itemValue")
    .filter(function (d, i) {
      return d.id == item.id;
    })
    .style("stroke-width", 5)
    .style("stroke", "red");
  
  d3.selectAll(".pValue")
    .filter(function (d, i) {
      return d.id == item.id;
    })
    .style("stroke-width",function(d){
      if(parseFloat(d.hp) > parseFloat(d.outlier)){
        return "none";
      }
      else{
        return 5;
      }
    })
    .style("stroke",function(d){
      if(parseFloat(d.hp) > parseFloat(d.outlier)){
        return "none";
      }
      else{
        return "red";
      }
    })
    .style("fill",function(d){
      if(parseFloat(d.hp) > parseFloat(d.outlier)){
        return "none";
      }
      else{
        return "red";
      }
    });

  d3.selectAll(".oValue")
  .filter(function (d, i) {
    return d.id == item.id;
  })
  .style("stroke-width", function(d){if(parseFloat(d.hp) > parseFloat(d.outlier)){
    return 5;
  }
  else{
    return "none";
  }})
  .style("stroke", function(d){
    if(parseFloat(d.hp) > parseFloat(d.outlier)){
      return "red";
    }
    else{
      return "none";
    }
  })
  .style("fill", function(d){
    if(parseFloat(d.hp) > parseFloat(d.outlier)){
      return "red";
    }
    else{
      return "none";
    }
  });

  d3.selectAll(".bValue")
    .filter(function (d, i) {
      return d[0] == item[0];
    })
}

function handleMouseLeave() {
  d3.selectAll(".itemValue")
    .style("stroke-width", 1)
    .style("stroke",function(){
      //console.log(this.getAttribute('d'));
      if(sMap[this.getAttribute('d')] == 1){
        return "blue";
      }
      else if(flag == 0){
        return "blue";
      }
      else{
        return "#ddd";
      }
    });

  d3.selectAll(".pValue")
    .style("stroke-width", 1)
    .style("stroke", "none")
    .style("fill", "none");
  
  d3.selectAll(".oValue")
    .style("stroke", "none")
    .style("fill", function(d){
      if(parseFloat(d.hp) > parseFloat(d.outlier)){
        return "currentColor";
      }
      else{
        return "none";
      }})
    .attr("fill-opacity", 0.2);
}