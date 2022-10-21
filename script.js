const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const brushHeight = 40;
var posarr = [];
var sMap = {};
var attr = [[90,0], [200,0], [170,0], [5.0, 0]];
var flag = 0;
var overColor = "red";
var normalColor = "#22BAC1";
var deselectedColor = "#ddd";
var sumstat;

function init() {
  createBoxPlot("#vi1");
  createParallelCoordinates("#vi3");
}

function placeOutlier(data,stats,width,posX,posY){
  const outlen = stats.get(data.types).outliers.length;
  if(posarr.includes("["+ posX+","+posY+"]")){
    var auxPlace = 1;
    var auxPlace2 = -1;
    var pos = 0;
    while(auxPlace<=outlen){
      pos = posX + width/2 + auxPlace * 8;
      if(!posarr.includes("["+pos+","+posY+"]")){
        break;
      }
      pos = posX + width/2 + auxPlace2 * 8;
      if(!posarr.includes("["+pos+","+posY+"]")){
        break;
      }
      auxPlace = auxPlace +1;
      auxPlace2 = auxPlace2 -1;
    }
    if(pos != 0){
      posarr.push("["+ pos + "," + posY + "]");
      return pos;
    }
  }
  else{
    posarr.push("["+ posX + "," + posY + "]");
    return posX + width/2;
  }
}

function createParallelCoordinates(id) {
  var widthC = width + 150;
  var heightC = height + 20;
  const svg = d3
    .select(id)
    .attr("width", widthC + margin.left + margin.right)
    .attr("height", heightC + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    `translate(${margin.left},${margin.top})`);

  d3.csv("data.csv").then(function (data) {
  keys = Object.keys(data[0]).filter(function(d) { return d != "id" && d != "outlier" && d != "name" && d != "types" && d != "weaknesses" && d != "rarity" 
                                                        && d != "resistances" && d != "evolution" && d!=""})
  
  //Create a brush
  const brush = d3.brushY()
  .extent([
    [-(brushHeight/2), 0],
    [(brushHeight/2), heightC]
  ])
  .on("start brush end", brushed);

  line = d3.line()
  .defined(([, value]) => value != null)
  .y(([key, value]) => y.get(key)(value))
  .x(([key]) => x(key))

  label = d => d.name

  colors = d3.interpolateLab(normalColor, normalColor)
  
  
  y = new Map(Array.from(keys, key => [key, d3.scaleLinear().domain(d3.extent(data, d => +d[key])).range([heightC,0])]))

  x = d3.scalePoint()
    .range([0, widthC])
    .padding(0.5)
    .domain(keys);


  const path = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.4)
      .selectAll("line.lineValue")
      .data(data)
      .join("path")
        .attr("class", "lineValue itemValue")
        .attr("stroke", normalColor)
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
      if (selection === null){
        selections.delete(key);
        attr = [[90,0], [200,0], [170,0], [5.0, 0]];
        updateBoxPlot();
      }
      else selections.set(key, selection.map(y.get(key).invert));

      for (let [key1, value1] of selections) {
        if (key1 == "level"){
          attr[0] = value1
        }
        if (key1 == "hp"){
          attr[1] = value1
        }
        if (key1 == "damage"){
          attr[2] = value1
        }
        if (key1 == "energyCost"){
          attr[3] = value1
        }
      }
      updateBoxPlot();

      selarray = Array.from(selections);
      const selected = [];

      path.each(function(d) {
        const active = selarray.every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
        d3.select(this).style("stroke", function(){
          if(active){
            sMap[this.getAttribute('d')] = 1;
            return normalColor; 
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
    .attr("id", "gBoxChart")
    .attr("transform",
    `translate(${margin.left},${margin.top})`);

  d3.csv("data.csv").then(function (data) {
    // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
    var maxlen = 0
    sumstat = d3.rollup(data, function(d) {
        q1 = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.25)
        median = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.5)
        q3 = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.75)
        interQuantileRange = q3 - q1
        
        
        min = d3.min(Array.from(d.map(function(g){ return g.hp;})), s => +s);//tranform string in ints
        
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

        return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max, outliers: outliars})
      }, d => d.types)
    
    // Show the X scale
    var x = d3.scaleBand()
      .rangeRound([ 0, width ])
      .domain(["Psychic", "Water", "Colorless", "Fire", "Fighting", "Lightning", "Grass", "Metal", "Darkness"])
      .padding(0.1)
      
    svg.append("g")
      .attr("id", "gXAxis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .style("text-anchor", "middle")
      .attr("x", 495)
      .text("types")
      .style("fill", "black")

    // Show the Y scale
    var y = d3.scaleLinear()
      .domain([0, 230])
      .range([height, 0])
    svg
      .append("g")
      .attr("id", "gYAxis")
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
        .attr("y1", function(d){return(y(d[1].min))})
        .attr("y2", function(d){return(y(d[1].max))})
        .attr("stroke", "black")
        .style("width", 40)

    // rectangle for the main box
    svg
      .selectAll("boxes.boxValue")
      .data(sumstat)
      .enter()
      .append("rect")
          .attr("class", "boxValue bValue")
          .attr("x", function(d){return(x(d[0]))})
          .attr("y", function(d){return(y(d[1].q3))})
          .attr("height", function(d){return(y(d[1].q1)-y(d[1].q3));})
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
          .attr("cx", (d) => placeOutlier(d,sumstat,x.bandwidth(),x(d.types),d.hp))
          .attr("cy", (d) => y(d.hp))
          .attr("r", 3)
          .attr("fill",function(d){
            if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
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
    .style("stroke", overColor);
  
  d3.selectAll(".pValue")
    .filter(function (d, i) {
      return d.id == item.id;
    })
    .style("stroke-width",function(d){
      if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
        return "none";
      }
      else{
        return 5;
      }
    })
    .style("stroke",function(d){
      if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
        return "none";
      }
      else{
        return overColor;
      }
    })
    .style("fill",function(d){
      if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
        return "none";
      }
      else{
        return overColor;
      }
    });

  d3.selectAll(".oValue")
  .filter(function (d, i) {
    return d.id == item.id;
  })
  .style("stroke-width", function(d){if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
    return 5;
  }
  else{
    return "none";
  }})
  .style("stroke", function(d){
    if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
      return overColor;
    }
    else{
      return "none";
    }
  })
  .style("fill", function(d){
    if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
      return overColor;
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
      if(sMap[this.getAttribute('d')] == 1){
        return normalColor;
      }
      else if(flag == 0){
        return normalColor;
      }
      else{
        return deselectedColor;
      }
    });

  d3.selectAll(".pValue")
    .style("stroke-width", 1)
    .style("stroke", "none")
    .style("fill", "none");
  
  d3.selectAll(".oValue")
    .style("stroke", "none")
    .style("fill", function(d){
      if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
        return "currentColor";
      }
      else{
        return "none";
      }})
    .attr("fill-opacity", 0.2);
}


