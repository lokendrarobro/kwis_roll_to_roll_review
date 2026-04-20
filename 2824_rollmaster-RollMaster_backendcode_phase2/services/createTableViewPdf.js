const db = require("../connection/dbConnection.js");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
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

const createTableViewPdf = async (robro_roll_id, logo, userName, version, customer_roll_id, pageNumber, defect_type_filter, defect_status_filter, defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd) => {
  try {
    let pageValue = pageNumber;
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const footerLogo = getBase64Image(
      path.resolve(__dirname, "robro_logo.png")
    );

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

    let getdefectforrollid = `SELECT kwis_defects_log.* FROM kwis_defects_log WHERE robro_roll_id = ?`;
    let defectparams = [robro_roll_id];


     if(xLocationStart !== null && xLocationStart !== '')
    {
      getdefectforrollid += ` AND defect_top_left_x_mm >= ?`;
      defectparams.push(xLocationStart);
    }

    if(xLocationEnd !== null && xLocationEnd !== '')
    {
      getdefectforrollid += ` AND defect_top_left_x_mm <= ?`;
      defectparams.push(xLocationEnd);
    }

    if(yLocationStart !== null && yLocationStart !== '')
    {
      getdefectforrollid += ` AND defect_top_left_y_mm >= ?`;
      defectparams.push(yLocationStart);
    }

    if(yLocationEnd !== null && yLocationEnd !== '')
    {
      getdefectforrollid += ` AND defect_top_left_y_mm <= ?`;
      defectparams.push(yLocationEnd);
    }
    
    if (defect_type_filter && Array.isArray(defect_type_filter) && defect_type_filter.length > 0) {
      getdefectforrollid += " AND (";
      for (let i = 0; i < defect_type_filter.length; i++) {
        if (i > 0) {
          getdefectforrollid += " OR ";
        }
        getdefectforrollid += "kwis_defects_log.defect_type LIKE ?";
        defectparams.push(`${defect_type_filter[i]}%`);
      }
      getdefectforrollid += ")";
    }

    let defects = [];

    if (defect_status_filter.length) {
      const filterGroups = {
        deleted: "delete_status = 1",
        merged: "(delete_status = 2 AND merge_status = 1)",
        spliced: "(delete_status = 0 AND kwis_defects_log.splice_id IS NOT NULL)",
        repaired: "(delete_status = 0 AND repair_status = 1)",
        suggest_for_deletion: "(delete_status = 0 AND suggest_for_deletion = 1)",
        na: "(delete_status = 0 AND (merge_status = 0 OR merge_status IS NULL) AND (repair_status = 0 OR repair_status IS NULL) AND (splice_id IS NULL OR splice_id = '') AND (suggest_for_deletion = 0 OR suggest_for_deletion IS NULL))",
        enable:"(delete_status = 0 AND is_enabled = 1)",
        disable:"(delete_status = 0 AND is_enabled = 0)"
      };

      const checkArray1 = ["deleted", "merged", "spliced", "repaired", "suggest_for_deletion","na","enable","disable"].filter(val => defect_status_filter.includes(val));
      // const checkArray2 = ["spliced", "repaired", "suggest_for_deletion"].filter(val => defect_status_filter.includes(val));

      if (checkArray1.length) {
        getdefectforrollid += " AND (" + checkArray1.map(val => filterGroups[val]).join(" OR ") + ")";
      }
      db.addQuery("getdefectforrollid", getdefectforrollid);
      defects = (await db.runQuery("getdefectforrollid", defectparams)).data;
    } else {
      getdefectforrollid += " AND delete_status = 0";
      db.addQuery("getdefectforrollid", getdefectforrollid);
      defects = (await db.runQuery("getdefectforrollid", defectparams)).data;
    }

    defects = defects.sort((a, b) => a.defect_top_left_y_mm - b.defect_top_left_y_mm);
    let logoBase64 = '';
    if (logo) {
      const logoBuffer = Buffer.from(logo.data);
      const mimeType = mime.lookup(logo.originalname) || 'image/png'; // fallback to png if unknown
      logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      // Use logoBase64 wherever required
    }
    const defectRows = defects?.length ? defects.map((defect, index) => {
      let padding_value = 0;
      let defect_value = 37;
      let defect_row_value = 26.32;
      if (index !== 0 && (index + 1) % defect_value === 0 || index + 1 === defects.length) {
        pageValue += 1;
      }
      if (index + 1 === defects.length) {
        const remaining_rows = defect_value - ((index + 1) % defect_value)
        padding_value = remaining_rows * defect_row_value;
      }
      const date = new Date(defect.updated_at);
      const formatted = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')} ${date
          .getUTCHours()
          .toString()
          .padStart(2, '0')}:${date
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}`;
      const defectID = defect_id_reset ? `D${((index+1) + i)+start_limit}`: `D${defect.defect_id}`;
      return `
         <tr>
          <td style="height:22px;">${index + 1}</td>
          <td>${(defect.defect_top_left_x_mm.toFixed(1))}</td>
          <td>${(defect.defect_top_left_y_mm.toFixed(1))}</td>
          <td>${defect.defect_type}</td>
          <td>${defect.defect_width_mm.toFixed(1)}</td>
          <td>${defect.defect_height_mm.toFixed(1)}</td>
          <td>${(defect.defect_width_mm * defect.defect_height_mm).toFixed(1)}</td>
          <td>${(defect.confidence.toFixed(1))}</td>
          <td>${formatted}</td>
          <td>${defectID}</td>
        </tr>
         ${(index !== 0 && (index + 1) % defect_value === 0) ? `
            <tr>
              <td colspan="11" style="border:none;padding:11px 0px 0px 0px;">
                <span class="footer">
                  <div class="between">
                    <div class="center">
                      <span class="footerLogo">
                        <img src="data:image/png;base64,${footerLogo}" alt="Robro Icon">
                      </span>
                      <span style="font-weight:600; margin-left:15px;font-size:10px;"> 
                        <b>KWIS</b>: ${version}
                      </span>
                    </div>
                    <span>
                      <b style="font-weight:600;font-size:10px;">Generated by:</b> 
                      <span style="font-weight:600;font-size:10px;">${userName}</span> on 
                      <span style="font-weight:600;font-size:10px;"><span>${istDate}</span></span>
                    </span>
                    <p style="color: #fff; font-weight: 700; margin: 0;font-size:10px;">Page: <span>${pageValue}</span> </p>
                  </div>
                </span>
              </td>
            </tr>
            ` : index + 1 === defects.length ?
          `
            <tr>
              <td colspan="11" style="border:none;padding:${padding_value}px 0px 0px 0px;">
                <span class="footer">
                  <div class="between">
                    <div class="center">
                      <span class="footerLogo">
                        <img src="data:image/png;base64,${footerLogo}" alt="Robro Icon">
                      </span>
                      <span style="font-weight:600; margin-left:15px;font-size:10px;"> 
                        <b>KWIS</b>: v${version}
                      </span>
                    </div>
                    <span>
                      <b style="font-weight:600;font-size:10px;">Generated by:</b> 
                      <span style="font-weight:600;font-size:10px;">${userName}</span> on 
                      <span style="font-weight:600;font-size:10px;"><span>${istDate}</span></span>
                    </span>
                    <p style="color: #fff; font-weight: 700; margin: 0;font-size:10px;">Page: <span>${pageValue}</span> </p>
                  </div>
                </span>
              </td>
            </tr>
            `
          : ""}`;

    }).join('') : `<tr>
        <td colspan="11">
            NO Records Found   
        </td>
      </tr>
      <tr>
        <td colspan="11" style="border:none;padding:958px 0px 0px 0px;">
          <span class="footer">
            <div class="between">
              <div class="center">
                <span class="footerLogo">
                  <img src="data:image/png;base64,${footerLogo}" alt="Robro Icon">
                </span>
                <span style="font-weight:600; margin-left:15px;font-size:10px;"> 
                  <b>KWIS</b>: ${version}
                </span>
              </div>
              <span>
                <b style="font-weight:600;font-size:10px;">Generated by:</b> 
                <span style="font-weight:600;font-size:10px;">${userName}</span> on 
                <span style="font-weight:600;font-size:10px;"><span>${istDate}</span></span>
              </span>
              <p style="color: #fff; font-weight: 700; margin: 0;font-size:10px;">Page: <span>${pageValue}</span> </p>
            </div>
          </span>
        </td>
      </tr>`;  // Joins the rows together


    // The HTML content for the PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Roll Master PDF</title>
    
    
        <style>
            
             
            body {
                margin: 0;
                color: var(--font-color);
                font-family: "Montserrat", sans-serif;
                font-size: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
    
            @page {
                size: A4;
            }
    
            /*
    The SVG gets set to a fixed size and get 5mm margin right to keep some distance
    to the company name.
    */
            .logoAndName span {
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
    
    
            .borderStyle p {
                font-weight: 700;
                margin-bottom: 3px;
            }
    
            .w-100 {
                width: 100%;
            }
    
            .TableHead {
                background-color: #073070;
                color: #fff;
            }
    
            .border-space-15 {
                border-spacing: 15px;
            }
    
            main {
                position: relative;
                width: 210mm;
                height: 297mm;
            }
    
    
            .pb-50 {
                padding-bottom: 50px;
            }
    
    
            table thead th {
                border-right: 2px solid white;
                padding: 5px;
                font-size: 10px;
            }
    
            .MainTable table tbody td {
                text-align: center;
                font-size: 10px;
            }
    
            .MainTable table tr:nth-child(even) {
                background-color: #fff;
            }
    
            .MainTable {
                font-size: 12px;
            }
    
            .MainTable table {
                border-spacing: 0px;
                border-radius: 10px;
            }
    
            .MainTable table tbody td {
                border: 1px solid lightgray;
            }
    
    
            .center {
                display: flex;
                align-items: center;
                justify-content: center;
            }
    
    
            .headerSection {
                display: flex;
                justify-content: space-between;
                padding: 15px 10px 0px 10px;
            }
    
            .logoAndName {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .logoContainer img{
              width: 100%;
              height: 45px;
              object-fit: contain;
            }
            @media print {
                footer {
                    width: 210mm;
                    background-color: #073070;
                    text-align: center;
                    margin-top: 13px;
    
                }
            }
    
            .footer {
                display: block;
                width: 98.8%;
                background-color: #073070;
                color: #fff;
                padding: 5px;
                max-height: 25px;
                text-align: center;
    
            }
    
            .between {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
    
            .footerLogo {
                width: 60px;
                height: 23px;
            }
    
            .footerLogo img {
                width: 100%;
                height: auto;
                object-fit: contain;
            }
    
            .fs-12 {
                font-size: 12px;
            }
        </style>
        <!-- Google Charts script -->
        
    </head>
    
    <body>
        <main>
            <section class="rounded-b">
                <div class="MainTable">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th style="border:none;border-bottom:1px solid white;padding:none;" class="TableHead" colspan="10">
                                    <div class="headerSection">
                                        <div class="logoAndName">
                                            <span class="logoContainer"><img
                                                    src="${logoBase64}" 
                                                    alt="Robro Icon"></span>
                                        </div>
                                        <div class="center-3 flex-col">
                                            <h2 class="m-0" style="margin-bottom:5px;">KWIS INSPECTION REPORT</h2>
                                            <p class="m-0"><b>${customer_roll_id}</b></p>
                                        </div>
                                        <div class="center-2 flex-col">
                                            <p class="m-0" style="margin-bottom:5px;"><b>Generated Date:</b></p>
                                            <p class="m-0 text-right" style="font-weight:400;"><span>${istDate}</span> ${istTimeString}</p>
                                        </div>
                                    </div>
                                    <hr />
                                </th>
                            </tr>
                            <tr>
                                <th class="TableHead">S.No</th>
                                <th class="TableHead">Defect position in X</th>
                                <th class="TableHead">Defect position in Y</th>
                                <th class="TableHead">Defect Type</th>
                                <th class="TableHead">Size X(mm)</th>
                                <th class="TableHead">Size Y(mm)</th>
                                <th class="TableHead">Area (mm)</th>
                                <th class="TableHead">Confidence</th>
                                <th class="TableHead" style="width: 70px;">Time Stamp</th>
                                <th class="TableHead" style="border-right: none;">Defect Id</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${defectRows}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </body>
    
    </html>
    
    `;

    // Set the page content to the HTML
    await page.setContent(htmlContent);

    // Generate PDF in binary format (Buffer)
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
      pageNumber: pageValue
    };
  } catch (err) {
    console.error("Error generating PDF:", err);
    return {
      success: false,
      message: "Error generating PDF",
    };
  }
};

module.exports = createTableViewPdf;
