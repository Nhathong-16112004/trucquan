(() => {    
    const width = 1200, height = 600, margin = { top: 20, right: 250, bottom: 40, left: 350 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data2 = sales_data.map(d => ({
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
            "Thành tiền": +d["Thành tiền"] || 0,
            "SL": +d["SL"] || 0
        }));

        const aggregatedData = sales_data2.reduce((acc, item) => {
            const existingItem = acc.find(d => d["Nhóm hàng"] === item["Nhóm hàng"]);
            if (existingItem) {
                existingItem["Thành tiền"] += item["Thành tiền"];
                existingItem["SL"] += item["SL"];
            } else {
                acc.push({
                    "Mặt hàng": item["Mặt hàng"],
                    "Nhóm hàng": item["Nhóm hàng"],
                    "Thành tiền": item["Thành tiền"],
                    "SL" : item["SL"]
                });
            }
            return acc;
        }, []);

        aggregatedData.sort((a, b) => b["Thành tiền"] - a["Thành tiền"]);

        const uniqueGroups = [...new Set(sales_data2.map(d => d["Nhóm hàng"]))];
        const color = d3.scaleOrdinal().domain(uniqueGroups).range(d3.schemeTableau10);

        const svg = d3.select("#chart2")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Thành tiền"])])
            .range([0, width - margin.left - margin.right]);

        const y = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Nhóm hàng"]))
            .range([0, height - margin.top - margin.bottom])
            .padding(0.2);

        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d["Nhóm hàng"]))
            .attr("width", d => x(d["Thành tiền"]))
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d["Nhóm hàng"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Thành tiền"]) + 10) 
            .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`)
            .style("font-size", "12px")
            .style("fill", "#333");

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.format(".2s"))
                .ticks(5)
            )
            .style("font-size", "12px");

        chart.append("g")
            .call(d3.axisLeft(y))
            .style("font-size", "12px") 
            .style("text-anchor", "end"); 

        const tooltip = d3.select("#tooltip"); 

        const bars = chart.selectAll(".bar")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                .style("opacity", 1)
                .html(`
                    <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]} <br>
                    <strong>Doanh số bán:</strong> ${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VND <br>
                    <strong>Số lượng bán:</strong> ${d["SL"].toLocaleString()} SKUs <br>
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