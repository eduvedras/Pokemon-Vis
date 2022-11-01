function createParallelSets(id) {
  var chart = d3.parsets()
  .dimensions(["evolution","rarity","resistances","types","weaknesses"]);
  
  var vis = d3.select(id)
      .attr("width", chart.width())
      .attr("height", chart.height())
      .append("svg");
  
  d3.csv("data.csv").then(function(data) {
    vis.datum(data).call(chart);
  });
}