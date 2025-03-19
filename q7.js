(() => {    
    const width = 1200, height = 600, margin = { top: 20, right: 200, bottom: 40, left: 200 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data_processed = sales_data.map(d => ({
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Mã đơn hàng": d["Mã đơn hàng"]
        }));

        const orderCountByGroup = sales_data_processed.reduce((acc, item) => {
            const group = item["Nhóm hàng"];
            const orderID = item["Mã đơn hàng"];

            if (!acc[group]) acc[group] = new Set();
            acc[group].add(orderID);

            return acc;
        }, {});

        const totalOrders = new Set(sales_data.map(d => d["Mã đơn hàng"])).size;

        const aggregatedData = Object.entries(orderCountByGroup).map(([group, orders]) => ({
            "Nhóm hàng": group,
            "Xác suất bán": orders.size / totalOrders
        }));

        aggregatedData.sort((a, b) => b["Xác suất bán"] - a["Xác suất bán"]);

        const x = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Xác suất bán"])])
            .range([0, width - margin.left - margin.right]);

        const y = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Nhóm hàng"]))
            .range([0, height - margin.top - margin.bottom])
            .padding(0.2);

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        const svg = d3.select("#chart7")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x)
                .ticks(6)
                .tickFormat(d3.format(".0%")) 
            )
            .style("font-size", "12px");

        chart.append("g")
            .call(d3.axisLeft(y))
            .style("font-size", "12px");

        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d["Nhóm hàng"]))
            .attr("width", d => x(d["Xác suất bán"]))
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d["Nhóm hàng"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Xác suất bán"]) + 10)
            .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${(d["Xác suất bán"] * 100).toFixed(1)}%`)
            .style("font-size", "12px")
            .style("fill", "#333");

        const tooltip = d3.select("#tooltip");

        const bars = chart.selectAll(".bar")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .style("opacity", 1)
                    .html(`
                        <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]} <br>
                        <strong>Xác suất bán:</strong> ${(d["Xác suất bán"] * 100).toFixed(1)}%
                    `);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("click", function (event, d) {
                if (d3.select(this).attr("opacity") !== "0.3") {
                    bars.attr("opacity", 0.3); 
                    d3.select(this).attr("opacity", 1); 
                } else {
                    bars.attr("opacity", 1); 
                }
            });

    });
})();
