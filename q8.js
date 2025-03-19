(() => {    
    const width = 1200, height = 600, margin = { top: 50, right: 200, bottom: 50, left: 150 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data_processed = sales_data.map(d => ({
            "Tháng": `Tháng ${d["Thời gian tạo đơn"].split("-")[1]}`,
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Mã đơn hàng": d["Mã đơn hàng"]
        }));

        const orderCountByGroupMonth = sales_data_processed.reduce((acc, item) => {
            const group = item["Nhóm hàng"];
            const month = item["Tháng"];
            const orderID = item["Mã đơn hàng"];

            if (!acc[month]) acc[month] = {};
            if (!acc[month][group]) acc[month][group] = new Set();
            acc[month][group].add(orderID);

            return acc;
        }, {});

        const totalOrdersByMonth = sales_data_processed.reduce((acc, item) => {
            const month = item["Tháng"];
            const orderID = item["Mã đơn hàng"];

            if (!acc[month]) acc[month] = new Set();
            acc[month].add(orderID);

            return acc;
        }, {});

        const aggregatedData = [];
        Object.keys(orderCountByGroupMonth).forEach(month => {
            Object.keys(orderCountByGroupMonth[month]).forEach(group => {
                aggregatedData.push({
                    "Tháng": month,
                    "Nhóm hàng": group,
                    "Xác suất": orderCountByGroupMonth[month][group].size / totalOrdersByMonth[month].size
                });
            });
        });

        aggregatedData.sort((a, b) => {
            const monthA = parseInt(a["Tháng"].split(" ")[1]);
            const monthB = parseInt(b["Tháng"].split(" ")[1]);
            return monthA - monthB || b["Xác suất"] - a["Xác suất"];
        });

        const uniqueGroups = [...new Set(aggregatedData.map(d => d["Nhóm hàng"]))];

        const x = d3.scalePoint()
            .domain([...new Set(aggregatedData.map(d => d["Tháng"]))])
            .range([0, width - margin.left - margin.right])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Xác suất"])])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        const svg = d3.select("#chart8")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x))
            .style("font-size", "12px");

        chart.append("g")
            .call(d3.axisLeft(y)
                .ticks(6)
                .tickFormat(d3.format(".0%")) 
            )
            .style("font-size", "12px");

        const line = d3.line()
            .x(d => x(d["Tháng"]))
            .y(d => y(d["Xác suất"]));

        uniqueGroups.forEach(group => {
            const groupData = aggregatedData.filter(d => d["Nhóm hàng"] === group);

            chart.append("path")
                .datum(groupData)
                .attr("fill", "none")
                .attr("stroke", color(group))
                .attr("stroke-width", 2)
                .attr("d", line);
        });

        chart.selectAll(".dot")
            .data(aggregatedData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d["Tháng"]))
            .attr("cy", d => y(d["Xác suất"]))
            .attr("r", 4)
            .attr("fill", d => color(d["Nhóm hàng"]));

        const tooltip = d3.select("#tooltip");

        chart.selectAll(".dot")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .style("opacity", 1)
                    .html(`
                        <strong>Tháng:</strong> ${d["Tháng"]} <br>
                        <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]} <br>
                        <strong>Xác suất bán:</strong> ${(d["Xác suất"] * 100).toFixed(1)}%
                    `);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("click", function(event, d) {
                const dots = d3.select(this.parentNode).selectAll(".dot"); 
                const isSelected = d3.select(this).classed("selected"); 
            
                if (isSelected) {
                    dots.attr("opacity", 1).classed("selected", false);
                } else {
                    dots.attr("opacity", 0.3).classed("selected", false);
                    d3.select(this).attr("opacity", 1).classed("selected", true);
                }
            });            

        const legend = svg.append("g")
            .attr("transform", `translate(${width - margin.right + 20}, 50)`);

        legend.selectAll(".legend-item")
            .data(uniqueGroups)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .each(function(d) {
                d3.select(this).append("rect")
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("fill", color(d));

                d3.select(this).append("text")
                    .attr("x", 20)
                    .attr("y", 12)
                    .text(d)
                    .style("font-size", "12px")
                    .attr("alignment-baseline", "middle");
            });

    });
})();
