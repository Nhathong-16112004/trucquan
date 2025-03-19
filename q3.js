(() => {    
    const width = 1200, height = 600, margin = { top: 20, right: 150, bottom: 40, left: 150 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data3 = sales_data.map(d => ({
            "Tháng": `Tháng ${d["Thời gian tạo đơn"].split("-")[1]}`, 
            "Thành tiền": +d["Thành tiền"] || 0,
            "SL" : +d["SL"] || 0
        }));

        const aggregatedData = sales_data3.reduce((acc, item) => {
            const existingItem = acc.find(d => d["Tháng"] === item["Tháng"]);
            if (existingItem) {
                existingItem["Thành tiền"] += item["Thành tiền"];
                existingItem["SL"] += item["SL"];
            } else {
                acc.push({
                    "Tháng": item["Tháng"],
                    "Thành tiền": item["Thành tiền"],
                    "SL" : item["SL"]
                });
            }
            return acc;
        }, []);

        aggregatedData.sort((a, b) => {
            return parseInt(a["Tháng"].split(" ")[1]) - parseInt(b["Tháng"].split(" ")[1]);
        });

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Tháng"]))
            .range([0, width - margin.left - margin.right])
            .padding(0.1);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Thành tiền"])])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

        const yAxis = d3.axisLeft(y)
            .ticks(8) 
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`); 

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        const svg = d3.select("#chart3")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x));

        chart.append("g")
            .call(yAxis);

        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Tháng"]))
            .attr("y", d => y(d["Thành tiền"]))
            .attr("width", x.bandwidth()) 
            .attr("height", d => height - margin.top - margin.bottom - y(d["Thành tiền"]))
            .attr("fill", d => color(d["Tháng"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Tháng"]) + x.bandwidth() / 2)
            .attr("y", d => y(d["Thành tiền"]) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`)
            .style("font-size", "12px")
            .style("fill", "#333");

        const tooltip = d3.select("#tooltip"); 

        const bars = chart.selectAll(".bar")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .style("opacity", 1)
                    .html(`
                        ${d["Tháng"]} <br>
                        <strong>Doanh số bán:</strong> ${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ <br>
                        <strong>Số lượng bán:</strong> ${d["SL"].toLocaleString()} SKUs
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
