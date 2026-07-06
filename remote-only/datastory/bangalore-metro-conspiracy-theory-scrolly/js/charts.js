/* charts.js — D3 v7 chart functions for all 9 sections */
const Charts = (function() {
  const tooltip = d3.select("#chart-tooltip");
  let currentSvg = null;

  function clear() {
    const wrapper = document.getElementById("chart-svg-wrapper");
    d3.select(wrapper).selectAll("*").remove();
    tooltip.classed("visible", false);
    wrapper.setAttribute("role", "img");
    wrapper.setAttribute("aria-label", "Data visualization chart");
  }

  function getDims() {
    const w = document.getElementById("chart-svg-wrapper").clientWidth || 600;
    return { w: Math.max(w, 300), h: 380, m: { t: 30, r: 30, b: 50, l: 60 } };
  }

  function showTip(html, event) {
    tooltip.html(html).classed("visible", true);
    if (event) {
      const r = document.getElementById("chart-container").getBoundingClientRect();
      tooltip.style("left", (event.clientX - r.left + 10) + "px")
             .style("top", (event.clientY - r.top - 30) + "px");
    }
  }
  function hideTip() { tooltip.classed("visible", false); }

  const fmtK = d => d >= 1000 ? d3.format(",")(d) : d;
  const fmtKShort = d => d >= 1000 ? (d/1000).toFixed(0) + "K" : d;

  // ── S1: Earliest vs Latest payment breakdown ──────────────────────
  function s1Intro() {
    clear();
    const wrapper = document.getElementById("chart-svg-wrapper");
    const {w,h} = getDims();
    const img = document.createElement("img");
    img.src = "images/nammametro_datapage.png";
    img.alt = "Screenshot of the BMRCL ridership data page at english.bmrc.co.in/ridership showing daily ridership broken down by payment methods";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "8px";
    img.style.border = "1px solid var(--token-border, #ddd)";
    img.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
    wrapper.appendChild(img);
  }

  function s1Record(record, label) {
    clear();
    const {w,h,m} = getDims();
    const keys = ["totalSmartCards","totalNCMC","totalTokens","totalQR","groupTicket","oneDayPass","threeDayPass","fiveDayPass"];
    const labels = ["Smart Cards","NCMC","Tokens","QR","Group Ticket","1-Day Pass","3-Day Pass","5-Day Pass"];
    const data = keys.map((k,i) => ({key:k, label:labels[i], value:record[k]})).sort((a,b)=>b.value-a.value);
    const iw = w-m.l-m.r, ih = h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    const x = d3.scaleLinear().domain([0, d3.max(data, d=>d.value)*1.1]).range([0, iw]);
    const y = d3.scaleBand().domain(data.map(d=>d.label)).range([0, ih]).padding(0.3);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text(label+" — "+record.date||record.date);
    g.selectAll(".axis-y").data([0]).enter().append("g").attr("class","axis").call(d3.axisLeft(y));
    g.selectAll(".axis-x").data([0]).enter().append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).tickFormat(fmtKShort));
    const bars = g.selectAll(".bar").data(data).enter().append("rect").attr("class","bar")
      .attr("y",d=>y(d.label)).attr("height",y.bandwidth()).attr("x",0)
      .attr("fill", (d,i) => ["#8b2183","#00afff","#ff6600","#ffcb1c","#ff66dd","#33ff33","#9966ff","#ff3333"][i])
      .attr("width",0);
    bars.transition().duration(800).delay((d,i)=>i*60).attr("width", d=>x(d.value));
    g.selectAll(".bar-label").data(data).enter().append("text").attr("class","bar-label")
      .attr("x",d=>x(d.value)+5).attr("y",d=>y(d.label)+y.bandwidth()/2+4).text(d=>fmtK(d.value)).style("opacity",0)
      .transition().duration(800).delay((d,i)=>i*60+400).style("opacity",1);
    bars.on("mouseover",(e,d)=>showTip(`<strong>${d.label}</strong>: ${fmtK(d.value)}`,e))
        .on("mouseout",hideTip);
  }

  function s1Records() {
    clear();
    const {w,h,m} = getDims();
    const earliest = METRO_DATA.section1.earliestRecord;
    const latest = METRO_DATA.section1.latestRecord;
    const keys = ["totalSmartCards","totalNCMC","totalTokens","totalQR","groupTicket","oneDayPass","threeDayPass","fiveDayPass"];
    const labels = ["Smart Cards","NCMC","Tokens","QR","Group","1-Day","3-Day","5-Day"];
    const colors = ["#8b2183","#00afff","#ff6600","#ffcb1c","#ff66dd","#33ff33","#9966ff","#ff3333"];
    const data = keys.map((k,i) => ({
      label: labels[i],
      color: colors[i],
      earliest: earliest[k],
      latest: latest[k]
    }));
    const iw = w-m.l-m.r, ih = h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);

    const x0 = d3.scaleBand().domain(data.map(d=>d.label)).range([0, iw]).padding(0.2);
    const x1 = d3.scaleBand().domain(["earliest","latest"]).range([0, x0.bandwidth()]).padding(0.15);
    const maxVal = d3.max(data, d => Math.max(d.earliest, d.latest));
    const y = d3.scaleLinear().domain([0, maxVal*1.15]).range([ih, 0]);

    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text")
     .text("Payment Methods: First Day vs Last Day");

    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(fmtKShort));
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x0));

    const groups = g.selectAll(".bar-group").data(data).enter().append("g")
      .attr("class","bar-group").attr("transform",d=>`translate(${x0(d.label)},0)`);

    const barsE = groups.append("rect")
      .attr("class","bar bar-earliest")
      .attr("x", x1("earliest")).attr("width", x1.bandwidth())
      .attr("y", ih).attr("height", 0)
      .attr("fill", d => d.color).attr("opacity", 0.5);
    barsE.transition().duration(600).delay((d,i)=>i*60)
      .attr("y", d=>y(d.earliest)).attr("height", d=>ih-y(d.earliest));

    const barsL = groups.append("rect")
      .attr("class","bar bar-latest")
      .attr("x", x1("latest")).attr("width", x1.bandwidth())
      .attr("y", ih).attr("height", 0)
      .attr("fill", d => d.color);
    barsL.transition().duration(600).delay((d,i)=>i*60+300)
      .attr("y", d=>y(d.latest)).attr("height", d=>ih-y(d.latest));

    groups.selectAll(".bar-label-e").data(d=>[d]).enter().append("text")
      .attr("class","bar-label").attr("x", x1("earliest")+x1.bandwidth()/2)
      .attr("y", d=>y(d.earliest)-4).attr("text-anchor","middle").attr("font-size","9px")
      .text(d=>fmtKShort(d.earliest)).style("opacity",0)
      .transition().duration(400).delay((d,i)=>i*60+700).style("opacity",1);

    groups.selectAll(".bar-label-l").data(d=>[d]).enter().append("text")
      .attr("class","bar-label").attr("x", x1("latest")+x1.bandwidth()/2)
      .attr("y", d=>y(d.latest)-4).attr("text-anchor","middle").attr("font-size","9px")
      .text(d=>fmtKShort(d.latest)).style("opacity",0)
      .transition().duration(400).delay((d,i)=>i*60+900).style("opacity",1);

    const legend = g.append("g").attr("transform",`translate(${iw-180},${-8})`);
    legend.append("rect").attr("x",0).attr("y",0).attr("width",12).attr("height",12).attr("fill","#666").attr("opacity",0.5);
    legend.append("text").attr("x",18).attr("y",10).attr("font-size","11px").attr("fill","#333").text("Oct 26, 2024 (First Day)");
    legend.append("rect").attr("x",0).attr("y",18).attr("width",12).attr("height",12).attr("fill","#666");
    legend.append("text").attr("x",18).attr("y",28).attr("font-size","11px").attr("fill","#333").text("May 5, 2025 (Last Day)");

    groups.selectAll("rect").on("mouseover",(e,d)=>{
      const isEarliest = e.target.classList.contains("bar-earliest");
      const val = isEarliest ? d.earliest : d.latest;
      const date = isEarliest ? "Oct 26, 2024" : "May 5, 2025";
      showTip(`<strong>${d.label}</strong> — ${date}<br>${fmtK(val)} riders`, e);
    }).on("mouseout",hideTip);
  }

  function s1Missing() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section1.missingDays;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    svg.append("text").attr("x",w/2).attr("y",30).attr("text-anchor","middle").attr("class","chart-title-text").text("Missing Data — Last 10 Dates");
    const g = svg.append("g").attr("transform",`translate(${m.l},50)`);
    const ih = h-80;
    data.forEach((d,i) => {
      const y = i*32;
      g.append("rect").attr("x",0).attr("y",y).attr("width",w-m.l-m.r).attr("height",28)
        .attr("fill", i%2 ? "rgba(255,107,0,0.08)" : "rgba(0,0,0,0.03)").attr("rx",4);
      g.append("text").attr("x",10).attr("y",y+18).attr("fill","#333").attr("font-size","12px").text(d.date);
      g.append("text").attr("x",150).attr("y",y+18).attr("fill","#666").attr("font-size","12px").text(d.dayOfWeek);
      g.append("text").attr("x",w-m.l-m.r-20).attr("y",y+18).attr("fill","#ff8c00").attr("font-size","12px").attr("text-anchor","end").text("<NA>");
    });
  }

  function s1Glance(substep) {
    substep = substep || 0;
    clear();
    const {w,h,m} = getDims();
    const allData = METRO_DATA.section2.ridershipTimeline;

    let data, title, yMin;
    if (substep === 0) {
      data = allData.slice(-7);
      title = "Last 7 Days (1 Week)";
      yMin = 0;
    } else if (substep === 1) {
      data = allData.slice(-28);
      title = "Last 28 Days (4 Weeks)";
      yMin = 450000;
    } else {
      data = allData;
      title = "Entire Dataset (150 Days)";
      yMin = 0;
    }

    const iw = w - m.l - m.r, ih = h - m.t - m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    g.append("text").attr("x", iw / 2).attr("y", -10).attr("text-anchor", "middle")
     .attr("class", "chart-title-text").text(title);

    const x = d3.scaleBand().domain(data.map(d => d.date)).range([0, iw]).padding(0.1);
    const maxVal = d3.max(data, d => d.total);
    const y = d3.scaleLinear().domain([yMin, maxVal * 1.1]).range([ih, 0]);

    const purples = d3.scaleSequential(d3.interpolatePurples).domain([0, data.length]);

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`)
     .call(d3.axisBottom(x).tickFormat(d => {
       const dt = new Date(d);
       return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
     }).tickValues(data.filter((d, i) => {
       if (substep <= 1) return true;
       return new Date(d.date).getDay() === 1;
     }).map(d => d.date)))
     .selectAll("text").style("font-size", substep === 2 ? "8px" : "10px");

    g.append("g").attr("class", "axis")
     .call(d3.axisLeft(y).tickFormat(fmtKShort).ticks(6));

    const bars = g.selectAll(".glance-bar").data(data).enter().append("rect")
      .attr("class", "glance-bar")
      .attr("x", d => x(d.date)).attr("width", x.bandwidth())
      .attr("y", ih).attr("height", 0)
      .attr("fill", (d, i) => purples(i))
      .attr("stroke", "none");

    bars.transition().duration(600).delay((d, i) => i * (substep === 2 ? 3 : 30))
      .attr("y", d => y(d.total)).attr("height", d => Math.max(0, ih - y(d.total)));

    bars.on("mouseover", (e, d) => showTip(
      `<strong>${d.date}</strong> (${d.dayOfWeek})<br>${fmtK(d.total)} riders`, e
    )).on("mouseout", hideTip);

    if (yMin > 0) {
      g.append("text").attr("x", 4).attr("y", y(yMin) - 4)
       .attr("font-size", "9px").attr("fill", "var(--text-dim)")
       .text(`y-axis starts at ${fmtKShort(yMin)} to amplify variation`);
    }
  }

  // ── S2: Top/Bottom 10 bar charts ──────────────────────────────────
  function s2Bars(data, title, color) {
    clear();
    const {w,h,m} = getDims();
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text(title);
    const x = d3.scaleLinear().domain([0, d3.max(data,d=>d.totalRiders)*1.05]).range([0,iw]);
    const y = d3.scaleBand().domain(data.map(d=>d.date)).range([0,ih]).padding(0.25);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickSize(0));
    g.append("text").attr("x",iw/2).attr("y",ih+40).attr("text-anchor","middle").attr("class","axis-label").text("Total Riders");
    const bars = g.selectAll(".bar").data(data).enter().append("rect").attr("class","bar")
      .attr("y",d=>y(d.date)).attr("height",y.bandwidth()).attr("x",0).attr("width",0).attr("fill",color);
    bars.transition().duration(800).delay((d,i)=>i*50).attr("width",d=>x(d.totalRiders));
    g.selectAll(".bar-label").data(data).enter().append("text").attr("class","bar-label")
      .attr("x",d=>x(d.totalRiders)+5).attr("y",d=>y(d.date)+y.bandwidth()/2+4)
      .text(d=>fmtK(d.totalRiders)).style("opacity",0)
      .transition().duration(400).delay((d,i)=>i*50+500).style("opacity",1);
    bars.on("mouseover",(e,d)=>showTip(`<strong>${d.date}</strong> (${d.dayOfWeek})<br/>Riders: ${fmtK(d.totalRiders)}`,e)).on("mouseout",hideTip);
  }

  function s2Intro() {
    clear();
    const {w,h} = getDims();
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    svg.append("text").attr("x",w/2).attr("y",h/2).attr("text-anchor","middle").attr("fill","#b8860b").attr("font-size","16px").attr("font-weight","bold").text("NammaMetro crossed 700,000 daily riders in Oct 2023");
    svg.append("text").attr("x",w/2).attr("y",h/2+30).attr("text-anchor","middle").attr("fill","#666").attr("font-size","13px").text("By Dec 2024, it crossed 900,000!");
  }
  function s2Top10() { s2Bars(METRO_DATA.section2.top10Busiest, "Top 10 Busiest Days", "#ffcb1c"); }

  function s2CompareBars() {
    clear();
    const topData = METRO_DATA.section2.top10Busiest;
    const bottomData = METRO_DATA.section2.bottom10LeastBusy;
    const {w,h,m} = getDims();
    const iw = w - m.l - m.r, ih = h - m.t - m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    g.append("text").attr("x", iw/2).attr("y", -10).attr("text-anchor", "middle").attr("class", "chart-title-text").text("Top 10 vs 10 Least Busy Days");

    const maxVal = d3.max([...topData, ...bottomData], d => d.totalRiders);
    const x = d3.scaleLinear().domain([0, maxVal * 1.05]).range([0, iw]);
    const y0 = d3.scaleBand().domain(d3.range(1, 11)).range([0, ih]).padding(0.25);
    const y1 = d3.scaleBand().domain(["top", "bottom"]).range([0, y0.bandwidth()]).padding(0.1);

    const colorMap = { top: "#ffcb1c", bottom: "#00afff" };
    const labelMap = { top: "Top 10", bottom: "Least 10" };
    const data = [];
    for (let i = 1; i <= 10; i++) {
      data.push({ rank: i, series: "top", value: topData[i-1].totalRiders, date: topData[i-1].date, dayOfWeek: topData[i-1].dayOfWeek });
      data.push({ rank: i, series: "bottom", value: bottomData[i-1].totalRiders, date: bottomData[i-1].date, dayOfWeek: bottomData[i-1].dayOfWeek });
    }

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).tickFormat(d => (d/1000).toFixed(0) + "K"));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y0).tickFormat(d => "Rank " + d));
    g.append("text").attr("x", iw/2).attr("y", ih + 40).attr("text-anchor", "middle").attr("class", "axis-label").text("Total Riders");

    const bars = g.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar")
      .attr("y", d => y0(d.rank) + y1(d.series)).attr("height", y1.bandwidth()).attr("x", 0).attr("width", 0).attr("fill", d => colorMap[d.series]);
    bars.transition().duration(800).delay((d, i) => i * 40).attr("width", d => x(d.value));

    g.selectAll(".bar-label").data(data).enter().append("text").attr("class", "bar-label")
      .attr("x", d => x(d.value) + 5).attr("y", d => y0(d.rank) + y1(d.series) + y1.bandwidth()/2 + 4)
      .text(d => fmtKShort(d.value)).style("opacity", 0)
      .transition().duration(400).delay((d, i) => i * 40 + 500).style("opacity", 1);

    bars.on("mouseover", (e, d) => showTip(`<strong>${labelMap[d.series]} — Rank ${d.rank}</strong><br>${d.date} (${d.dayOfWeek})<br>${fmtK(d.value)} riders`, e)).on("mouseout", hideTip);

    const lg = g.append("g").attr("class", "legend").attr("transform", `translate(${iw - 110}, 0)`);
    ["top", "bottom"].forEach((s, i) => {
      lg.append("rect").attr("x", 0).attr("y", i * 18).attr("width", 12).attr("height", 12).attr("fill", colorMap[s]);
      lg.append("text").attr("x", 18).attr("y", i * 18 + 10).attr("font-size", "11px").attr("fill", "#333").text(labelMap[s]);
    });
  }
  function s2Bottom10() { s2CompareBars(); }

  // ── S3: Weekly patterns ───────────────────────────────────────────
  function s3_7days() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section3.last7Days;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Total Daily Ridership — Last 7 Days");
    const x = d3.scaleBand().domain(data.map(d=>d.dayOfWeek)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data,d=>d.totalRiders)*1.1]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    g.append("text").attr("x",iw/2).attr("y",ih+40).attr("text-anchor","middle").attr("class","axis-label").text("Day of Week");
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Total Riders");
    const bars = g.selectAll(".bar").data(data).enter().append("rect").attr("class","bar")
      .attr("x",d=>x(d.dayOfWeek)).attr("width",x.bandwidth()).attr("y",ih).attr("height",0)
      .attr("fill", d => d.dayOfWeek==="Sunday"||d.dayOfWeek==="Saturday" ? "#ff66dd" : "#00afff");
    bars.transition().duration(800).delay((d,i)=>i*80).attr("y",d=>y(d.totalRiders)).attr("height",d=>ih-y(d.totalRiders));
    bars.on("mouseover",(e,d)=>showTip(`<strong>${d.dayOfWeek}</strong><br/>${d.date}<br/>Riders: ${fmtK(d.totalRiders)}`,e)).on("mouseout",hideTip);
  }

  function s3Dow() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section3.dayOfWeekCounts;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Sample Count by Day of Week");
    const x = d3.scaleBand().domain(data.map(d=>d.day)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data,d=>d.count)*1.2]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y));
    g.append("text").attr("x",iw/2).attr("y",ih+40).attr("text-anchor","middle").attr("class","axis-label").text("Day of Week");
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Count");
    const bars = g.selectAll(".bar").data(data).enter().append("rect").attr("class","bar")
      .attr("x",d=>x(d.day)).attr("width",x.bandwidth()).attr("y",ih).attr("height",0).attr("fill","#00afff");
    bars.transition().duration(600).delay((d,i)=>i*50).attr("y",d=>y(d.count)).attr("height",d=>ih-y(d.count));
    g.selectAll(".bar-label").data(data).enter().append("text").attr("class","bar-label")
      .attr("x",d=>x(d.day)+x.bandwidth()/2).attr("y",d=>y(d.count)-5).attr("text-anchor","middle").text(d=>d.count);
  }

  function s3Payment() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section3.weeklyAverage;
    const keys = ["smartCards","ncmc","tokens","qr"];
    const labels = ["Smart Cards","NCMC","Tokens","QR"];
    const colors = ["#8b2183","#00afff","#ff6600","#ffcb1c"];
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Avg Ridership by Payment Method & Day");
    const x0 = d3.scaleBand().domain(data.map(d=>d.day)).range([0,iw]).padding(0.2);
    const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.05);
    const y = d3.scaleLinear().domain([0, d3.max(data, d=>Math.max(d.smartCards,d.tokens,d.qr))*1.1]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x0));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    g.append("text").attr("x",iw/2).attr("y",ih+40).attr("text-anchor","middle").attr("class","axis-label").text("Day of Week");
    keys.forEach((k,ki) => {
      const bars = g.selectAll(".bar-"+k).data(data).enter().append("rect")
        .attr("x",d=>x0(d.day)+x1(k)).attr("width",x1.bandwidth()).attr("y",ih).attr("height",0).attr("fill",colors[ki]);
      bars.transition().duration(700).delay((d,i)=>i*40+ki*100).attr("y",d=>y(d[k])).attr("height",d=>ih-y(d[k]));
      bars.on("mouseover",(e,d)=>showTip(`<strong>${d.day} — ${labels[ki]}</strong><br/>${fmtK(d[k])}`,e)).on("mouseout",hideTip);
    });
    // Legend
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-120},10)`);
    labels.forEach((l,i) => {
      lg.append("rect").attr("x",0).attr("y",i*18).attr("width",12).attr("height",12).attr("fill",colors[i]);
      lg.append("text").attr("x",18).attr("y",i*18+10).text(l);
    });
  }

  // ── S4: Crossover chart ───────────────────────────────────────────
  function s4Intro() {
    clear();
    const {w,h} = getDims();
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    svg.append("text").attr("x",w/2).attr("y",h/2-20).attr("text-anchor","middle").attr("fill","#ff66dd").attr("font-size","15px").attr("font-weight","bold").text("Three Traffic Bands");
    svg.append("text").attr("x",w/2).attr("y",h/2).attr("text-anchor","middle").attr("fill","#666").attr("font-size","12px").text("Weekday (Mon-Thu) · Weekend Lite (Fri-Sat) · Weekend (Sun)");
    svg.append("text").attr("x",w/2).attr("y",h/2+25).attr("text-anchor","middle").attr("fill","#666").attr("font-size","12px").text("Commute = Smart Cards + NCMC · Casual = Tokens + QR + Group");
  }

  function s4Crossover() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section4.crossoverTable;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Commute vs Casual — The Crossover");
    const x = d3.scaleBand().domain(data.map(d=>d.day)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d=>Math.max(d.commute,d.casual))*1.1]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    g.append("text").attr("x",iw/2).attr("y",ih+40).attr("text-anchor","middle").attr("class","axis-label").text("Day of Week");
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Riders");
    // Commute bars
    const cb = g.selectAll(".commute-bar").data(data).enter().append("rect")
      .attr("x",d=>x(d.day)-x.bandwidth()/4).attr("width",x.bandwidth()/2).attr("y",ih).attr("height",0).attr("fill","#8b2183");
    cb.transition().duration(700).delay((d,i)=>i*60).attr("y",d=>y(d.commute)).attr("height",d=>ih-y(d.commute));
    cb.on("mouseover",(e,d)=>showTip(`<strong>${d.day} — Commute</strong><br/>${fmtK(d.commute)}`,e)).on("mouseout",hideTip);
    // Casual bars
    const ab = g.selectAll(".casual-bar").data(data).enter().append("rect")
      .attr("x",d=>x(d.day)+1).attr("width",x.bandwidth()/2).attr("y",ih).attr("height",0).attr("fill","#00afff");
    ab.transition().duration(700).delay((d,i)=>i*60+200).attr("y",d=>y(d.casual)).attr("height",d=>ih-y(d.casual));
    ab.on("mouseover",(e,d)=>showTip(`<strong>${d.day} — Casual</strong><br/>${fmtK(d.casual)}`,e)).on("mouseout",hideTip);
    // Crossover line
    const line = d3.line().x(d=>x(d.day)+x.bandwidth()/2).y(d=>y(d.casual));
    g.append("path").datum(data).attr("d",line).attr("fill","none").attr("stroke","#ff66dd").attr("stroke-width",2).attr("stroke-dasharray","5,3").style("opacity",0)
      .transition().delay(1000).duration(500).style("opacity",1);
    // Legend
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-100},10)`);
    lg.append("rect").attr("width",12).attr("height",12).attr("fill","#8b2183");
    lg.append("text").attr("x",18).attr("y",10).text("Commute");
    lg.append("rect").attr("y",18).attr("width",12).attr("height",12).attr("fill","#00afff");
    lg.append("text").attr("x",18).attr("y",28).text("Casual");
  }

  // ── S5: Monthly, Boxplot, Ebb&Flow, Wave ──────────────────────────
  function s5Monthly() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section5.estimatedMonthly;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Estimated Monthly Ridership (millions)");
    const x = d3.scaleBand().domain(data.map(d=>d.yearMonth)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data,d=>d.monthlyTotalMillions)*1.1]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y));
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Millions");
    const bars = g.selectAll(".bar").data(data).enter().append("rect").attr("class","bar")
      .attr("x",d=>x(d.yearMonth)).attr("width",x.bandwidth()).attr("y",ih).attr("height",0).attr("fill","#ff6600");
    bars.transition().duration(700).delay((d,i)=>i*80).attr("y",d=>y(d.monthlyTotalMillions)).attr("height",d=>ih-y(d.monthlyTotalMillions));
    g.selectAll(".bar-label").data(data).enter().append("text").attr("class","bar-label")
      .attr("x",d=>x(d.yearMonth)+x.bandwidth()/2).attr("y",d=>y(d.monthlyTotalMillions)-5).attr("text-anchor","middle").text(d=>d.monthlyTotalMillions);
    bars.on("mouseover",(e,d)=>showTip(`<strong>${d.yearMonth}</strong><br/>Total: ${d.monthlyTotalMillions}M<br/>Daily Avg: ${d.dailyAverageThousands}K`,e)).on("mouseout",hideTip);
  }

  function s5Boxplot() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section5.boxplotData;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Daily Ridership Spread by Month (boxplot)");
    const x = d3.scaleBand().domain(data.map(d=>d.month)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([300, 950]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>d+"K"));
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Daily Riders (thousands)");
    data.forEach((d,i) => {
      const cx = x(d.month)+x.bandwidth()/2;
      const bw = x.bandwidth()*0.5;
      // Whisker line
      g.append("line").attr("x1",cx).attr("x2",cx).attr("y1",y(d.min)).attr("y2",y(d.max)).attr("stroke","#666").attr("stroke-width",1).style("opacity",0)
        .transition().delay(i*100).duration(400).style("opacity",1);
      // Box
      g.append("rect").attr("x",cx-bw/2).attr("width",bw).attr("y",y(d.q3)).attr("height",y(d.q1)-y(d.q3))
        .attr("fill","#ff6600").attr("fill-opacity",0.3).attr("stroke","#ff6600").attr("stroke-width",1.5).style("opacity",0)
        .transition().delay(i*100+200).duration(400).style("opacity",1);
      // Median line
      g.append("line").attr("x1",cx-bw/2).attr("x2",cx+bw/2).attr("y1",y(d.median)).attr("y2",y(d.median)).attr("stroke","#cc4400").attr("stroke-width",2).style("opacity",0)
        .transition().delay(i*100+400).duration(300).style("opacity",1);
      // Outliers
      if (d.outliers) {
        d.outliers.forEach(o => {
          g.append("circle").attr("cx",cx).attr("cy",y(o.value)).attr("r",3).attr("fill","#ff3333").attr("stroke","#fff").attr("stroke-width",0.5).style("opacity",0)
            .transition().delay(i*100+600).duration(300).style("opacity",1);
        });
      }
    });
  }

  function s5EbbFlow() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section5.dailyFlow.filter(d=>d.totalRiders);
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Ebb and Flow of Daily Passenger Traffic");
    const x = d3.scaleTime().domain(d3.extent(data,d=>new Date(d.date))).range([0,iw]);
    const y = d3.scaleLinear().domain([d3.min(data,d=>d.totalRiders)*0.8, d3.max(data,d=>d.totalRiders)*1.05]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    const area = d3.area().x(d=>x(new Date(d.date))).y0(ih).y1(d=>y(d.totalRiders)).curve(d3.curveMonotoneX);
    const path = g.append("path").datum(data).attr("fill","url(#grad-flow)").attr("d",area);
    const totalLen = path.node().getTotalLength();
    path.attr("stroke","#ff6600").attr("stroke-width",1.5).attr("stroke-dasharray",totalLen).attr("stroke-dashoffset",totalLen)
      .transition().duration(1500).attr("stroke-dashoffset",0);
    // Gradient
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id","grad-flow").attr("x1","0").attr("y1","0").attr("x2","0").attr("y2","1");
    grad.append("stop").attr("offset","0%").attr("stop-color","#ff6600").attr("stop-opacity",0.5);
    grad.append("stop").attr("offset","100%").attr("stop-color","#ff6600").attr("stop-opacity",0.05);
  }

  function s5Wave() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section5.waveData.filter(d=>d.commute || d.casual);
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("A Wave Rides NammaMetro — Commute vs Casual");
    const x = d3.scaleTime().domain(d3.extent(data,d=>new Date(d.date))).range([0,iw]);
    const y = d3.scaleLinear().domain([0, 700000]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    const lc = d3.line().x(d=>x(new Date(d.date))).y(d=>y(d.commute)).curve(d3.curveMonotoneX).defined(d=>d.commute!=null);
    const la = d3.line().x(d=>x(new Date(d.date))).y(d=>y(d.casual)).curve(d3.curveMonotoneX).defined(d=>d.casual!=null);
    const pc = g.append("path").datum(data).attr("fill","none").attr("stroke","#8b2183").attr("stroke-width",2).attr("d",lc);
    const pa = g.append("path").datum(data).attr("fill","none").attr("stroke","#00afff").attr("stroke-width",2).attr("d",la);
    [pc,pa].forEach(p => {
      const len = p.node().getTotalLength();
      p.attr("stroke-dasharray",len).attr("stroke-dashoffset",len).transition().duration(1500).attr("stroke-dashoffset",0);
    });
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-90},10)`);
    lg.append("rect").attr("width",12).attr("height",12).attr("fill","#8b2183"); lg.append("text").attr("x",18).attr("y",10).text("Commute");
    lg.append("rect").attr("y",18).attr("width",12).attr("height",12).attr("fill","#00afff"); lg.append("text").attr("x",18).attr("y",28).text("Casual");
  }

  // ── S6: Sankranti & Towers ────────────────────────────────────────
  function s6Sankranti() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section6.sankrantiPeriod.filter(d=>d.commute || d.casual);
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Sankranti Period — Commute vs Casual (Jan 2025)");
    const x = d3.scaleBand().domain(data.map(d=>d.date.slice(5))).range([0,iw]).padding(0.2);
    const y = d3.scaleLinear().domain([0, 700000]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).tickFormat(d=>d));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    const lc = d3.line().x(d=>x(d.date.slice(5))+x.bandwidth()/2).y(d=>y(d.commute)).defined(d=>d.commute!=null).curve(d3.curveMonotoneX);
    const la = d3.line().x(d=>x(d.date.slice(5))+x.bandwidth()/2).y(d=>y(d.casual)).defined(d=>d.casual!=null).curve(d3.curveMonotoneX);
    g.append("path").datum(data).attr("fill","none").attr("stroke","#8b2183").attr("stroke-width",2.5).attr("d",lc).style("opacity",0)
      .transition().duration(800).style("opacity",1);
    g.append("path").datum(data).attr("fill","none").attr("stroke","#00afff").attr("stroke-width",2.5).attr("d",la).style("opacity",0)
      .transition().delay(300).duration(800).style("opacity",1);
    // Highlight Jan 15-16
    g.append("rect").attr("x",x("01-15")-5).attr("width",x.bandwidth()*2+10).attr("y",0).attr("height",ih).attr("fill","#ff8c00").attr("fill-opacity",0.1);
    g.append("text").attr("x",x("01-15")+x.bandwidth()).attr("y",15).attr("text-anchor","middle").attr("fill","#ff8c00").attr("font-size","10px").text("Anomaly");
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-90},10)`);
    lg.append("rect").attr("width",12).attr("height",12).attr("fill","#8b2183"); lg.append("text").attr("x",18).attr("y",10).text("Commute");
    lg.append("rect").attr("y",18).attr("width",12).attr("height",12).attr("fill","#00afff"); lg.append("text").attr("x",18).attr("y",28).text("Casual");
  }

  function s6Towers() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section6.ridershipTowers.filter(d=>d.smartCards);
    const keys = ["smartCards","ncmc","tokens","qr"];
    const labels = ["Smart Cards","NCMC","Tokens","QR"];
    const colors = ["#8b2183","#00afff","#ff6600","#ffcb1c"];
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Ridership Towers — Payment Methods (Jan 2025)");
    const x = d3.scaleBand().domain(data.map(d=>d.date.slice(5))).range([0,iw]).padding(0.2);
    const y = d3.scaleLinear().domain([0, 700000]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    // Stacked bars
    let cumulative = data.map(()=>0);
    keys.forEach((k,ki) => {
      const bars = g.selectAll(".tower-"+k).data(data).enter().append("rect")
        .attr("x",d=>x(d.date.slice(5))).attr("width",x.bandwidth())
        .attr("y",d=>y(cumulative[data.indexOf(d)]+d[k])).attr("height",d=>ih-y(d[k])).attr("fill",colors[ki]).style("opacity",0);
      bars.transition().delay(ki*150).duration(500).style("opacity",1);
      bars.on("mouseover",(e,d)=>showTip(`<strong>${d.date}</strong> — ${labels[ki]}<br/>${fmtK(d[k])}`,e)).on("mouseout",hideTip);
      data.forEach((d,i) => cumulative[i] += d[k]);
    });
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-90},10)`);
    labels.forEach((l,i) => {
      lg.append("rect").attr("y",i*18).attr("width",12).attr("height",12).attr("fill",colors[i]);
      lg.append("text").attr("x",18).attr("y",i*18+10).text(l);
    });
  }

  // ── S7: Visitor passes ────────────────────────────────────────────
  function s7Visitor() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section7.visitorPassData;
    const keys = ["oneDayPass","threeDayPass","fiveDayPass"];
    const labels = ["1-Day Pass","3-Day Pass","5-Day Pass"];
    const colors = ["#ff3030","#ff8c00","#ffcb1c"];
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Visitor Pass Sales — Ranji Trophy Period");
    const x = d3.scaleBand().domain(data.map(d=>d.date.slice(5))).range([0,iw]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d=>d.oneDayPass)*1.2]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y));
    g.append("text").attr("x",iw/2).attr("y",ih+40).attr("text-anchor","middle").attr("class","axis-label").text("Date (Jan 2025)");
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Passes Sold");
    keys.forEach((k,ki) => {
      const bars = g.selectAll(".pass-"+k).data(data).enter().append("rect")
        .attr("x",d=>x(d.date.slice(5))+ki*x.bandwidth()/3).attr("width",x.bandwidth()/3-2)
        .attr("y",ih).attr("height",0).attr("fill",colors[ki]);
      bars.transition().duration(600).delay((d,i)=>i*50+ki*100).attr("y",d=>y(d[k])).attr("height",d=>ih-y(d[k]));
      bars.on("mouseover",(e,d)=>showTip(`<strong>Jan ${d.date.slice(8)}</strong> — ${labels[ki]}<br/>${d[k]} passes`,e)).on("mouseout",hideTip);
    });
    // Highlight Jan 25
    g.append("line").attr("x1",x("01-25")+x.bandwidth()/2).attr("x2",x("01-25")+x.bandwidth()/2).attr("y1",0).attr("y2",ih).attr("stroke","#ff3030").attr("stroke-width",1).attr("stroke-dasharray","4,2");
    g.append("text").attr("x",x("01-25")+x.bandwidth()/2).attr("y",12).attr("text-anchor","middle").attr("fill","#ff3030").attr("font-size","10px").text("Ranji Trophy");
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-100},10)`);
    labels.forEach((l,i) => { lg.append("rect").attr("y",i*18).attr("width",12).attr("height",12).attr("fill",colors[i]); lg.append("text").attr("x",18).attr("y",i*18+10).text(l); });
  }

  // ── S8: Fare hike trend, CI chart, Heatmap ────────────────────────
  function s8Intro() {
    clear();
    const {w,h} = getDims();
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    svg.append("text").attr("x",w/2).attr("y",h/2-20).attr("text-anchor","middle").attr("fill","#ff8c00").attr("font-size","16px").attr("font-weight","bold").text("Fare Hike: February 9, 2025");
    svg.append("text").attr("x",w/2).attr("y",h/2).attr("text-anchor","middle").attr("fill","#666").attr("font-size","13px").text("First fare revision since 2017");
    svg.append("text").attr("x",w/2).attr("y",h/2+25).attr("text-anchor","middle").attr("fill","#666").attr("font-size","12px").text("Max increase capped at 71.43% after public backlash");
  }

  function s8Trend() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section8.fareHikeWindow;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("6-Week Window: Ridership Trend (R² = 0.740)");
    const x = d3.scaleTime().domain(d3.extent(data,d=>new Date(d.date))).range([0,iw]);
    const y = d3.scaleLinear().domain([500000, 950000]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    // Fare hike line
    const hikeX = x(new Date("2025-02-09"));
    g.append("line").attr("x1",hikeX).attr("x2",hikeX).attr("y1",0).attr("y2",ih).attr("stroke","#ff8c00").attr("stroke-width",2).attr("stroke-dasharray","5,3");
    g.append("text").attr("x",hikeX+5).attr("y",15).attr("fill","#ff8c00").attr("font-size","10px").text("Fare Hike Feb 9");
    // Trend line — manual linear regression
    const pts = data.map(d=>[+new Date(d.date), d.ridership]);
    const n = pts.length;
    const sumX = d3.sum(pts, p=>p[0]);
    const sumY = d3.sum(pts, p=>p[1]);
    const sumXY = d3.sum(pts, p=>p[0]*p[1]);
    const sumX2 = d3.sum(pts, p=>p[0]*p[0]);
    const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
    const intercept = (sumY - slope*sumX) / n;
    const predict = x => slope*x + intercept;
    const trendData = [{date:data[0].date, ridership:predict(+new Date(data[0].date))},{date:data[data.length-1].date, ridership:predict(+new Date(data[data.length-1].date))}];
    g.append("path").datum(trendData).attr("fill","none").attr("stroke","#ff3333").attr("stroke-width",2).attr("class","trend-line")
      .attr("d",d3.line().x(d=>x(new Date(d.date))).y(d=>y(d.ridership))).style("opacity",0)
      .transition().delay(1000).duration(500).style("opacity",1);
    // Data line
    const line = d3.line().x(d=>x(new Date(d.date))).y(d=>y(d.ridership)).curve(d3.curveMonotoneX);
    const path = g.append("path").datum(data).attr("fill","none").attr("stroke","#00afff").attr("stroke-width",2).attr("d",line);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray",len).attr("stroke-dashoffset",len).transition().duration(1500).attr("stroke-dashoffset",0);
    // Points
    g.selectAll(".point").data(data).enter().append("circle").attr("class","point")
      .attr("cx",d=>x(new Date(d.date))).attr("cy",d=>y(d.ridership)).attr("r",3).attr("fill","#00afff").style("opacity",0)
      .transition().delay(1200).duration(300).style("opacity",1)
      .on("end", function() {});
    g.selectAll(".point").on("mouseover",(e,d)=>showTip(`<strong>${d.date}</strong><br/>Riders: ${fmtK(d.ridership)}`,e)).on("mouseout",hideTip);
  }

  function s8Who() {
    clear();
    const {w,h} = getDims();
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    svg.append("text").attr("x",w/2).attr("y",h/2-30).attr("text-anchor","middle").attr("fill","#ff8c00").attr("font-size","15px").attr("font-weight","bold").text("Who Did It Hurt?");
    svg.append("text").attr("x",w/2).attr("y",h/2).attr("text-anchor","middle").attr("fill","#666").attr("font-size","13px").text("👥 Commuters hit hardest · 💳 Payment shift evident");
    svg.append("text").attr("x",w/2).attr("y",h/2+25).attr("text-anchor","middle").attr("fill","#666").attr("font-size","12px").text("⚠️ Smart Card & NCMC get 5% discount · QR gets none");
  }

  function s8CI(ciData, title) {
    clear();
    const {w,h,m} = getDims();
    const data = ciData;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text(title);
    const x = d3.scaleBand().domain(data.map(d=>d.metric)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([d3.min(data,d=>d.ciLow)-5, d3.max(data,d=>d.ciHigh)+5]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>d+"%"));
    g.append("line").attr("x1",0).attr("x2",iw).attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#666").attr("stroke-dasharray","3,3");
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Change %");
    // CI bars
    data.forEach((d,i) => {
      const cx = x(d.metric)+x.bandwidth()/2;
      const color = d.direction==="up" ? "#33ff33" : d.direction==="down" ? "#ff3333" : "#666";
      g.append("line").attr("x1",cx).attr("x2",cx).attr("y1",y(d.ciLow)).attr("y2",y(d.ciHigh)).attr("stroke",color).attr("stroke-width",3).style("opacity",0)
        .transition().delay(i*80).duration(400).style("opacity",1);
      const dot = g.append("circle").attr("cx",cx).attr("cy",y(d.changePct)).attr("r",5).attr("fill",color).attr("stroke","#fff").attr("stroke-width",1).style("opacity",0)
        .transition().delay(i*80+300).duration(300).style("opacity",1);
      g.append("text").attr("x",cx).attr("y",y(d.ciHigh)-8).attr("text-anchor","middle").attr("fill",color).attr("font-size","9px")
        .text((d.changePct>0?"+":"")+d.changePct+"%").style("opacity",0).transition().delay(i*80+400).style("opacity",1);
      // Attach tooltip to the circle (use selection, not transition)
      g.selectAll('circle').filter(function() { return +d3.select(this).attr("cx") === cx; })
        .on("mouseover",(e)=>showTip(`<strong>${d.metric}</strong><br/>Pre: ${fmtK(d.preEventMean)}<br/>Post: ${fmtK(d.postEventMean)}<br/>Change: ${(d.changePct>0?"+":"")+d.changePct}%<br/>CI: [${d.ciLow}%, ${d.ciHigh}%]<br/>${d.significant?"Significant":"Not significant"}`,e))
        .on("mouseout",hideTip);
    });
  }

  function s8CI99() { s8CI(METRO_DATA.section8.ci99, "99% CI — Weekday (Fare Hike Impact)"); }
  function s8CI95() { s8CI(METRO_DATA.section8.ci95, "95% CI — Weekend Lite (Fare Hike Impact)"); }

  function s8Heatmap() {
    clear();
    const {w,h,m} = getDims();
    const matrix = METRO_DATA.section8.correlationMatrix;
    const vars = matrix.map(d=>d.variable);
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("Correlation Heatmap — Payment Methods");
    const cs = Math.min(iw, ih) / vars.length;
    const color = d3.scaleLinear().domain([-1,0,1]).range(["#ff3333","#f5f5f5","#33ff33"]);
    const keyMap = {"Smart Cards":"smartCards","NCMC":"ncmc","Tokens":"tokens","QR":"qr","Commute":"commute","Casual":"casual"};
    vars.forEach((vy,ri) => {
      vars.forEach((vx,ci) => {
        const val = matrix[ri][keyMap[vx]] || 0;
        const cell = g.append("rect").attr("x",ci*cs).attr("y",ri*cs).attr("width",cs-2).attr("height",cs-2)
          .attr("fill",color(val)).attr("stroke","#ddd").attr("rx",3).style("opacity",0);
        cell.transition().delay((ri*vars.length+ci)*30).duration(300).style("opacity",1);
        cell.on("mouseover",(e)=>showTip(`<strong>${vy} vs ${vx}</strong><br/>r = ${val.toFixed(2)}`,e)).on("mouseout",hideTip);
        g.append("text").attr("x",ci*cs+cs/2).attr("y",ri*cs+cs/2+4).attr("text-anchor","middle")
          .attr("fill", Math.abs(val)>0.5 ? "#fff" : "#666").attr("font-size","10px").attr("font-weight","bold")
          .text(val.toFixed(2)).style("opacity",0).transition().delay((ri*vars.length+ci)*30+200).style("opacity",1);
      });
    });
    // Axis labels
    vars.forEach((v,i) => {
      g.append("text").attr("x",i*cs+cs/2).attr("y",-5).attr("text-anchor","middle").attr("fill","#666").attr("font-size","9px").text(v);
      g.append("text").attr("x",-8).attr("y",i*cs+cs/2+4).attr("text-anchor","end").attr("fill","#666").attr("font-size","9px").text(v);
    });
  }

  // ── S9: Conspiracy charts ─────────────────────────────────────────
  function s9Curious() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section9.disruptionData;
    const keys = ["smartCards","tokens","qr","ncmc"];
    const labels = ["Smart Cards","Tokens","QR","NCMC"];
    const colors = ["#8b2183","#ff6600","#ffcb1c","#00afff"];
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("The Jan 15-16 Payment Disruption");
    const x = d3.scaleBand().domain(data.map(d=>d.date.slice(5))).range([0,iw]).padding(0.2);
    const y = d3.scaleLinear().domain([0, 700000]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));
    keys.forEach((k,ki) => {
      const bars = g.selectAll(".d-"+k).data(data).enter().append("rect")
        .attr("x",d=>x(d.date.slice(5))+ki*x.bandwidth()/4).attr("width",x.bandwidth()/4-1)
        .attr("y",ih).attr("height",0).attr("fill",colors[ki]);
      bars.transition().duration(600).delay((d,i)=>i*60+ki*80).attr("y",d=>y(d[k])).attr("height",d=>ih-y(d[k]));
      bars.on("mouseover",(e,d)=>showTip(`<strong>${d.date}</strong> — ${labels[ki]}<br/>${fmtK(d[k])}`,e)).on("mouseout",hideTip);
    });
    // Highlight Jan 15-16
    ["01-15","01-16"].forEach(d => {
      g.append("rect").attr("x",x(d)-3).attr("width",x.bandwidth()+6).attr("y",0).attr("height",ih).attr("fill","#ff8c00").attr("fill-opacity",0.08);
    });
    const lg = g.append("g").attr("class","legend").attr("transform",`translate(${iw-90},10)`);
    labels.forEach((l,i) => { lg.append("rect").attr("y",i*18).attr("width",12).attr("height",12).attr("fill",colors[i]); lg.append("text").attr("x",18).attr("y",i*18+10).text(l); });
  }

  function s9Patterns() {
    s9Curious();
  }

  function s9Hypothesis() {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section9.ci999;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text("99.9% CI — Pre/Post Smart Card Surge (Jan 14)");
    const x = d3.scaleBand().domain(data.map(d=>d.metric+" ("+d.trafficBand+")")).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([d3.min(data,d=>d.ciLow)-5, d3.max(data,d=>d.ciHigh)+5]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0));
    g.selectAll(".axis text").style("font-size","8px");
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>d+"%"));
    g.append("line").attr("x1",0).attr("x2",iw).attr("y1",y(0)).attr("y2",y(0)).attr("stroke","#666").attr("stroke-dasharray","3,3");
    g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-45).attr("text-anchor","middle").attr("class","axis-label").text("Change %");
    data.forEach((d,i) => {
      const cx = x(d.metric+" ("+d.trafficBand+")")+x.bandwidth()/2;
      const color = d.direction==="up" ? "#33ff33" : d.direction==="down" ? "#ff3333" : "#666";
      g.append("line").attr("x1",cx).attr("x2",cx).attr("y1",y(d.ciLow)).attr("y2",y(d.ciHigh)).attr("stroke",color).attr("stroke-width",3).style("opacity",0)
        .transition().delay(i*60).duration(400).style("opacity",1);
      g.append("circle").attr("cx",cx).attr("cy",y(d.changePct)).attr("r",5).attr("fill",color).attr("stroke","#fff").attr("stroke-width",1).style("opacity",0)
        .transition().delay(i*60+300).duration(300).style("opacity",1);
      g.append("text").attr("x",cx).attr("y",y(d.ciHigh)-8).attr("text-anchor","middle").attr("fill",color).attr("font-size","8px")
        .text((d.changePct>0?"+":"")+d.changePct+"%").style("opacity",0).transition().delay(i*60+400).style("opacity",1);
      // Attach tooltip to the circle
      g.selectAll('circle').filter(function() { return +d3.select(this).attr("cx") === cx; })
        .on("mouseover",(e)=>showTip(`<strong>${d.metric} (${d.trafficBand})</strong><br/>Pre: ${fmtK(d.preEventMean)}<br/>Post: ${fmtK(d.postEventMean)}<br/>Change: ${(d.changePct>0?"+":"")+d.changePct}%<br/>CI: [${d.ciLow}%, ${d.ciHigh}%]`,e))
        .on("mouseout",hideTip);
    });
  }

  // ── S1: Calendar heatmap ──────────────────────────────────────────
  function s1Calendar(substep) {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section1.calendarData;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text")
      .text(substep === 1 ? "Calendar Heatmap — Missing Days Highlighted" : "Calendar Heatmap — Daily Total Ridership");

    // Group by week (columns) and day-of-week (rows)
    const cellSize = Math.min(iw / 28, ih / 8);
    const startDate = new Date("2024-10-26");
    const endDate = new Date("2025-05-05");
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const found = data.find(x => x.date === iso);
      days.push({ date: iso, total: found ? found.total : null, missing: !found, dow: d.getDay() });
    }

    // Color scale
    const maxTotal = d3.max(data, d => d.total) || 900000;
    const color = d3.scaleSequential(d3.interpolateRgbBasis(["#f5f5f5","#ffcb1c","#ff6600","#ff3333"])).domain([0, maxTotal]);

    // Week labels (months)
    const monthLabels = {};
    days.forEach(d => {
      const dt = new Date(d.date);
      const monthKey = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0');
      if (!monthLabels[monthKey]) monthLabels[monthKey] = { label: dt.toLocaleString('en', {month:'short'}), firstWeek: Math.floor((dt - startDate) / (7 * 86400000)) };
    });

    // Draw cells
    days.forEach((d, i) => {
      const week = Math.floor((new Date(d.date) - startDate) / (7 * 86400000));
      const dow = d.dow;
      const cx = week * (cellSize + 1);
      const cy = dow * (cellSize + 1);

      if (d.missing) {
        g.append("rect").attr("x",cx).attr("y",cy).attr("width",cellSize).attr("height",cellSize)
          .attr("class","cal-cell missing").attr("rx",2);
        if (substep === 1) {
          g.append("rect").attr("x",cx-1).attr("y",cy-1).attr("width",cellSize+2).attr("height",cellSize+2)
            .attr("fill","none").attr("stroke","var(--anomaly)").attr("stroke-width",1.5).attr("stroke-dasharray","2,2").attr("rx",3);
        }
      } else {
        g.append("rect").attr("x",cx).attr("y",cy).attr("width",cellSize).attr("height",cellSize)
          .attr("class","cal-cell").attr("fill",color(d.total)).attr("rx",2)
          .style("opacity",0).transition().delay(i*3).duration(200).style("opacity",1);
        g.append("rect").attr("x",cx).attr("y",cy).attr("width",cellSize).attr("height",cellSize)
          .attr("fill","transparent").attr("data-date",d.date)
          .on("mouseover",(e)=>showTip(`<strong>${d.date}</strong><br/>Riders: ${fmtK(d.total)}`,e))
          .on("mouseout",hideTip);
      }
    });

    // DOW labels
    const dowLabels = ['S','M','T','W','T','F','S'];
    dowLabels.forEach((l, i) => {
      g.append("text").attr("x",-8).attr("y",i*(cellSize+1)+cellSize/2+3).attr("text-anchor","end")
        .attr("class","cal-dow-label").text(l);
    });

    // Month labels
    Object.entries(monthLabels).forEach(([key, val]) => {
      g.append("text").attr("x",val.firstWeek*(cellSize+1)).attr("y",-5).attr("class","cal-month-label").text(val.label);
    });

    // Legend
    if (substep === 1) {
      g.append("text").attr("x",iw-100).attr("y",ih-5).attr("class","cal-legend-text")
        .text("🔴 Missing data");
    }
  }

  // ── S2: Milestone line chart ──────────────────────────────────────
  function s2Milestone(substep) {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section2.ridershipTimeline.filter(d=>d.total);
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text")
      .text(substep === 0 ? "Daily Ridership — 700K Milestone" : "Daily Ridership — 900K Record!");

    const x = d3.scaleTime().domain(d3.extent(data,d=>new Date(d.date))).range([0,iw]);
    const y = d3.scaleLinear().domain([400000, 950000]).range([ih,0]);
    g.append("g").attr("class","axis").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).tickFormat(d=>(d/1000).toFixed(0)+"K"));

    // 700K threshold line
    g.append("line").attr("x1",0).attr("x2",iw).attr("y1",y(700000)).attr("y2",y(700000))
      .attr("stroke","#ff6600").attr("stroke-width",1.5).attr("stroke-dasharray","5,3");
    g.append("text").attr("x",iw-5).attr("y",y(700000)-5).attr("text-anchor","end").attr("fill","#ff6600").attr("font-size","10px").text("700K threshold");

    // Data line
    const line = d3.line().x(d=>x(new Date(d.date))).y(d=>y(d.total)).curve(d3.curveMonotoneX);
    const path = g.append("path").datum(data).attr("fill","none").attr("stroke","#00afff").attr("stroke-width",2).attr("d",line);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray",len).attr("stroke-dashoffset",len).transition().duration(1500).attr("stroke-dashoffset",0);

    // Points
    g.selectAll(".point").data(data).enter().append("circle").attr("class","point")
      .attr("cx",d=>x(new Date(d.date))).attr("cy",d=>y(d.total)).attr("r",2).attr("fill","#00afff").style("opacity",0)
      .transition().delay(1200).duration(300).style("opacity",0.6);
    g.selectAll(".point").on("mouseover",(e,d)=>showTip(`<strong>${d.date}</strong> (${d.dayOfWeek})<br/>Riders: ${fmtK(d.total)}`,e)).on("mouseout",hideTip);

    // Substep 1: 900K pulsing dot
    if (substep >= 1) {
      const recordDay = data.find(d => d.total > 900000);
      if (recordDay) {
        g.append("circle").attr("cx",x(new Date(recordDay.date))).attr("cy",y(recordDay.total))
          .attr("r",5).attr("fill","#ff3333").attr("stroke","#fff").attr("stroke-width",2).attr("class","anomaly-dot");
        g.append("text").attr("x",x(new Date(recordDay.date))).attr("y",y(recordDay.total)-15)
          .attr("text-anchor","middle").attr("fill","#ff3333").attr("font-size","11px").attr("font-weight","bold")
          .text("900K! " + recordDay.date);
      }
    }
  }

  // ── S4: Band callout cards ────────────────────────────────────────
  function s4Bands(substep) {
    clear();
    const {w,h,m} = getDims();
    const data = METRO_DATA.section4.crossoverTable;
    const iw=w-m.l-m.r, ih=h-m.t-m.b;
    const svg = d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);

    const bandNames = ['Weekday (Mon–Thu)','Weekend Lite (Fri–Sat)','Weekend (Sun)'];
    const bandColors = ['var(--band-weekday)','var(--band-weekendlite)','var(--band-weekend)'];
    const bandIcons = ['💼','🍻','🛌🏼'];
    const bandDescs = [
      'Commuter ridership dominates. Smart Cards & NCMC peak.',
      'Crossover occurs. Casual ridership rises as commuters decline.',
      'Commuters plummet ~60%. Casual ridership reaches peak levels.'
    ];
    const bandStats = [
      { commute: 453955, casual: 404532 },
      { commute: 393122, casual: 421667 },
      { commute: 183740, casual: 454563 }
    ];

    const title = substep === 0 ? '💼 Weekday — Just Another Manic Monday' :
                  substep === 1 ? '🍻 Weekend Lite — Should I Stay or Should I Go?' :
                  '🛌🏼 Weekend — A Day of Rest';
    g.append("text").attr("x",iw/2).attr("y",-10).attr("text-anchor","middle").attr("class","chart-title-text").text(title);

    // Draw three band summary cards
    const cardW = iw / 3 - 10;
    data.forEach((d, i) => {
      if (i >= 3) return; // Only show Mon, Fri, Sun as band representatives
      const cx = i * (cardW + 15);
      const isActive = i === substep;
      const bandIdx = i;

      // Card background
      g.append("rect").attr("x",cx).attr("y",0).attr("width",cardW).attr("height",ih)
        .attr("rx",8).attr("fill", isActive ? bandColors[bandIdx].replace('var(','rgba(').replace(')',',0.08)') : 'rgba(0,0,0,0.02)')
        .attr("stroke", isActive ? bandColors[bandIdx].replace('var(','').replace(')','') : 'var(--border)')
        .attr("stroke-width", isActive ? 2 : 1)
        .style("opacity", isActive ? 1 : 0.4)
        .transition().duration(400).style("opacity", isActive ? 1 : 0.4);

      // Band name
      g.append("text").attr("x",cx+cardW/2).attr("y",25).attr("text-anchor","middle")
        .attr("font-size","14px").attr("font-weight","bold")
        .attr("fill", isActive ? bandColors[bandIdx].replace('var(','').replace(')','') : 'var(--muted)')
        .text(bandIcons[bandIdx] + ' ' + bandNames[bandIdx]);

      // Stats
      const stats = bandStats[bandIdx];
      g.append("text").attr("x",cx+cardW/2).attr("y",55).attr("text-anchor","middle")
        .attr("font-size","11px").attr("fill","var(--muted)").text("Commute: " + fmtK(stats.commute));
      g.append("text").attr("x",cx+cardW/2).attr("y",72).attr("text-anchor","middle")
        .attr("font-size","11px").attr("fill","var(--muted)").text("Casual: " + fmtK(stats.casual));

      // Mini bar comparison
      const barH = 80;
      const barY = 90;
      const maxVal = Math.max(stats.commute, stats.casual, 500000);
      const commuteH = (stats.commute / maxVal) * barH;
      const casualH = (stats.casual / maxVal) * barH;

      g.append("rect").attr("x",cx+cardW/2-25).attr("y",barY+barH-commuteH).attr("width",20).attr("height",commuteH)
        .attr("fill","var(--c-commute)").attr("rx",3).style("opacity",isActive?1:0.3);
      g.append("rect").attr("x",cx+cardW/2+5).attr("y",barY+barH-casualH).attr("width",20).attr("height",casualH)
        .attr("fill","var(--c-casual)").attr("rx",3).style("opacity",isActive?1:0.3);

      g.append("text").attr("x",cx+cardW/2-15).attr("y",barY+barH+15).attr("text-anchor","middle")
        .attr("font-size","9px").attr("fill","var(--muted)").text("Commute");
      g.append("text").attr("x",cx+cardW/2+15).attr("y",barY+barH+15).attr("text-anchor","middle")
        .attr("font-size","9px").attr("fill","var(--muted)").text("Casual");

      // Description
      if (isActive) {
        const desc = bandDescs[bandIdx].split('. ');
        desc.forEach((line, li) => {
          g.append("text").attr("x",cx+cardW/2).attr("y",barY+barH+35+li*14).attr("text-anchor","middle")
            .attr("font-size","10px").attr("fill","var(--text)").text(line + (li < desc.length-1 ? '.' : ''));
        });
      }
    });
  }

  // ── Chart registry ────────────────────────────────────────────────
  const registry = {
    "s1-intro": s1Intro, "s1-records": s1Records,
    "s1-calendar": s1Calendar, "s1-glance": s1Glance,
    "s2-intro": s2Intro, "s2-milestone": s2Milestone, "s2-top10": s2Top10, "s2-bottom10": s2Bottom10,
    "s3-7days": s3_7days, "s3-dow": s3Dow, "s3-payment": s3Payment,
    "s4-intro": s4Intro, "s4-crossover": s4Crossover, "s4-bands": s4Bands,
    "s5-monthly": s5Monthly, "s5-boxplot": s5Boxplot, "s5-ebbflow": s5EbbFlow, "s5-wave": s5Wave,
    "s6-sankranti": s6Sankranti, "s6-towers": s6Towers, "s6-split": s6Towers,
    "s7-visitor": s7Visitor,
    "s8-intro": s8Intro, "s8-trend": s8Trend, "s8-who": s8Who,
    "s8-ci": ()=>s8CI99(), "s8-heatmap": s8Heatmap,
    "s9-curious": s9Curious, "s9-patterns": s9Patterns, "s9-hypothesis": s9Hypothesis
  };

  // Sub-step aware chart functions (support update without full re-render)
  const substepCharts = {
    "s1-calendar": s1Calendar,
    "s1-glance": s1Glance,
    "s2-milestone": s2Milestone,
    "s4-bands": s4Bands,
    "s3-7days": s3_7days,
    "s3-dow": s3Dow,
    "s3-payment": s3Payment,
    "s4-crossover": s4Crossover,
    "s5-monthly": s5Monthly,
    "s5-boxplot": s5Boxplot,
    "s5-wave": s5Wave,
    "s6-sankranti": s6Sankranti,
    "s6-towers": s6Towers,
    "s7-visitor": s7Visitor,
    "s8-trend": s8Trend,
    "s8-ci": s8CI99,
    "s8-heatmap": s8Heatmap,
    "s9-curious": s9Curious,
    "s9-hypothesis": s9Hypothesis
  };

  function render(chartKey, substep) {
    const fn = registry[chartKey];
    if (fn) {
      if (substepCharts[chartKey]) {
        fn(substep || 0);
      } else {
        fn();
      }
    } else {
      clear();
      const {w,h} = getDims();
      d3.select("#chart-svg-wrapper").append("svg").attr("viewBox",`0 0 ${w} ${h}`)
        .append("text").attr("x",w/2).attr("y",h/2).attr("text-anchor","middle").attr("fill","#666").text("Chart: "+chartKey);
    }
  }

  function update(chartKey, substep, direction) {
    // For sub-step updates, re-render with the new substep value.
    // This is simpler than mutating existing SVG and works reliably.
    const fn = substepCharts[chartKey];
    if (fn) {
      fn(substep);
    } else {
      render(chartKey, substep);
    }
  }

  return { render, update, clear };
})();
