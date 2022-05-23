class ScatterplotMatrix {
 
    margin = {
        top: 50, right: 50, bottom: 10, left: 10
    }

    constructor(svg, data, dimensions, width=1000, height=width) {
        this.svg = svg;
        this.data = data;
        this.dimensions = dimensions;
        this.width = width;
        this.height = height;
    }

    initialize() {
        this.sizeWhole = this.width - this.margin.left - this.margin.right
        this.numDim = this.dimensions.length;
        this.size = this.width / this.numDim;
        this.padding = 20

        this.color = d3.scaleOrdinal()
                        .domain([0,1,2,3,4])
                        .range(["#1f77b4","#2ca02c", "#bcbd22", "#ff7f0e", "#d62728"])

        this.position = d3.scalePoint()
                        .domain(this.dimensions)
                        .range([0, this.sizeWhole - this.size])
        
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.legend = this.container.append("g");

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    
        this.legend
            .style("display", "inline")
            .style("font-size", ".8em")
            .attr("transform", `translate(${this.width}, ${this.height / 2})`)
            .call(d3.legendColor().scale(this.color))
        
        
        for (let i in this.dimensions){
            for (let j in this.dimensions){
                
                // Get current variable name
                var xVar = this.dimensions[i]
                var yVar = this.dimensions[j]

                // If xVar == yVar: diagonal, add variable name
                if (xVar === yVar) { 
                    this.container
                        .append('g')
                        .attr("transform", `translate(${this.position(xVar)},${this.position(yVar)})`)
                        .append("text")
                        .attr("x", this.size/2)
                        .attr("y", this.size/2)
                        .text(xVar)
                        .attr("text-anchor", "middle")
                        .attr("font-size", ".9rem")

                    continue; 
                }

                // Add X Scale of each graph
                this.xScales = d3.scaleLinear()
                        .domain(d3.extent(data, d => d[xVar]))
                        .range([0, this.size - 2*this.padding]);

                // Add Y Scale of each graph
                this.yScales = d3.scaleLinear()
                        .domain(d3.extent(data, d => d[yVar]))
                        .range([this.size - 2*this.padding, 0]);

                // Add a 'g' at the right position
                this.cell = this.container
                    .append('g')
                    .attr("transform", `translate(${this.position(xVar)+this.padding},${this.position(yVar)+this.padding})`);

                // Add X and Y axis in cell
                this.cell
                    .append("g")
                    .attr("transform", `translate(0,${this.size - this.padding*2})`)
                    .call(d3.axisBottom(this.xScales).ticks(3));
                this.cell
                    .append("g")
                    .call(d3.axisLeft(this.yScales).ticks(3));

                // Add circle
                this.cell.selectAll("circle")
                        .data(data)
                        .join("circle")
                        .attr("cx", d => this.xScales(d[xVar]))
                        .attr("cy", d => this.yScales(d[yVar]))
                        .attr("r", 3)
                        .attr("opacity", "0.7")
                        .attr("fill", d => this.color(d["stress"]))
            }
        }
    }
}

