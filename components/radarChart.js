class RadarChart {
    
    margin = {
        top: 150, right: 100, bottom: 100, left: 100
    }

    constructor(svg, tooltip, data, dimensions, width=600, height=width) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.data = data;
        this.dimensions = dimensions;
        this.width = width;
        this.height = height;
    }
    
    initialize() {
        
        // a function for averaging each column
        const average = (col) => col.reduce((a, b) => a + b, 0) / col.length;

        let levels = [0,1,2,3,4]
        
        // for each stress level
            // store the average for each column in avg_arr
                // store as 2d array
                // 0: {snore_rate: xx, resp_rate: xx, ..., heart_rate: xx}
                // 1: {snore_rate: xx, resp_rate: xx, ..., heart_rate: xx}
                // ...
                // 4: {snore_rate: xx, resp_rate: xx, ..., heart_rate: xx}
        let avg_arr = []
        
        for(let i in levels) {
            avg_arr[i] = {};
            this.dimensions.forEach(dim => {
                let col = data.filter(d => d["stress"] == i).map(d => d[dim])
                avg_arr[i][dim] = average(col)
                avg_arr[i]["stress"] = i
            })
        }

        var scalesAndAxes = {};
        
        this.dimensions.forEach(field => {
            var o = {};
            o.scale = d3.scaleLinear().domain([0, 100]);
            o.axis = d3.axisBottom(o.scale)
                .tickFormat(function(d, i){ if(i != 0){return d + "";} else {return "";}  });

            scalesAndAxes[field] = o;
        });
        
        this.color = d3.scaleOrdinal()
                .domain([0,1,2,3,4])
                .range(["#1f77b4","#2ca02c", "#bcbd22", "#ff7f0e", "#d62728"])

//        let autos = scalesAndAxes;
        let autos = autoScalesAxes(avg_arr);
        let scales = this.dimensions.map(d => { return autos[d].scale; });
        let axes = this.dimensions.map(d => { return autos[d].axis; });
        
        // data to array of arrays
        data = avg_arr.map(row => {
            var newRow = this.dimensions.map(key => {
                return {"axis": key, "value": row[key], "stress": row["stress"]};
            });
            return newRow;
        });
        
        var total = this.dimensions.length,
            radius = Math.min(this.width/2, this.height/2),
            angleSlice = Math.PI * 2 / total;

        // update ranges of scales to match radiuss
        scales = scales.map(i => {
            if(typeof i.rangePoints != 'undefined') {
                return i.rangePoints([0, radius]);
            } else {
                return i.range([0, radius]);
            }
        });

        ////////////////////////////////
        // create container svg and g //
        ////////////////////////////////

        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append("g");

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        //Append a g element
        var radar = this.svg.append("g")
            .attr("transform", `translate(${this.width/2 + this.margin.left}, ${this.height/2 + this.margin.top})`);
        

        ///////////////////
        // draw the axes //
        ///////////////////
        
        // wrapper for the grid & axes
        var axisGrid = radar.append("g").attr("class", "axisWrapper");
        
        // create the straight lines radiating outward from the center
        var axis = axisGrid.selectAll(".axis")
            .data(this.dimensions)
            .enter()
            .append("g")
            .attr("class", "axis");

        /////////////////////////////// APPROACH 2 ///////////////////////////////
        
        // append the lines
        axis.append("g")
            .attr("transform", (d, i) => {
                return "rotate(" + (180 / Math.PI * (i * angleSlice) + 270) + ")"; 
            })
            .each(function(dim, i, nodes) {
                d3.select(nodes[i]).call(axes[i])
            })
        
        // append axis category labels
        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "1rem")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d, i) => (radius * 1.1) * Math.cos(angleSlice * i - Math.PI/2))
            .attr("y", (d, i) => (radius * 1.1) * Math.sin(angleSlice * i - Math.PI/2))
            .text(d => d)
        
        ////////////////////////////////
        // draw the radar chart blobs //
        ////////////////////////////////
        
        // the radial line function
        var radarLine = d3.radialLine()
                .curve(d3.curveLinearClosed)
                .radius((d, i) => { return scales[i](d.value); })
                .angle((d, i) => { return i*angleSlice; });
        
        radarLine.curve(d3.curveCardinalClosed)

        // define the div for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("fill", (d, i) => { return this.color(i); })
            .style("opacity", 0);
        
        
        // create a wrapper for the blobs
        var blobWrapper = radar.selectAll(".radarWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarWrapper");
        
        // append the backgrounds
        blobWrapper.append("path")
            .attr("class", "radarArea")
            .attr("d", (d, i) => {return radarLine(d); })
            .style("fill", (d, i) => { return this.color(i); })
            .style("fill-opacity", 0.35)
            .on("mouseover", function(e, d) {
                // dim all the blocks
                d3.selectAll(".radarArea")
                    .style("fill-opacity", 0.1);
                // bring back the hovered blob
                d3.select(this)
                    .style("fill-opacity", 0.7);
                // display tooltip popper
                div.transition().duration(200)
                    .style("opacity", .9)
                div.html(  `<b>Stress Level: ${d[0].stress}</b><br/><br/>
                            ${d[0].axis}: ${parseFloat(d[0].value).toFixed(2)}<br />
                            ${d[1].axis}: ${parseFloat(d[1].value).toFixed(2)}<br />
                            ${d[2].axis}: ${parseFloat(d[2].value).toFixed(2)}<br />
                            ${d[3].axis}: ${parseFloat(d[3].value).toFixed(2)}<br />
                            ${d[4].axis}: ${parseFloat(d[4].value).toFixed(2)}<br />
                            ${d[5].axis}: ${parseFloat(d[5].value).toFixed(2)}<br />
                            ${d[6].axis}: ${parseFloat(d[6].value).toFixed(2)}<br />
                            ${d[7].axis}: ${parseFloat(d[7].value).toFixed(2)}<br />`)
                    .style("left", (e.pageX) + "px")		
                    .style("top", (e.pageY - 28) + "px");	
            })
            .on("mouseout", () => {
                // bring back all the blobs
                d3.selectAll(".radarArea")
                    .style("fill-opacity", 0.35);
                // tooltip popper disappears
                div.transition().duration(500)
                    .style("opacity", 0);
            })
        
        // create the outlines
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", (d,i) => { return radarLine(d); })
            .style("stroke-width", 0.7 + "px")
            .style("stroke", (d,i) => { return this.color(i); })
            .style("fill", "none");

        //Append the circles
        blobWrapper.selectAll(".radarCircle")
            .data((d,i) => { return d; })
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", 4)
            .attr("cx", (d,i) => { return scales[i](d.value) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("cy", (d,i) => { return scales[i](d.value) * Math.sin(angleSlice*i - Math.PI/2); })
            .style("fill", (d,i,j) => { return this.color(j); })
            .style("fill-opacity", 0.8);
    }
}

function autoScalesAxes(data) {
    let ret = {};
    let fieldNames = Object.keys(data[0]);

    fieldNames.map(i => {
        // get all data for axis
        let axisData = data.map(row => {
            return row[i];
        });

        let scale;
        let axis;
        
        let extent = d3.extent(data, a => {return a[i]; });
        
        scale = d3.scaleLinear().domain(extent);
        
        axis = d3.axisBottom(scale)
                .tickFormat((d, i) => { if(i != 0){return d + "";} else {return "";}  });
        ret[i] = {};
        ret[i].scale = scale;
        ret[i].axis = axis;
    });
    return ret;
}



