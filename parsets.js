function createParallelSets(id) {
  /*const svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    `translate(${margin.left},${margin.top})`);*/

  var chart = d3.parsets()
  .dimensions(["evolution","rarity","resistances","types","weaknesses"]);
  
  var vis = d3.select(id)
      .attr("width", chart.width())
      .attr("height", chart.height())
      .append("svg");
  
  d3.csv("data.csv", function(error, csv) {
    vis.datum(csv).call(chart);
  });
}