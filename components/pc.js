class PC {
    
    margin = {
        top: 50, right: 50, bottom: 10, left: 50
    }

    constructor(svg, data, dimensions, width=1000, height=700) {
        this.svg = svg;
        this.data = data;
        this.dimensions = dimensions;
        this.width = width;
        this.height = height;
    }

    initialize() {

        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");

        this.xScale = d3.scalePoint()
            .range([0, this.width])
            .domain(this.dimensions);

        this.yScales = {};
        this.dimensions.forEach(dim => {
            this.yScales[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => d[dim]))
                .range([this.height, 0])
        });
        this.zScale = d3.scaleOrdinal()
                        .domain([0,1,2,3,4])
                        .range(["#1f77b4","#2ca02c", "#bcbd22", "#ff7f0e", "#d62728"])

        this.axes = this.container.append("g");
        this.titles = this.container.append("g");
        this.lines = this.container.append("g");
        this.legend = this.container.append("g");

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        
        this.legend
            .style("display", "inline")
            .style("font-size", ".8em")
            .attr("transform", `translate(${this.width + 10} , ${(this.height - 70) / 2})`)
            .call(d3.legendColor().scale(this.zScale))

        this.container.selectAll("axis")
            .data(this.dimensions).enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", dim => `translate(${this.xScale(dim)}, 0)`)
            .each((dim, i, nodes) => {
                d3.select(nodes[i]).call(d3.axisLeft(this.yScales[dim]))
            })
            .append("text")
                .text(dim => dim)
                .attr("text-anchor", "middle")
                .attr("font-size", "1rem")
                .attr("dy", "-.8rem")
                .style("fill", "black")
        
        let polyline = (d) => {
            return d3.line()(this.dimensions.map(dim => [this.xScale(dim), this.yScales[dim](d[dim])]));
        }

        this.lines.selectAll("path")
            .data(this.data)
            .join("path")
            .attr("class", d => {return "line" + d["stress"]})
            .attr("d", polyline)
            .style("fill", "none")
            .style("stroke", d => this.zScale(d["stress"]))
            .style("opacity", "0.1")
        
            .on("mouseover", (i, d) => {
                let selected = d.stress
            
                this.lines.selectAll("path")
                    .style("stroke", "lightgrey")
                    .style("opacity", "0.1")
                this.lines.selectAll("path.line" + selected)
                    .style("stroke", d => this.zScale(selected))
                    .style("opacity", "0.7")
            })
        
            .on("mouseout", (i, d) => {
                this.lines.selectAll("path")
                    .style("stroke", d => this.zScale(d["stress"]))
                    .style("opacity", "0.1")
            })
    }
}
