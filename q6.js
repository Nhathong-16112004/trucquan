(() => {    
    const width = 1200, height = 600, margin = { top: 20, right: 100, bottom: 80, left: 150 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data6 = sales_data.map(d => {
            const hour = parseInt(d["Thời gian tạo đơn"].split(" ")[1].split(":")[0]);
            return {
                "Khung giờ": (hour >= 8 && hour < 24) ? `${hour.toString().padStart(2, "0")}:00-${hour.toString().padStart(2, "0")}:59` : "Ngoài giờ",
                "Thành tiền": +d["Thành tiền"] || 0,
                "SL": +d["SL"] || 0,
                "Ngày tạo đơn": d["Thời gian tạo đơn"].split(" ")[0] 
            };
        });

        const aggregatedData = sales_data6.reduce((acc, item) => {
            const existingItem = acc.find(d => d["Khung giờ"] === item["Khung giờ"]);
            if (existingItem) {
                existingItem["Thành tiền"] += item["Thành tiền"];
                existingItem["SL"] += item["SL"];
                existingItem["Số ngày"].add(item["Ngày tạo đơn"]);
            } else {
                acc.push({
                    "Khung giờ": item["Khung giờ"],
                    "Thành tiền": item["Thành tiền"],
                    "SL": item["SL"],
                    "Số ngày": new Set([item["Ngày tạo đơn"]])
                });
            }
            return acc;
        }, []);

        aggregatedData.forEach(d => {
            d["Số ngày"] = d["Số ngày"].size;
            d["Doanh số TB"] = d["Thành tiền"] / d["Số ngày"];
            d["SL TB"] = d["SL"] / d["Số ngày"];
        });

        const timeOrder = [...Array(16)].map((_, i) => `${(i + 8).toString().padStart(2, "0")}:00-${(i + 8).toString().padStart(2, "0")}:59`);
        aggregatedData.sort((a, b) => timeOrder.indexOf(a["Khung giờ"]) - timeOrder.indexOf(b["Khung giờ"]));

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Khung giờ"]))
            .range([0, width - margin.left - margin.right])
            .padding(0.1);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Doanh số TB"])])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

        const yAxis = d3.axisLeft(y)
            .ticks(6)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`); 

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        const svg = d3.select("#chart6")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end");

        chart.append("g")
            .call(yAxis);

        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Khung giờ"]))
            .attr("y", d => y(d["Doanh số TB"]))
            .attr("width", x.bandwidth()) 
            .attr("height", d => height - margin.top - margin.bottom - y(d["Doanh số TB"]))
            .attr("fill", d => color(d["Khung giờ"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Khung giờ"]) + x.bandwidth() / 2)
            .attr("y", d => y(d["Doanh số TB"]) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${(d["Doanh số TB"]).toFixed(0)} VNĐ`)
            .style("font-size", "12px")
            .style("fill", "#333");

        const tooltip = d3.select("#tooltip");

        const bars = chart.selectAll(".bar")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .style("opacity", 1)
                    .html(`
                        <strong>Khung giờ:</strong> ${d["Khung giờ"]} <br>
                        <strong>Doanh số TB:</strong> ${(d["Doanh số TB"]).toFixed(0)} VNĐ <br>
                        <strong>Số lượng TB:</strong> ${d["SL TB"].toFixed(0)} SKUs
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
