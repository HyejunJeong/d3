class DataTable {
    constructor(id) {
        this.id = id;
    }

    update(data, columns) {
        let table = d3.select(this.id);

        // TODO: create as many <tr>s as rows
        let rows = table   
            .selectAll("tr")
            .data(data)
            .join("tr");
        
        // TODO: populate <td>s in each row        
        rows.selectAll("td")
            .data(d => columns.map(c => d[c]))
            .join("td")
            .text(d => d)
    }
}