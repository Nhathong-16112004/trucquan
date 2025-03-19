(() => {    
    const width = 1200, height = 600, margin = { top: 20, right: 150, bottom: 40, left: 150 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        console.log("Dữ liệu đã load:", sales_data);

        const sales_data5 = sales_data.map(d => {
            const date = new Date(d["Thời gian tạo đơn"]); 
            const dayOfMonth = date.getDate(); 
            return {
                "Ngày trong tháng": `Ngày ${dayOfMonth}`,
                "Ngày tạo đơn": date.toISOString().split("T")[0], 
                "Thành tiền": +d["Thành tiền"] || 0,
                "SL": +d["SL"] || 0
            };
        });

        const aggregatedData = sales_data5.reduce((acc, item) => {
            let existingItem = acc.find(d => d["Ngày trong tháng"] === item["Ngày trong tháng"]);
            if (existingItem) {
                existingItem["Tổng doanh thu"] += item["Thành tiền"];
                existingItem["Tổng số lượng"] += item["SL"];
                existingItem["Danh sách ngày"].add(item["Ngày tạo đơn"]);
            } else {
                acc.push({
                    "Ngày trong tháng": item["Ngày trong tháng"],
                    "Tổng doanh thu": item["Thành tiền"],
                    "Tổng số lượng": item["SL"],
                    "Danh sách ngày": new Set([item["Ngày tạo đơn"]]) 
                });
            }
            return acc;
        }, []);

        aggregatedData.forEach(d => {
            d["Số ngày"] = d["Danh sách ngày"].size;
            d["Doanh thu trung bình"] = d["Tổng doanh thu"] / d["Số ngày"];
            d["Số lượng trung bình"] = d["Tổng số lượng"] / d["Số ngày"];
        });

        aggregatedData.sort((a, b) => {
            return parseInt(a["Ngày trong tháng"].split(" ")[1]) - parseInt(b["Ngày trong tháng"].split(" ")[1]);
        });

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Ngày trong tháng"]))
            .range([0, width - margin.left - margin.right])
            .padding(0.1);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Doanh thu trung bình"])]).nice()
            .range([height - margin.top - margin.bottom, 0]);

        const yAxis = d3.axisLeft(y)
            .ticks(8)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`);

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        const svg = d3.select("#chart5")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        chart.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x)) 
            .style("font-size", "10px") 
            .selectAll("text") 
            .style("text-anchor", "end") 
            .attr("dx", "-0.5em") 
            .attr("dy", "0.5em") 
            .attr("transform", "rotate(-45)"); 

        chart.append("g").call(yAxis);

        chart.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Ngày trong tháng"]))
            .attr("y", d => y(d["Doanh thu trung bình"]))
            .attr("width", x.bandwidth()) 
            .attr("height", d => height - margin.top - margin.bottom - y(d["Doanh thu trung bình"]))
            .attr("fill", d => color(d["Ngày trong tháng"]));

        chart.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Ngày trong tháng"]) + x.bandwidth() / 2)
            .attr("y", d => y(d["Doanh thu trung bình"]) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${(d["Doanh thu trung bình"] / 1_000_000).toFixed(1)}tr`)
            .style("font-size", "12px")
            .style("fill", "#333");

        const tooltip = d3.select("#tooltip");

        const bars = chart.selectAll(".bar")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .style("opacity", 1)
                    .html(`
                        <strong>${d["Ngày trong tháng"]}</strong> <br>
                        <strong>Doanh thu trung bình:</strong> ${(d["Doanh thu trung bình"] / 1_000_000).toFixed(1)} triệu VNĐ <br>
                        <strong>Số lượng trung bình:</strong> ${d["Số lượng trung bình"].toFixed(0)} SKUs
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
