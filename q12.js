(() => {    
    const width = 1000, height = 500, margin = { top: 50, right: 100, bottom: 50, left: 100 };

    document.addEventListener("DOMContentLoaded", () => {
        if (!Array.isArray(sales_data) || sales_data.length === 0) return console.error("Dữ liệu trống!");

        const sales_data12 = sales_data.map(d => ({
            "Mã khách hàng": d["Mã khách hàng"],
            "Thành tiền": parseFloat(d["Thành tiền"]) || 0
        }));

        const customerSpending = Array.from(
            d3.rollup(sales_data12,
                v => d3.sum(v, d => d["Thành tiền"]), 
                d => d["Mã khách hàng"]
            ),
            ([key, value]) => ({ "Mã khách hàng": key, "Chi tiêu KH": value })
        );

        const binSize = 50000;
        const binnedData = Array.from(
            d3.rollup(customerSpending,
                v => v.length, 
                d => Math.floor(d["Chi tiêu KH"] / binSize) * binSize
            ),
            ([key, value]) => ({
                "Khoảng chi tiêu": `Từ ${key} đến ${key + binSize}`,
                "Số lượng KH": value,
                "Chi tiêu KH": key 
            })
        );

        binnedData.sort((a, b) => a["Chi tiêu KH"] - b["Chi tiêu KH"]);

        const svg = d3.select("#chart12")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const tooltip = d3.select("#tooltip"); 

        const x = d3.scaleBand()
            .domain(binnedData.map(d => `${d["Chi tiêu KH"] / 1000}K`)) 
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, 1600])
            .range([height, 0]);

        const bars = chart.selectAll(".bar")
            .data(binnedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(`${d["Chi tiêu KH"] / 1000}K`))
            .attr("y", d => y(d["Số lượng KH"]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d["Số lượng KH"]))
            .attr("fill", "steelblue") 
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block") 
                    .style("opacity", 1)
                    .html(`
                        <p><strong>Đã chi tiêu ${d["Khoảng chi tiêu"]}</strong></p>
                        <p><strong>Số lượng KH:</strong> ${d["Số lượng KH"].toLocaleString()}</p>
                    `);
            })
            .on("mousemove", function (event) {
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

        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px")
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-90)")
            .text((d, i) => (i % 2 === 0 ? `${binnedData[i]["Chi tiêu KH"] / 1000 + 50}K` : ""));
            
        chart.append("g")
            .call(d3.axisLeft(y).ticks(16)) 
            .style("font-size", "11px");
    });
})();
