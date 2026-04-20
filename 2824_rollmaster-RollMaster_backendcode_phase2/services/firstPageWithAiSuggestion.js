const db = require("../connection/dbConnection.js");
const defectController = require("../controllers/defectController.js");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { createCanvas } = require('canvas');
const mime = require('mime-types');

function getBase64Image(imgPath) {
  try {
    // Check if the file exists at the given path
    if (!fs.existsSync(imgPath)) {
      return '';  // Return empty string if file doesn't exist
    }

    // If the file exists, read the file and convert to base64
    const bitmap = fs.readFileSync(imgPath);
    return Buffer.from(bitmap).toString("base64");
  } catch (error) {
    console.error(`Error reading the file at ${imgPath}:`, error);
    return '';  // Return empty string if there's an error
  }
}

const firstPagePdf = async (robro_roll_id, logo, userName, version, total_data_count,defect_type_filter,defect_status_filter,location_filter,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd,slittingData) => {
  try {

    const getRollSql = `SELECT
                          rl.robro_roll_id,
                          rl.machine_id,
                          rl.roll_start_time,
                          rl.roll_end_time,
                          rl.inspected_length,
                          rl.roll_length,
                          rl.gsm,
                          rl.width,
                          rl.current_repair_meter,
                          rl.customer_roll_id,
                          rl.roll_status,
                          rl.quality_code,
                          rl.note,
                          COALESCE(dl.defect_count, 0) AS defect_count,

                          CASE
                              WHEN COALESCE(dl.defect_count, 0) > 0 AND rl.inspected_length > 0
                              THEN 1000 / (100 / (rl.inspected_length / COALESCE(dl.defect_count, 0)))
                              ELSE NULL
                          END AS score,

                          CASE
                              WHEN COALESCE(dl.defect_count, 0) > 0 AND rl.inspected_length > 0
                              THEN (rl.inspected_length / COALESCE(dl.defect_count, 0))
                              ELSE NULL
                          END AS avg_defect_distance,

                          GROUP_CONCAT(DISTINCT cti.tag_name ORDER BY cti.tag_name SEPARATOR ', ') AS tag_names,

                          GROUP_CONCAT(DISTINCT kjl.recipe ORDER BY kjl.recipe SEPARATOR ', ') AS recipes,

                          MIN(krmi.loom_id) AS first_loom_id

                      FROM
                          kwis_rolls_log AS rl

                      LEFT JOIN (
                          SELECT robro_roll_id, COUNT(*) AS defect_count
                          FROM kwis_defects_log
                          WHERE delete_status = 0
                          GROUP BY robro_roll_id
                      ) AS dl ON rl.robro_roll_id = dl.robro_roll_id

                      LEFT JOIN kwis_tag_settings AS ts ON rl.robro_roll_id = ts.robro_roll_id
                      LEFT JOIN kwis_custom_user_tag_info AS cti ON ts.user_tag_id = cti.user_tag_id
                      LEFT JOIN kwis_jobs_log AS kjl ON rl.robro_roll_id = kjl.robro_roll_id
                      LEFT JOIN kwis_roll_manufacturing_info AS krmi ON kjl.robro_roll_id = krmi.robro_roll_id

                      WHERE
                          rl.robro_roll_id = ?

                      GROUP BY
                          rl.robro_roll_id,
                          rl.machine_id,
                          rl.roll_start_time,
                          rl.roll_end_time,
                          rl.inspected_length,
                          rl.gsm,
                          rl.width,
                          rl.current_repair_meter,
                          rl.customer_roll_id,
                          rl.roll_status,
                          rl.quality_code,
                          dl.defect_count
                      `;
    await db.addQuery("getRollSql", getRollSql);
    const params = [robro_roll_id];

    const getRollResult = await db.runQuery("getRollSql", params);

    if (!getRollResult.success) {
      // return res.status(400).json({ status: false, error: getRollResult.error });
    }
    const rollDetails = getRollResult.data[0];
    const Colors = await defectController.getColours('backend');

        const sql = `SELECT * FROM kvp_system_configuration WHERE component_name = ?`;
    const value = ["critical_defect_config"];

    await db.addQuery("getSystemConfiguration", sql);
    const result = await db.runQuery("getSystemConfiguration", value);
    // console.log(result)
    const configuration_data = result.data[0] ? result.data[0].configuration_data : null;

    const criticalDefectData = configuration_data.critical_defects ? (configuration_data.critical_defects) : null;

    const browser = await puppeteer.launch({
      // headless: "new", // Ensures smooth rendering
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const maxLineChars = 150;  // Approximate number of characters per line
    const noteLineLimit = location_filter ? 4 : 10;  // Max lines that can fit in the PDF
    const characterLimit = location_filter ? 500 : 1500;
    let isNoteOverflow = false;
    let pageNumber = 0;
    const totalChars = rollDetails.note?.length || 0;

    let simulatedLines = 0;
    if(rollDetails.note?.length > 0) {
    rollDetails.note.split('\n').forEach(line => {
      const linesFromThis = Math.ceil(line.length / maxLineChars);
      simulatedLines += linesFromThis;
    });
  }

    if (totalChars > characterLimit || simulatedLines > noteLineLimit) {
      isNoteOverflow = true;
    }

    const page = await browser.newPage();

    const footerLogo = getBase64Image(
      path.resolve(__dirname, "robro_logo.png")
    );

    let slittingAxisInfo = location_filter ? (slittingData.type == 'x_axis_slitting' ?
              `<tr>
                <td >
                  <b>X Roll Start mm:</b>

                  ${(xLocationStart && xLocationStart !== '') ? xLocationStart :  0}
                </td>
                <td >
                  <b>X Roll End mm:</b>
 
                  ${xLocationEnd && xLocationEnd !== '' ? xLocationEnd : rollDetails.width}
                </td>
              </tr>`:
              `<tr>
                <td >
                  <b>Y Roll Start mm:</b>

                  ${yLocationStart && yLocationStart !== '' ? yLocationStart : 0}
                </td>
                <td >
                  <b>Y Roll End mm:</b>

                  ${yLocationEnd && yLocationEnd !== '' ? yLocationEnd : rollDetails.inspected_length}
                </td>
              </tr>`
    ) : '';

    const slittingDataInfo = location_filter ? 
              `<tr>
                <td >
                  <b>Slitting Type:</b>

                  ${slittingData.type ? slittingData.type : 'Null'}
                </td>
                <td >
                  <b>Child Roll Id:</b>

                  ${slittingData.child_roll_id ? slittingData.child_roll_id : 'Null'}
                </td>
              </tr>${slittingAxisInfo}`: 
              ''
              ;
    const topMargin = location_filter ? 224 : 288;

    let defectSql = `SELECT SUBSTRING_INDEX(defect_type, ' ', 1) AS type, COUNT(*) AS count FROM kwis_defects_log WHERE robro_roll_id = ?`;
    let values = [robro_roll_id];

    if(xLocationStart !== null && xLocationStart !== '')
    {
      defectSql += ` AND defect_top_left_x_mm >= ?`;
      values.push(xLocationStart);
    }

    if(xLocationEnd !== null && xLocationEnd !== '')
    {
      defectSql += ` AND defect_top_left_x_mm <= ?`;
      values.push(xLocationEnd);
    }

    if(yLocationStart !== null && yLocationStart !== '')
    {
      defectSql += ` AND defect_top_left_y_mm >= ?`;
      values.push(yLocationStart);
    }

    if(yLocationEnd !== null && yLocationEnd !== '')
    {
      defectSql += ` AND defect_top_left_y_mm <= ?`;
      values.push(yLocationEnd);
    }

    // Apply same logic as in the main query
    if (defect_status_filter.length === 0) {
      defectSql += ` AND delete_status = 0 `;
    }

    if (defect_type_filter.length > 0) {
      const likeClauses = defect_type_filter.map(type => `defect_type LIKE '${type}%'`);
      defectSql += ` AND (${likeClauses.join(' OR ')})`;
    }

    if (defect_status_filter.length > 0) {
      const filterGroups = {
        deleted: "(delete_status = 1)",
        merged: "(delete_status = 2 AND merge_status = 1)",
        spliced: "(delete_status = 0 AND kwis_defects_log.splice_id IS NOT NULL)",
        repaired: "(delete_status = 0 AND repair_status = 1)",
        suggest_for_deletion: "(delete_status = 0 AND suggest_for_deletion = 1)",
        na: "(delete_status = 0 AND (merge_status = 0 OR merge_status IS NULL) AND (repair_status = 0 OR repair_status IS NULL) AND (splice_id IS NULL OR splice_id = '') AND (suggest_for_deletion = 0 OR suggest_for_deletion IS NULL))",
        enable: "(delete_status = 0 AND is_enabled = 1)",
        disable: "(delete_status = 0 AND is_enabled = 0)"
      };

      const checkArray = Object.keys(filterGroups).filter(val => defect_status_filter.includes(val));
      defectSql += " AND (" + checkArray.map(val => filterGroups[val]).join(" OR ") + ")";
    }

    defectSql += ` GROUP BY type;`;
    await db.addQuery("defectsql", defectSql);
    const defectTypeInfo = await db.runQuery("defectsql", values)

    const configuredColors = new Set();
    (criticalDefectData || []).forEach(d => {
      if (d.color) configuredColors.add(d.color.toLowerCase());
    });

    // Filter out configured colors from the available pool of fallback colors
    const availableFallbackColors = (Colors || [])
      .map(c => c.colour_code)
      .filter(c => c && !configuredColors.has(c.toLowerCase()));

    let fallbackColorIndex = 0;
    let objs = [];
    (defectTypeInfo.data || []).forEach((data, index) => {
      let color = '';
      const configMatch = criticalDefectData.find(d => d.defect_type_name.toLowerCase() === data.type.toLowerCase());

      if (configMatch && configMatch.color) {
        color = configMatch.color;
      } else {
        color = availableFallbackColors[fallbackColorIndex] || '#CCCCCC';
        fallbackColorIndex++;
      }

      objs.push({
        type: data.type,
        count: data.count,
        colour: color
      });
    });

    let sortedChartData = [...objs]; // Create a new array to avoid modifying the original array
    sortedChartData.sort((a, b) => b.count - a.count);
    objs = sortedChartData;
    let defectLabels = [];
    let pieChartPercentages = [];
    let colors = [];
    objs.map((data) => {
      Percentage = ((data.count * 100) / total_data_count).toFixed(2);
      pieChartPercentages.push(Percentage);
      defectLabels.push(data.type)
      colors.push(data.colour)
    })

    let aiSuggestionSql = `
      SELECT SUBSTRING_INDEX(ai_suggestion, ' ', 1) AS ai_suggestion, COUNT(*) AS count 
      FROM kwis_defects_log 
      WHERE robro_roll_id = ?
    `;
    let values1 = [robro_roll_id];
      if(xLocationStart !== null && xLocationStart !== '')
    {
      aiSuggestionSql += ` AND defect_top_left_x_mm >= ?`;
      values1.push(xLocationStart);
    }

    if(xLocationEnd !== null && xLocationEnd !== '')
    {
      aiSuggestionSql += ` AND defect_top_left_x_mm <= ?`;
      values1.push(xLocationEnd);
    }

    if(yLocationStart !== null && yLocationStart !== '')
    {
      aiSuggestionSql += ` AND defect_top_left_y_mm >= ?`;
      values1.push(yLocationStart);
    }

    if(yLocationEnd !== null && yLocationEnd !== '')
    {
      aiSuggestionSql += ` AND defect_top_left_y_mm <= ?`;
      values1.push(yLocationEnd);
    }

    // Apply delete_status = 0 only when no other defect_status_filter is provided
    if (defect_status_filter.length === 0) {
      aiSuggestionSql += ` AND delete_status = 0 `;
    }

    // Apply defect_type filters
    if (defect_type_filter.length > 0) {
      const likeClauses = defect_type_filter.map(type => `defect_type LIKE '${type}%'`);
      aiSuggestionSql += ` AND (${likeClauses.join(' OR ')})`;
    }

    // Apply defect_status filters
    if (defect_status_filter.length > 0) {
      const filterGroups = {
        deleted: "(delete_status = 1)",
        merged: "(delete_status = 2 AND merge_status = 1)",
        spliced: "(delete_status = 0 AND kwis_defects_log.splice_id IS NOT NULL)",
        repaired: "(delete_status = 0 AND repair_status = 1)",
        suggest_for_deletion: "(delete_status = 0 AND suggest_for_deletion = 1)",
        na: `(delete_status = 0 
          AND (merge_status = 0 OR merge_status IS NULL) 
          AND (repair_status = 0 OR repair_status IS NULL) 
          AND (splice_id IS NULL OR splice_id = '') 
          AND (suggest_for_deletion = 0 OR suggest_for_deletion IS NULL))`,
        enable: "(delete_status = 0 AND is_enabled = 1)",
        disable: "(delete_status = 0 AND is_enabled = 0)"
      };

      const checkArray = Object.keys(filterGroups).filter(val => defect_status_filter.includes(val));
      if (checkArray.length > 0) {
        aiSuggestionSql += " AND (" + checkArray.map(val => filterGroups[val]).join(" OR ") + ")";
      }
    }

    aiSuggestionSql += ` GROUP BY ai_suggestion;`;
    await db.addQuery("aiSuggestionSql", aiSuggestionSql);
    const aiSuggestionInfo = await db.runQuery("aiSuggestionSql", values1);

    let aiSuggestionobjs = aiSuggestionInfo.data.map((data, index) => ({
      ai_suggestion: data.ai_suggestion,
      count: data.count,
      colour: Colors[index].colour_code
    }));
    let aiSugeestionSortedChartData = [...aiSuggestionobjs]; // Create a new array to avoid modifying the original array
    aiSugeestionSortedChartData.sort((a, b) => b.count - a.count);
    aiSuggestionobjs = aiSugeestionSortedChartData;
    let aiSuggestionLabels = [];
    let pieChartPercentages1 = [];
    let colors1 = [];
    aiSuggestionobjs.map((data) => {
      Percentage = ((data.count * 100) / total_data_count).toFixed(2);
      pieChartPercentages1.push(Percentage);
      aiSuggestionLabels.push(data.ai_suggestion)
      colors1.push(data.colour)
    })

    const date = new Date();  // Current date and time in your local system time zone

    // Get the UTC time in milliseconds
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000); // Convert local time to UTC

    // IST offset is +5 hours 30 minutes (19800000 milliseconds)
    const istOffset = 5.5 * 60 * 60 * 1000;

    // Convert UTC time to IST
    const istTime = new Date(utcTime + istOffset);

    // Extract the date and time in IST
    const istDate = istTime.toISOString().split('T')[0];  // YYYY-MM-DD format
    const istTimeString = istTime.toTimeString().split(' ')[0];  // HH:mm:ss format
    let canvas;
    let canvas1;
    if (!isNoteOverflow) {
      pageNumber = 1;
      canvas = createCanvas(300, 300);
      const ctx = canvas.getContext('2d');

      let startAngle = 0;
      objs.forEach((value, index) => {
        const sliceAngle = (pieChartPercentages[index] / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle); // Center (150,150), Radius 100
        ctx.lineTo(150, 150);
        ctx.fillStyle = value.colour;
        ctx.fill();
        startAngle += sliceAngle;
      });

      // Canvas setup
      canvas1 = createCanvas(300, 300);
      const ctx1 = canvas1.getContext('2d');
      // Draw pie chart
      let startAngle1 = 0;
      aiSuggestionobjs.forEach((value, index) => {
        const sliceAngle1 = (pieChartPercentages1[index] / 100) * Math.PI * 2;
        ctx1.beginPath();
        ctx1.arc(150, 150, 100, startAngle1, startAngle1 + sliceAngle1);
        ctx1.lineTo(150, 150);
        ctx1.fillStyle = value.colour;
        ctx1.fill();
        startAngle1 += sliceAngle1;
      });
    }
    else {
      pageNumber = 2;
      canvas = createCanvas(400, 400);
      const ctx = canvas.getContext('2d');

      // Draw pie chart
      let startAngle = 0;
      objs.forEach((value, index) => {
        const sliceAngle = (pieChartPercentages[index] / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(200, 200, 150, startAngle, startAngle + sliceAngle);
        ctx.lineTo(200, 200);
        ctx.fillStyle = value.colour;
        ctx.fill();
        startAngle += sliceAngle;
      });

      // Canvas setup
      canvas1 = createCanvas(400, 400);
      const ctx1 = canvas1.getContext('2d');
      // Draw pie chart
      let startAngle1 = 0;
      aiSuggestionobjs.forEach((value, index) => {
        const sliceAngle1 = (pieChartPercentages1[index] / 100) * Math.PI * 2;
        ctx1.beginPath();
        ctx1.arc(200, 200, 150, startAngle1, startAngle1 + sliceAngle1);
        ctx1.lineTo(200, 200);
        ctx1.fillStyle = value.colour;
        ctx1.fill();
        startAngle1 += sliceAngle1;
      });
    }


    // Convert the canvas to an image buffer
    const chartBuffer = canvas.toBuffer();
    let PiechartData = objs.map((defect, index) => {
      if (pieChartPercentages[index] > 0) {
        return `
          <div class="ChartDefectItem">
            <span style="background-color:${defect.colour}"></span>
            <div class="font-semibold">${objs[index].count}</div>
            <div class="legend-text" title="${defect.type}">${defect.type}</div>
          </div>
        `;
      }
    }).join('');

    const pieChartPercentageslength = pieChartPercentages.filter(value => value > 0).length;
    let PiechartDataContainer;
    const height = isNoteOverflow ? '400' : '300';
    if (pieChartPercentageslength > 10) {
      PiechartDataContainer = ` 
      <div class="chart-container">
          <img src="data:image/png;base64,${chartBuffer.toString('base64')}" alt="Pie Chart" width = "100%"/>
          <div class="ChartDefectList" style="max-height:${height-100}px">
            ${PiechartData}
          </div>
        </div>`
    }
    else {
       if(pieChartPercentageslength === 0) {
        PiechartDataContainer = ` 
         <div class="chart-container_2">
            <div class="ChartDefectList_2 flex items-center justify-center" style="min-height: ${height}px;">
              <span class="font-bold pt-2 leading-6 text-black text-center font-semibold uppercase-text w-full">
                No Defects Found
              </span>
            </div>
          </div>`
      }
      else
      {
        PiechartDataContainer = ` 
        <div class="chart-container_2">
            <img src="data:image/png;base64,${chartBuffer.toString('base64')}" alt="Pie Chart"/>
            <div class="ChartDefectList_2" style="max-height:${height - 100}px">
              ${PiechartData}
            </div>
          </div>
        </div>`
      }
    }


    const chartBuffer1 = canvas1.toBuffer();
    let AiSuggestionData = aiSuggestionobjs.map((data, index) => {
      let ai_suggestion = ''
      if (data.ai_suggestion === null || data.ai_suggestion === "null" || data.ai_suggestion === '')
        ai_suggestion = "Non Suggested";
      else
        ai_suggestion = data.ai_suggestion
      if (pieChartPercentages1[index] > 0) {
        return `
          <div class="ChartDefectItem">
            <span style="background-color:${data.colour}"></span>
            <div class="font-semibold">${aiSuggestionobjs[index].count}</div>
            <div class="legend-text" title="${ai_suggestion}">${ai_suggestion}</div>
          </div>
        `;
      }
    }).join('');

    const pieChartPercentageslength1 = pieChartPercentages1.filter(value => value > 0).length;
    let PiechartDataContainer1;
    const height1 = isNoteOverflow ? '400' : '300';
    if (pieChartPercentageslength1 > 10) {
      PiechartDataContainer1 = ` 
      <div class="chart-container">
          <img src="data:image/png;base64,${chartBuffer1.toString('base64')}" alt="Pie Chart" width = "100%"/>
          <div class="ChartDefectList" style="max-height:${height1-100}px">
            ${AiSuggestionData}
          </div>
        </div>`
    }
    else {
       if(pieChartPercentageslength1 === 0) {
          PiechartDataContainer1 = ` 
          <div class="chart-container_2">
              <div class="ChartDefectList_2 flex items-center justify-center" style="min-height: ${height1}px;">
                <span class="font-bold pt-2 leading-6 text-black text-center font-semibold uppercase-text w-full">
                  No Defects Found
                </span>
              </div>
            </div>`
      }
      else
      {
        PiechartDataContainer1 = ` 
        <div class="chart-container_2">
            <img src="data:image/png;base64,${chartBuffer1.toString('base64')}" alt="Pie Chart"/>
            <div class="ChartDefectList_2" style="max-height:${height1-100}px">
              ${AiSuggestionData}
            </div>
          </div>
        </div>`
      }
    }
    let logoBase64 = '';
    if (logo) {
      const logoBuffer = Buffer.from(logo.data);
      const mimeType = mime.lookup(logo.originalname) || 'image/png'; // fallback to png if unknown
      logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      // Use logoBase64 wherever required
    }


    const sectionData = isNoteOverflow ? `
      <div class="chartcontainer1 bg-white rounded p-10">
         <h4 class="p-5 m-0">Defects Distribution</h4>
          ${PiechartDataContainer}
      </div> 
      </section>
      <footer style="margin-top:${topMargin}px;">
      <span class="footer">
           <div class="between">
             <div class="center" >
               <span class="footerLogo">
                 <img src="data:image/png;base64,${footerLogo}" alt="Robro Icon">
               </span>
               <span style="font-weight:600; margin-left:15px;"> 
                 <b>KWIS</b>: ${version}
               </span>
              
             </div>
             <span>
                <b>Generated by:</b> 
                <span style="font-weight:600;">${userName}</span> on 
                <span style="font-weight:600;">${istDate}</span>
              </span>
                <p style="color: #fff; font-weight: 700; margin: 0;">Page :<span>1</span> </p>
           </div>
         </span>
       </footer>
      <div style="page-break-before: always;"></div>
                <header>
                    <div class="headerSection">
                        <!-- As a logo we take an SVG element and add the name in an standard H1 element behind it. -->
                        <div class="logoAndName">
                            <span class="logoContainer">
                                <img src="${logoBase64}" alt="Robro Icon">
                            </span>
                            </span>

                        </div>
                        <div class="center-3 flex-col">
                            <h2 class="m-0">KWIS INSPECTION REPORT</h2>
                            <p class="m-0"><b>${rollDetails.customer_roll_id}</b></p>
                        </div>

                        <!-- Details about the estimation are on the right top side of each page. -->
                        <div class="center-2 flex-col">
                            <p class="m-0"><b>Generated Date:</b></p>
                            <p class="m-0 text-right"><span>${istDate}</span> ${istTimeString}</p>
                        </div>
                    </div>
                    <!-- The two header rows are divided by an blue line, we use the HR element for this. -->
                    <hr />
                </header>
                <section>
      <div class="chartcontainer1 bg-white rounded p-10">
         <h4 class="p-5 m-0">AI Suggestion Distribution</h4>
           ${PiechartDataContainer1}
      </div> 
       </div> 
       <div class="notesection bg-white rounded px-10" style="height:548.5px;">
         <span class="p-0 m-0 font-semibold">Notes</span>
         <p class="m-0" style="padding-left:25px; padding-top:0px;">${rollDetails.note}</p>
       </div>
       </section>
        <footer>
      <span class="footer">
           <div class="between">
             <div class="center" >
               <span class="footerLogo">
                 <img src="data:image/png;base64,${footerLogo}" alt="Robro Icon">
               </span>
               <span style="font-weight:600; margin-left:15px;"> 
                 <b>KWIS</b>: ${version}
               </span>
              
             </div>
             <span>
                <b>Generated by:</b> 
                <span style="font-weight:600;">${userName}</span> on 
                <span style="font-weight:600;">${istDate}</span>
              </span>
                <p style="color: #fff; font-weight: 700; margin: 0;">Page :<span>2</span> </p>
           </div>
         </span>
       </footer>
    ` :
      `
    <div class="chartcontainer bg-white rounded p-10">
         <h4 class="p-5 m-0">Defects Distribution</h4>
          ${PiechartDataContainer}
      </div> 
      <div class="chartcontainer bg-white rounded p-10">
         <h4 class="p-5 m-0">AI Suggestion Distribution</h4>
           ${PiechartDataContainer1}
      </div> 
       </div> 
       <div class="notesection bg-white rounded px-10">
         <span class="p-0 m-0 font-semibold">Notes</span>
         <p class="m-0" style="padding-left:25px; padding-top:0px;">${rollDetails.note}</p>
       </div>
       <footer style="position:fixed;">
      <span class="footer">
           <div class="between">
             <div class="center" >
               <span class="footerLogo">
                 <img src="data:image/png;base64,${footerLogo}" alt="Robro Icon">
               </span>
               <span style="font-weight:600; margin-left:15px;"> 
                 <b>KWIS</b>: ${version}
               </span>
              
             </div>
             <span>
                <b>Generated by:</b> 
                <span style="font-weight:600;">${userName}</span> on 
                <span style="font-weight:600;">${istDate}</span>
              </span>
                <p style="color: #fff; font-weight: 700; margin: 0;">Page :<span>1</span> </p>
           </div>
         </span>
       </footer>
    `;

    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Roll Master PDF</title>


    <style>
    @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap");

    body {
      margin: 0;
      padding: 0cm;
      color: var(--font-color);
      font-family: "Montserrat", sans-serif;
      font-size: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    @media print {
      header {
        background-color: #073070;
        color: #fff;
        padding: 10px;
      }
    }

    header {
      background-color: #073070 !important;
      color: #fff !important;
      padding: 10px !important;
     
    }

    header .headerSection {
      display: flex;
      justify-content: space-between;
      padding:0px 10px;
    }

    header .logoAndName {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    @page {
      size: A4;
      margin-top: 50px;
      margin-bottom: 50px;
    }

        /*
    The SVG gets set to a fixed size and get 5mm margin right to keep some distance
    to the company name.
    */
    header .logoAndName span {
      width: 1.5cm;
      height: 1.5cm;
      margin-right: 0.5cm;
    }

    section {
      background-color: #f4f4f4;
    }

    .m-0 {
      margin: 0;
    }

    .RollDetailsSection.grid-container {
      display: grid;
      grid-template-columns: 100%;
    }

    .p-10 {
      padding: 10px;
    }

    .bg-white {
      background-color: #fff;
    }

    .rounded {
      border-radius: 10px;
    }

    .borderStyle {
      border-left: 4px solid #073070;
      padding-left: 10px;
    }


    .borderStyle p{
      font-weight: 700;  
      margin-bottom: 3px;
    }

    .w-100{
      width: 100%;
    }

    main {
      position: relative;
      width: 210mm;
      height: 297mm;

    }

    @media print {
      footer {
        bottom: 0;
        width: 210mm;
        background-color: #073070;
        text-align: center;
      }
    }
        .footer{
        display:block;
        width: 98.3%;
        background-color:#073070;
        color: #fff;
        padding:5px;
        max-height:25px;
        text-align: center;
            
    }

    table thead th {
      border-right: 2px solid white;
      padding: 5px;
      font-size: 10px;
    }
     table{
     border-spacing:0px;
     }
    .RollInfoTable  table tr td {
     border: 1px solid rgb(32, 32, 32);
     padding:10px;
     font-weight: 600;
    } 
   
    .border{
        border: 1px solid lightgray;
    }

    .center {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .center-2 {
    display: flex;
    gap: 5px;
    justify-content: center;
    }
    .center-3 {
    display: flex;
    gap: 5px;
    align-items: center;
    justify-content: center;
    }
      .between{
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .flex-col{
    flex-direction:column;
    }
    @page {
      size: A4;
      margin-top:0px;
      margin-bottom:0px;
    }

    
    .chartcontainer {
      width: 97%;
      height:auto;
      max-height: 70mm;
      margin-top: 5px;
      margin-bottom: 5px;
      padding-bottom: 10px;
    }

    .chartcontainer1 {
      width: 97%;
      height:auto;
      max-height: 250mm;
      margin-top: 10px;
      margin-bottom: 10px;
      padding-bottom: 10px;
    }


    .notesection {
    width:99.5%;
    white-space: pre-wrap;
    break-inside:180mm;
    page-break-inside:avoid;
    }

    .chart-container {
      width: 100%;
      display: grid;
      grid-template-columns: 30% 70%;
      justify-content: center;
      align-items: center;
    }

    .chart-container_2 {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
    }

    .font-semibold {
      font-weight: 700;
    }

    .ChartDefectList {
      width: 100%;
      max-height: 650px;
      display: flex;
      align-items: start;
      flex-direction: column;
      flex-wrap: wrap;
      gap: 5px;
    }

    .ChartDefectItem_2 {
      flex-basis: 100%;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 8px;
      margin-left: 8px;
    }

    .ChartDefectItem_2 span {
      display: block;
      width: 15px;
      height: 15px;
      border-radius: 50%;
    }
   .logoContainer img{
    width: 100%;
    height: 45px;
    object-fit: contain;
   }
    .gap-10{
    gap:10px;
    }
   .footerLogo{
     width: 70px;
     height:23px;
   }
    .footerLogo img{
     width: 100%;
     height:auto;
     object-fit:contain;
   }
     
     .text-right{text-align:right;}
     .flex{
        display: flex;
        align-items: center;
     }

     .ChartDefectItem {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .ChartDefectItem span {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .legend-text {
        max-width: 70px;          /* fix width */
        white-space: nowrap;       /* no line breaks */
        overflow: hidden;          /* hide extra text */
        text-overflow: ellipsis;   /* show “...” */
        font-size: 12px;
        color: #333;
      }
      
  </style>
  </head>

  <body>
   <main>
    <header>
      <div class="headerSection">
        <!-- As a logo we take an SVG element and add the name in an standard H1 element behind it. -->
        <div class="logoAndName">
        <span class="logoContainer">
        <img src="${logoBase64}" alt="Robro Icon">
    </span>
          </span>

        </div>
         <div class="center-3 flex-col">       
         <h2 class="m-0">KWIS INSPECTION REPORT</h2>   
         <p class="m-0"><b>${rollDetails.customer_roll_id}</b></p>   
        </div>
    
        <!-- Details about the estimation are on the right top side of each page. -->
        <div class="center-2 flex-col">
          <p class="m-0"><b>Generated Date:</b></p>
          <p class="m-0 text-right"><span>${istDate}</span> ${istTimeString}</p>
        </div>
      </div>
      <!-- The two header rows are divided by an blue line, we use the HR element for this. -->
      <hr />
    </header>
    <section >

        

      <div class="RollDetailsSection grid-container bg-white rounded">
        <div class="grid-item p-10 RollInfoTable">
          <h4 class="m-0" style="padding-bottom:5px;">Roll Info</h4>
          <table class="border w-100 ">
            <tbody>
              <tr>
                <td>
                  <b>Machine ID:</b>

                  ${rollDetails.machine_id}
                </td>
                <td >
                  <b>Roll ID:</b>

                  ${rollDetails.customer_roll_id}
                </td>
               
              </tr>
              <tr>
              <td >
                  <b>GSM:</b>

                  ${rollDetails.gsm}
                </td>
                <td >
                  <b>Width:</b>

                  ${(rollDetails.width).toFixed(2)} mm
                </td>
               
</tr>
              <tr>
               <td >
                  <b>Inspected Length:</b>

                  ${(rollDetails.inspected_length).toFixed(2)} meter
                </td>
               <td >
                  <b>Roll Length:</b>
                  ${(rollDetails.roll_length)} meter
                </td>
              </tr>
              <tr>
                <td >
                  <b>Total Defects:</b>

                  ${total_data_count}
                </td>
                <td >
                  <b class> Avg. Defect Distance:</b>

                  ${(rollDetails.avg_defect_distance).toFixed(2)}
                </td>
              </tr>
              <tr>
               <td >
                  <b>Score:</b>
                  ${(rollDetails.score).toFixed(2)}
                </td>
                <td >
                  <b>Roll Status:</b>

                  ${ rollDetails.roll_status === 1
                      ? 'Inspected'
                      : rollDetails.roll_status === 2
                      ? 'Reviewed'
                      : rollDetails.roll_status === 3
                      ? 'Half Repaired'
                      : rollDetails.roll_status === 4
                      ? 'Repaired'
                      : 'NULL'}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Roll Start Time:</b> ${formatDate(rollDetails.roll_start_time)}
                </td>
                <td>
                  <b>Roll End Time:</b> ${formatDate(rollDetails.roll_end_time)}
                </td>
              </tr>
              <tr>
                <td >
                  <b>Recipe:</b>

                  ${rollDetails.recipes}
                </td>
                <td >
                  <b>Quality Code:</b>

                  ${rollDetails.quality_code}
                </td>
              </tr>
              ${slittingDataInfo}
              <tr>
                <td >
                  <b>Loom Number:</b>

                  ${rollDetails.first_loom_id}
                </td>
                <td >
                  
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
      
      ${sectionData}

    </section>
   
  </main>
  </body>
</html>

    `;

    // Set the page content to the HTML
    await page.setContent(htmlContent);

    const pdfContent = await page.pdf({
      format: "A4",
      printBackground: true, // Print background graphics
      timeout: 300000,
      margin: {
        bottom: '100px',   // Add space at the bottom
      },

    });

    // Close the browser
    await browser.close();
    // Return the PDF content as Buffer
    return {
      success: true,
      content: pdfContent,
      customer_roll_id: rollDetails.customer_roll_id,
      pageNumber: pageNumber,
      isNoteOverflow: isNoteOverflow
    };
  } catch (err) {
    console.error("Error generating PDF:", err);
    return {
      success: false,
      message: "Error generating PDF",
    };
  }
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

module.exports = firstPagePdf;
