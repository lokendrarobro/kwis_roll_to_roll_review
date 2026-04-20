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

const createMapViewPdf = async (robro_roll_id, logo, userName,version, customer_roll_id, start_range, end_range, total_defect_count, page_num, defect_status_filter, defect_type_filter,inspected_length,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd) => {
    try {
        const browser = await puppeteer.launch({
            // headless: "new", // Ensures smooth rendering
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        // console.log(browser)

        const page = await browser.newPage();

        const footerLogo = getBase64Image(
            path.resolve(__dirname, "robro_logo.png")
        );

        let defectPositionsQuery = `
            SELECT defect_top_left_y_mm, defect_top_left_x_mm, defect_width_mm, defect_height_mm, defect_type
            FROM kwis_defects_log
            WHERE robro_roll_id = ?
            AND defect_top_left_y_mm >= ${start_range * 1000}
            `;
        if(inspected_length > end_range) {
            defectPositionsQuery += ` AND defect_top_left_y_mm <= ${end_range * 1000}`;
        }
        if (xLocationStart !== null && xLocationStart !== '') {
            defectPositionsQuery += ` AND defect_top_left_x_mm >= ${xLocationStart}`;
        }

        if (xLocationEnd !== null && xLocationEnd !== '') {
            defectPositionsQuery += ` AND defect_top_left_x_mm <= ${xLocationEnd}`;
        }

        if (yLocationStart !== null && yLocationStart !== '') {
            defectPositionsQuery += ` AND defect_top_left_y_mm >= ${yLocationStart}`;
        }

        if (yLocationEnd !== null && yLocationEnd !== '') {
            defectPositionsQuery += ` AND defect_top_left_y_mm <= ${yLocationEnd}`;
        }


        if (defect_status_filter.length === 0) {
            defectPositionsQuery += ` AND delete_status = 0 `;
        }

        if (defect_type_filter.length > 0) {
            const likeClauses = defect_type_filter.map(type => `defect_type LIKE '${type}%'`);
            defectPositionsQuery += ` AND (${likeClauses.join(' OR ')})`;
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
            if (checkArray.length > 0) {
                defectPositionsQuery += " AND (" + checkArray.map(val => filterGroups[val]).join(" OR ") + ")";
            }
        }

        defectPositionsQuery += ` ORDER BY defect_top_left_y_mm ASC`;
        await db.addQuery("defectPositionsQuery", defectPositionsQuery);

        const defectPositionsResult = await db.runQuery("defectPositionsQuery", [robro_roll_id]);

        if(defectPositionsResult.data.length === 0){
            await browser.close();
            return {
                success: false,
                message: "No defects found for the given criteria.",
            };
        }
        const data = defectPositionsResult.data.sort((a, b) => a.defect_top_left_y_mm - b.defect_top_left_y_mm);
        end_range = data[data.length - 1].defect_top_left_y_mm / 1000;

        const defectSql = `SELECT DISTINCT SUBSTRING_INDEX(defect_type, ' ', 1) AS defect_type FROM kwis_defects_log WHERE robro_roll_id = ?;`
        await db.addQuery("defectsql", defectSql);
        const defectTypeResult = await db.runQuery("defectsql", [robro_roll_id])
        const defectInfo = defectTypeResult.data
        const Colors = await defectController.getColours('backend');

        const sql = `SELECT * FROM kvp_system_configuration WHERE component_name = ?`;
        const value = ["critical_defect_config"];

        await db.addQuery("getSystemConfiguration", sql);
        const result = await db.runQuery("getSystemConfiguration", value);
        // console.log(result)
        const configuration_data = result.data[0] ? result.data[0].configuration_data : null;

        const criticalDefectData = configuration_data.critical_defects ? (configuration_data.critical_defects) : null;
        // defectInfo.forEach((element,index) => {
        //     defectInfo[index]['colour_code'] = Colors[index].colour_code
        // });

        const configuredColors = new Set();
        (criticalDefectData || []).forEach(d => {
            if (d.color) configuredColors.add(d.color.toLowerCase());
        });
        // Filter out configured colors from the available pool of fallback colors
        const availableFallbackColors = (Colors || [])
            .map(c => c.colour_code)
            .filter(c => c && !configuredColors.has(c.toLowerCase()));

        let fallbackColorIndex = 0;
        defectInfo.map((data, index) => {
            let color = '';
            const configMatch = criticalDefectData.find(d => d.defect_type_name.toLowerCase() === data.defect_type.toLowerCase());

            if (configMatch && configMatch.color) {
                color = configMatch.color;
            } else {
                color = availableFallbackColors[fallbackColorIndex] || '#CCCCCC';
                fallbackColorIndex++;
            }

            defectInfo[index]['colour_code'] = color;
        });

        let scatterData = [];
        defectPositionsResult.data &&
            (defectPositionsResult.data).map(item => {
                const cleanedDefectType = item.defect_type.split(' ')[0];
                const index = defectInfo.findIndex(obj => obj.defect_type === cleanedDefectType);
                const data = {
                                x: item.defect_top_left_x_mm / 1000,
                                y: ((item.defect_top_left_y_mm / 1000 - start_range)),
                                size: item.defect_height_mm * item.defect_width_mm,
                                color: defectInfo[index].colour_code,
                                type: item.defect_type
                            }
                scatterData.push(data);
            });


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
        let logoBase64 = '';
        if (logo) {
            const logoBuffer = Buffer.from(logo.data);
            const mimeType = mime.lookup(logo.originalname) || 'image/png'; // fallback to png if unknown
            logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
            // Use logoBase64 wherever required
        }

        const y_range =  (end_range - start_range).toFixed(1)
        // The HTML content for the PDF
        const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Roll Master PDF</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
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
                padding: 0px 10px;
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
    
            .p-10 {
                padding: 10px;
            }
    
            .bg-white {
                background-color: #fff;
            }
    
            .rounded {
                border-radius: 10px;
            }
    
            main {
                position: relative;
                width: 210mm;
                height: 297mm;
    
            }
    
            @media print {
                footer {
                    position: fixed;
                    bottom: 0;
                    width: 210mm;
                    background-color: #073070;
                    text-align: center;
                }
            }
    
            .footer {
                display: block;
                width: 98.3%;
                background-color: #073070;
                color: #fff;
                padding: 5px;
                max-height: 25px;
                text-align: center;
    
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
    
            .between {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
    
            .flex-col {
                flex-direction: column;
            }
    
            @page {
                size: A4;
                margin-top: 0px;
                margin-bottom: 0px;
            }
    
    
            .chartcontainer {
                width: 97%;
                height: auto;
                max-height: 180mm;
                margin-top: 10px;
                margin-bottom: 10px;
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
    
            .ChartDefectList {
                width: 100%;
                max-height: 650px;
                display: flex;
                align-items: start;
                flex-direction: column;
                flex-wrap: wrap;
                gap: 5px;
            }
    
            .ChartDefectItem {
                flex-basis: 45%;
                display: flex;
                align-items: center;
                gap: 5px;
                margin-bottom: 8px;
                margin-left: 8px;
            }
    
            .ChartDefectItem span {
                display: block;
                width: 15px;
                height: 15px;
                border-radius: 50%;
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
    
            .logoContainer img {
                width: 100%;
                height: 45px;
                object-fit: contain;
            }
    
            .footerLogo {
                width: 70px;
                height: 23px;
            }
    
            .footerLogo img {
                width: 100%;
                height: auto;
                object-fit: contain;
            }
    
            .text-right {
                text-align: right;
            }
    
            .flex {
                display: flex;
                align-items: center;
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
                        <p class="m-0"><b>${customer_roll_id}</b></p>
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
                <div class="chartcontainer bg-white rounded p-10">
                    <h4 class="p-10 m-0">Scatter Plot for Defects</h4>
                    <canvas id="scatterChart" width="700" height="900"></canvas>
                   <script>
                      const scatterData = ${JSON.stringify(scatterData)};

                        const ctx = document.getElementById('scatterChart').getContext('2d');
                        new Chart(ctx, {
                        type: 'scatter',
                        data: {
                            datasets: scatterData.map(item => ({
                                // label: "Defect ID: " + item.id,  <-- REMOVED
                                data: [{ x: item.x, y: item.y }],
                                backgroundColor: item.color,
                                 pointRadius: item.size <= 20000 ? 3 : item.size <= 40000 ? 4 : item.size <= 60000 ? 5 : item.size <= 80000 ? 6 : item.size <= 200000 ? 13 : 18
                            }))
                        },
                        options: {
                            animation: false,
                            responsive: false,
                            plugins: {
                                legend: { display: false },  // Hide legend
                                tooltip: { enabled: false }  // Hide tooltips on hover
                            },
                            scales: {
                                x: {position: 'top', title: { display: true, text: 'Fabric Width(m)' } },
                              y: {
  reverse: true,
  title: { display: true, text: 'Fabric Length (m)' },
  min: 0,
  max: ${(y_range)},
  ticks: {
    callback: function(value) {
      return (value) + ${start_range}; // Displays correct meter labels
    }
  }
}
                                
                            }
                        }
                      });
                    </script>
                </div>
            </section>
            <footer>
                <span class="footer">
                    <div class="between">
                        <div class="center">
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
                        <p style="color: #fff; font-weight: 700; margin: 0;">Page :<span>${page_num}</span> </p>
                    </div>
                </span>
            </footer>
        </main>
    </body>
    
    </html>
    
    `;

        // Set the page content to the HTML
        await page.setContent(htmlContent);

        const pdfContent = await page.pdf({
            format: "A4",
            printBackground: true, // Print background graphics
        });

        // Close the browser
        await browser.close();
        // Return the PDF content as Buffer
        return {
            success: true,
            content: pdfContent,
            number_of_defects: defectPositionsResult.data.length
        };
    } catch (err) {
        console.error("Error generating PDF:", err);
        return {
            success: false,
            message: "Error generating PDF",
        };
    }
};

module.exports = createMapViewPdf;
