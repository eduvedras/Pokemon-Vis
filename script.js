const margin = { top: 20, right: 30, bottom: 40, left: 90 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const brushHeight = 40;
var posarr = [];
var points;
var sMap = {};
var attr = [[90,0], [200,0], [170,0], [5.0, 0]];
var flag = 0;
var overColor = "red";
var normalColor = "#22BAC1";
var deselectedColor = "#ddd";
var averageColor = "green";
var sumstat;

const searchWrapper = document.querySelector(".search-input");
const inputBox = searchWrapper.querySelector("input");
const suggBox = searchWrapper.querySelector(".autocom-box");

inputBox.onkeyup = (e)=>{
  let userData = e.target.value;
  let emptyArray = [];
  if(userData){
    emptyArray = suggestions.filter((data)=>{
        return data.toLocaleLowerCase().startsWith(userData.toLocaleLowerCase());
    });
    emptyArray = emptyArray.map((data)=>{
      return data = '<li>' + data + '</li>';
    });
    searchWrapper.classList.add("active");
    showSuggestions(emptyArray);
    let allList = suggBox.querySelectorAll("li");
    for (let i=0;i<allList.length;i++){
      allList[i].setAttribute("onclick", "select(this)");
    }
  }
  else{
    searchWrapper.classList.remove("active");
  }
  
}

function select(element){
  let selectUserData =  element.textContent;
  inputBox.value = selectUserData;
  searchWrapper.classList.remove("active");
}

function showSuggestions(list){
  let listData;
  if(!list.length){
    userValue = inputBox.value;
    listData = '<li>' + userValue + '</li>';
  }
  else{
    listData = list.join('');
  }
  suggBox.innerHTML = listData;
}


function init() {
  //createBoxPlot("#vi1");
  createParallelSets("#vi2");
  //createParallelCoordinates("#vi3");
}

function handleMouseOverAverage(){
  d3.selectAll(".aValue")
    .style("stroke-width", 5)
    .style("stroke", overColor);
}

function handleMouseLeaveAverage(){
  d3.selectAll(".aValue")
    .style("stroke-width", 1.5)
    .style("stroke", averageColor);
}

function handleMouseOver(item) {
  d3.selectAll(".itemValue")
    .filter(function (d, i) {
      if(item[1] == undefined){
        return d.id == item.id
      }
      else{
        return item[1].ids.includes(d.id);
      }
    })
    .style("stroke-width", 2)
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
    .style("fill",overColor);
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

  d3.selectAll(".bValue")
    .style("fill",normalColor);
}