function updateBoxPlot(){
  d3.csv("data.csv").then(function (data){
    data = data.filter(function (elem) {
      return attr[0][1] <= elem.level && elem.level <= attr[0][0] && attr[1][1] <= elem.hp && elem.hp <= attr[1][0] && attr[2][1] <= elem.damage && elem.damage <= attr[2][0]
      && attr[3][1] <= elem.energyCost && elem.energyCost <= attr[3][0];
    });

    var maxlen = 0
    sumstat = d3.rollup(data, function(d) {
        q1 = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.25)
        median = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.5)
        q3 = d3.quantile(d.map(function(g) { return g.hp;}).sort(d3.ascending),.75)
        interQuantileRange = q3 - q1
        
        min = d3.min(Array.from(d.map(function(g){ return g.hp;})), s => +s);//tranform string in ints
    
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
        
        return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max, outliers: outliars})
      }, d => d.types)
    
    const svg = d3.select("#gBoxChart");
    svg.selectAll("*").remove();
    
    var x = d3.scaleBand()
      .rangeRound([ 0, width ])
      .domain(["Psychic", "Water", "Colorless", "Fire", "Fighting", "Lightning", "Grass", "Metal", "Darkness"])
      .padding(0.1)
    
    svg
      .append("g")
      .attr("id", "gXAxis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .style("text-anchor", "middle")
      .attr("x", 495)
      .text("types")
      .style("fill", "black")

    var y = d3.scaleLinear()
      .domain([0, 230])
      .range([height, 0])
    
    svg
      .append("g")
      .attr("id", "gYAxis")
      .call(d3.axisLeft(y))
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text("hp")
      .style("fill", "black")

    
    svg
      .selectAll("vertLines")
      .data(sumstat)
      .enter()
      .append("line")
        .attr("x1", function(d){return(x(d[0])+x.bandwidth()/2);})
        .attr("x2", function(d){return(x(d[0])+x.bandwidth()/2);})
        .attr("y1", function(d){return(y(d[1].min))})
        .attr("y2", function(d){return(y(d[1].max))})
        .attr("stroke", "black")
        .style("width", 40)

  // rectangle for the main box
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

    posarr = [];
    svg
      .selectAll("outlier.outlierValues")
      .data(data)
      .enter()
      .append("circle")
        .attr("class", "outlierValues oValue")
        .attr("cx", (d) => placeOutlier(d,sumstat,x.bandwidth(),x(d.types),d.hp))
        .attr("cy", (d) => y(d.hp))
        .attr("r", 3)
        .attr("fill",function(d){
          if(parseFloat(d.hp) >= parseFloat(sumstat.get(d.types)["outliers"][0])){
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