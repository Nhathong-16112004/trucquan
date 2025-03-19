(() => {  
    const width = 1000, height = 400, margin = { top: 40, right: 100, bottom: 50, left: 100 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        const customerOrders = new Map();

        sales_data.forEach(d => {
            const customerID = d["Mã khách hàng"];
            const orderID = d["Mã đơn hàng"];
            if (!customerOrders.has(customerID)) customerOrders.set(customerID, new Set());
            customerOrders.get(customerID).add(orderID);
        });

        const purchaseCounts = Array.from(customerOrders.values()).map(orderSet => orderSet.size);

        const purchaseDistribution = new Map();

        purchaseCounts.forEach(count => {
            purchaseDistribution.set(count, (purchaseDistribution.get(count) || 0) + 1);
        });

        const chartData = Array.from(purchaseDistribution.entries())
            .map(([numPurchases, numCustomers]) => ({ "Số lượt mua": +numPurchases, "Số khách hàng": +numCustomers }))
            .sort((a, b) => a["Số lượt mua"] - b["Số lượt mua"]);
        const svg = d3.select("#chart11")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(chartData.map(d => d["Số lượt mua"]))
            .range([0, width - margin.left - margin.right])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d["Số khách hàng"])]).nice()
            .range([height - margin.top - margin.bottom, 0]);

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .style("font-size", "12px");

        chart.append("g")
            .call(d3.axisLeft(y).ticks(y.domain()[1] / 1000).tickFormat(d => d3.format(".0s")(d)))
            .style("font-size", "12px");

        const tooltip = d3.select("#tooltip");

        const bars = chart.selectAll(".bar")
            .data(chartData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Số lượt mua"]))
            .attr("y", d => y(d["Số khách hàng"]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.top - margin.bottom - y(d["Số khách hàng"]))
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .style("opacity", 1)
                    .html(`Số lượt mua: ${d["Số lượt mua"]}<br>Số khách hàng: ${d["Số khách hàng"]}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("click", function (event, d) {
                if (d3.select(this).attr("opacity") !== "0.3") {
                    bars.attr("opacity", 0.3);
                    d3.select(this).attr("opacity", 1); 
                } else {
                    bars.attr("opacity", 1); 
                }
            });

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Số lượt mua");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Số khách hàng");

    });
})();
