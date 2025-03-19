(() => {    
    const width = 500, height = 300, margin = { top: 40, right: 150, bottom: 50, left: 150 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data9 = sales_data.map(d => ({
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
            "Mã đơn hàng": d["Mã đơn hàng"]
        }));

        const totalOrdersByGroup = new Map();
        const itemOrdersByGroup = new Map();

        sales_data9.forEach(({ "Nhóm hàng": group, "Mặt hàng": item, "Mã đơn hàng": order }) => {
            if (!totalOrdersByGroup.has(group)) totalOrdersByGroup.set(group, new Set());
            totalOrdersByGroup.get(group).add(order);

            const key = `${group}|||${item}`;
            if (!itemOrdersByGroup.has(key)) itemOrdersByGroup.set(key, new Set());
            itemOrdersByGroup.get(key).add(order);
        });

        const probabilityData = new Map();
        itemOrdersByGroup.forEach((orders, key) => {
            const [group, item] = key.split("|||");
            if (!probabilityData.has(group)) probabilityData.set(group, []);
            probabilityData.get(group).push({
                "Mặt hàng": item,
                "Xác suất": orders.size / totalOrdersByGroup.get(group).size
            });
        });

        console.log("Dữ liệu xác suất:", probabilityData);

        const chartContainer = d3.select("#chart9").html("");

        chartContainer.style("display", "grid")
            .style("grid-template-columns", "repeat(3, 1fr)")
            .style("gap", "10px");

        probabilityData.forEach((data, group) => {

            data.sort((a, b) => b["Xác suất"] - a["Xác suất"]);

            const div = chartContainer.append("div")
                .style("display", "inline-block")
                .style("margin", "10px")
                .style("vertical-align", "top");

            div.append("h3").text(group).style("text-align", "center").style("font-size", "14px");

            const svg = div.append("svg")
                .attr("width", width)
                .attr("height", height);

            const chart = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const y = d3.scaleBand()
                .domain(data.map(d => d["Mặt hàng"]))
                .range([0, height - margin.top - margin.bottom])
                .padding(0.2);

            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d["Xác suất"])]).nice()
                .range([0, width - margin.left - margin.right]);

            chart.append("g")
                .call(d3.axisLeft(y))
                .style("font-size", "10px");

            chart.append("g")
                .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
                .call(d3.axisBottom(x).tickFormat(d3.format(".0%")).ticks(5))
                .style("font-size", "10px");

            const tooltip = d3.select("#tooltip");

            const color = d3.scaleOrdinal(d3.schemeTableau10);

            const bars = chart.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("y", d => y(d["Mặt hàng"]))
                .attr("x", 0)
                .attr("width", d => x(d["Xác suất"]))
                .attr("height", y.bandwidth())
                .attr("fill", d => color(d["Mặt hàng"]))
                .on("mouseover", function(event, d) {
                    tooltip.style("display", "block")
                        .style("opacity", 1)
                        .html(`<strong>${d["Mặt hàng"]}</strong><br>Xác suất: ${(d["Xác suất"] * 100).toFixed(1)}%`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseleave", function() {
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

            chart.selectAll(".label")
                .data(data)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", d => x(d["Xác suất"]) + 5)
                .attr("y", d => y(d["Mặt hàng"]) + y.bandwidth() / 2 + 4)
                .text(d => `${(d["Xác suất"] * 100).toFixed(1)}%`)
                .style("font-size", "10px")
                .style("text-anchor", "start");

        });

    });
})();
