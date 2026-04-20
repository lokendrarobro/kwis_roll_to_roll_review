const db = require("../connection/dbConnection.js");
const Chart = require("chart.js/auto");   // ✅ Import chart.js
const { createCanvas } = require("canvas");
const defectController = require("../controllers/defectController.js");

const firstSheet = async (workbook, worksheet, robro_roll_id) => {
    try {
        const getRollSql = `SELECT
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
        const rollData = getRollResult.data[0];

        let getdefectforrollid = `SELECT kwis_defects_log.*  FROM kwis_defects_log WHERE robro_roll_id = ? AND delete_status = 0`;
        let defectparams = [robro_roll_id];
        db.addQuery("getdefectforrollid", getdefectforrollid);
        let defects = (await db.runQuery("getdefectforrollid", defectparams)).data || [];

        //for scatter plot data
        let scatterData = [];
        defects.map(defect => {
            scatterData.push({
                x: defect.defect_top_left_x_mm / 1000 || 0,
                y: defect.defect_top_left_y_mm / 1000 || 0,
                defect_type: (defect.defect_type || "").replace(/\s*\d+%$/, "")
            });
        })

        const Colors = await defectController.getColours('backend');

        let defectSql = `SELECT SUBSTRING_INDEX(defect_type, ' ', 1) AS type, COUNT(*) AS count FROM kwis_defects_log WHERE robro_roll_id = ? AND delete_status = 0 GROUP BY type`;
        let values = [robro_roll_id];
        await db.addQuery("defectsql", defectSql);
        const defectTypeInfo = await db.runQuery("defectsql", values)
        let defectColors = {};
        defectTypeInfo.data.map((data, index) => {
            // pieLabels.push(data.type);
            // pieData.push(data.count);
            // pieColors.push(Colors[index].colour_code); // Cycle through colors if more defects than colors
            defectColors[data.type] = Colors[index].colour_code;
        });

        worksheet.mergeCells("A1:C1");
        const headerCell = worksheet.getCell("A1");
        headerCell.value = "Roll Details";
        headerCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } }; // white text
        headerCell.alignment = { horizontal: "center", vertical: "middle" };
        headerCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0f0e5b" }, // background color (blue)
        };
        worksheet.getRow(1).height = 30;
        worksheet.getColumn(1).width = 40; // Column A
        worksheet.getColumn(2).width = 10; // Column B
        worksheet.getColumn(3).width = 30; // Column C

        const headerRow = worksheet.addRow(["Description", "Unit", "Value"]);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
        });

        worksheet.addRow(["Machine ID", "", `${rollData.machine_id || ''}`]);
        worksheet.addRow(["Roll ID", "", `${rollData.customer_roll_id || ''}`]);
        worksheet.addRow(["GSM", "mm", `${rollData.gsm || ''}`]);
        worksheet.addRow(["Width", "mm", `${rollData.width || ''}`]);
        worksheet.addRow(["Inspected Length", "meter", `${rollData.inspected_length || ''}`]);
        worksheet.addRow(["Score", "", `${rollData.score ? rollData.score.toFixed(2) : ''}`]);
        worksheet.addRow(["Total Defects", "", `${rollData.defect_count || '0'}`]);
        worksheet.addRow(["Avg. Defect Distance", "", `${rollData.avg_defect_distance ? rollData.avg_defect_distance.toFixed(2) : ''}`]);
        worksheet.addRow(["Roll Status", "", `${rollData.roll_status === 1
            ? 'Inspected'
            : rollData.roll_status === 2
                ? 'Reviewed'
                : rollData.roll_status === 3
                    ? 'Half Repaired'
                    : rollData.roll_status === 4
                        ? 'Repaired'
                        : 'NULL'}`]);
        worksheet.addRow(["Quality Code", "", `${rollData.quality_code || ''}`]);
        worksheet.addRow(["First Loom ID", "", `${rollData.first_loom_id || ''}`]);
        worksheet.addRow(["Recipe", "", `${rollData.recipes || ''}`]);
        worksheet.addRow(["Roll Start Time", "", `${rollData.roll_start_time ? formatDate(rollData.roll_start_time) : ''}`]);
        worksheet.addRow(["Roll End Time", "", `${rollData.roll_end_time ? formatDate(rollData.roll_end_time) : ''}`]);
        let currentRow = worksheet.lastRow.number;  // ✅ Last row number nikal liya
        worksheet.addRow([]);
        worksheet.addRow([]);
        currentRow++;
        currentRow++;

        // ========== Heading: Scatter Plot (below Pie Chart) ==========
        worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const scatterHeading = worksheet.getCell(`A${currentRow}`);
        scatterHeading.value = "Scatter Plot Data";
        scatterHeading.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } }; // white text
        scatterHeading.alignment = { horizontal: "center", vertical: "middle" };
        scatterHeading.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0f0e5b" }, // background color (blue)
        };
        worksheet.getRow(currentRow).height = 30;
        worksheet.mergeCells(`A${currentRow + 2}:C${currentRow + 37}`);
        worksheet.addRow([]);
        worksheet.addRow([]);
        currentRow++;
        const scatterCanvas = createCanvas(400, 600);
        new Chart(scatterCanvas, {
            type: "scatter",
            data: {
                datasets: [{
                    data: scatterData.map(d => ({ x: d.x, y: d.y })),
                    backgroundColor: scatterData.map(d => defectColors[d.defect_type] || "gray") // ✅ per-point color
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        position: "top",   // ✅ Move X axis to the top
                        title: { display: true, text: "Roll Width (meter)", color: "#000000" },
                        ticks: { color: "#000000" }
                    },
                    y: {
                        reverse: true,  // ✅ Reverse y-axis
                        title: { display: true, text: "Roll Length (meter)", color: "#000000" },
                        ticks: { color: "#000000" }
                    }
                }
            }
        });


        const scatterBuffer = scatterCanvas.toBuffer("image/png");
        const scatterImageId = workbook.addImage({ buffer: scatterBuffer, extension: 'png' });
        worksheet.addImage(scatterImageId, {
            tl: { col: 0.5, row: currentRow }, // Centered between A and C
            ext: { width: 500, height: 700 }
        });
        currentRow += 15;
        return {
            success: true,
            message: "Excel generated successfully with charts",
            data: workbook
        };
    } catch (err) {
        console.error("Error generating Excel:", err);
        return {
            success: false,
            message: "Error generating Excel",
        };
    }
};

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');

    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

module.exports = firstSheet;
