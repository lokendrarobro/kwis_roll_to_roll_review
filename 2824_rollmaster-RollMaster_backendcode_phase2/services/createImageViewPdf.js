const db = require("../connection/dbConnection.js");
const defectController = require("../controllers/defectController.js");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
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

async function getBase64Image1(imagePath) {
    if (!fs.existsSync(imagePath)) {
        // console.error("Image not found at path:", imagePath);
        return ''; // or return a default base64 image
    }

    const buffer = await sharp(imagePath).resize(400).jpeg({ quality: 60 }).toBuffer();
    return buffer.toString("base64");
}

const createImageViewPdf = async (robro_roll_id, logo,start_limit,end_limit,pageNumber, userName,version,customer_roll_id,defect_type_filter,defect_status_filter,defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd) => {
  try {
    let pageValue = pageNumber;
    const metercal = 1000;

    // const browser = await puppeteer.launch({
    //   headless : true,
    //   executablePath : '/usr/bin/chromium',
    //   args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   product: 'firefox',
    //   executablePath: '/usr/bin/firefox',
    //   args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu']
    // });
    
    const page = await browser.newPage();

    const footerLogo = getBase64Image(
      path.resolve(__dirname, "robro_logo.png")
    );
   
    let getdefectforrollid = `SELECT kwis_defects_log.*  FROM kwis_defects_log WHERE robro_roll_id = ?`;
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
      getdefectforrollid += "AND (";
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

    if (defect_status_filter?.length) {
      const filterGroups = {
        deleted: "(delete_status = 1)",
        merged: "(delete_status = 2 AND merge_status = 1)",
        spliced: "(delete_status = 0 AND kwis_defects_log.splice_id IS NOT NULL)",
        repaired: "(delete_status = 0 AND repair_status = 1)",
        suggest_for_deletion: "(delete_status = 0 AND suggest_for_deletion = 1)",
        na: "(delete_status = 0 AND (merge_status = 0 OR merge_status IS NULL) AND (repair_status = 0 OR repair_status IS NULL) AND (splice_id IS NULL OR splice_id = '') AND (suggest_for_deletion = 0 OR suggest_for_deletion IS NULL))",
        enable:"(delete_status = 0 AND is_enabled = 1)",
        disable:"(delete_status = 0 AND is_enabled = 0)"
      };

      const checkArray1 = ["deleted", "merged","spliced","repaired","suggest_for_deletion","na","enable","disable"].filter(val => defect_status_filter.includes(val));
      // const checkArray2 = ["spliced", "repaired", "suggest_for_deletion"].filter(val => defect_status_filter.includes(val));

      if (checkArray1.length) {
        getdefectforrollid += " AND (" + checkArray1.map(val => filterGroups[val]).join(" OR ") + ") ";
        // defectparams.push(end_limit - start_limit);
        //  defectparams.push(start_limit)
      }
      db.addQuery("getdefectforrollid", getdefectforrollid);
      defects = (await db.runQuery("getdefectforrollid", defectparams)).data ||[];
    } else {
      getdefectforrollid += " AND delete_status = 0 limit ? offset ?";
      defectparams.push(end_limit - start_limit);
      defectparams.push(start_limit)  
      db.addQuery("getdefectforrollid", getdefectforrollid);
      defects = (await db.runQuery("getdefectforrollid", defectparams)).data ||[];
    }
    defects = defects.sort((a, b) => a.defect_top_left_y_mm - b.defect_top_left_y_mm);
    const defectSql = `SELECT DISTINCT SUBSTRING_INDEX(defect_type, ' ', 1) AS defect_type FROM kwis_defects_log WHERE robro_roll_id = ?;`
    await db.addQuery("defectsql", defectSql);
    const defectTypeResult = await db.runQuery("defectsql", [robro_roll_id])
    const defectInfo = defectTypeResult.data;

    const Colors = await defectController.getColours('backend');
    const sql = `SELECT * FROM kvp_system_configuration WHERE component_name = ?`;
    const value = ["critical_defect_config"];

    await db.addQuery("getSystemConfiguration", sql);
    const result = await db.runQuery("getSystemConfiguration", value);
    const configuration_data = result.data[0] ? result.data[0].configuration_data : null;

    const criticalDefectData = configuration_data.critical_defects ? (configuration_data.critical_defects) : null;

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

    let logoBase64 = '';
    if (logo) {
      const logoBuffer = Buffer.from(logo.data);
      const mimeType = mime.lookup(logo.originalname) || 'image/png'; // fallback to png if unknown
      logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      // Use logoBase64 wherever required
    }
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
    let rowsCount = 0;
    let container_height_status = false;
    const defectRows = [];
    if(defects.length > 0){
    for (let index = 0; index < defects.length; index += 2) {
      let defectContainerStyle = '';

      if ((defects.length - index) < 8 && !container_height_status && index % 2 === 0) {
        const heights = ['261.4mm', '196.1mm', '130.7mm'];
        if ((defects.length - index) <= 2 && rowsCount >= 0 && rowsCount < heights.length) {
          defectContainerStyle = `height: ${heights[rowsCount]};`;
          container_height_status = true;
        }
      }
      if (index % 2 !== 0) return '';
      rowsCount += 1;
      let defect_Data = [];
      if(index === defects.length - 1) {
      defect_Data = [defects[index]];
      }
      else{
      defect_Data = [defects[index], defects[index + 1]];

      }
      const defectValue = [];
      for (let i = 0; i < defect_Data.length; i++) {
        const def = defect_Data[i];
        if (!def) continue;
        const cleanedDefectType = def.defect_type.split(' ')[0];
        const index = defectInfo.findIndex(obj => obj.defect_type === cleanedDefectType);
        const defectImagePath = path.resolve(__dirname, `../uploads/${def.cropped_image_path.replace(/\\/g, '/')}`);
        const defectImage = await getBase64Image1(defectImagePath);
        const defectID = defect_id_reset ? `D${((index+1) + i)+start_limit}`: `D${def.defect_id}`;
        defectValue.push(`
          <div class="DefectBox" style="border: 2px solid ${defectInfo[index].colour_code};">
            <span class="imageOfDefect">
              <img src="data:image/jpg;base64,${defectImage}" alt="Defect Image">
            </span>
            <div class="DefectDetails font-semibold">
              <span class="px-5">${defectID}</span>
              <div class="flex bg-lightBlue px-5" style="height: 100%; gap: 5px;">
                <span class="flex" style="width: 30px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <b>X:</b>
                  <p class="m-0" style="margin-left: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${(def.defect_top_left_x_mm / metercal).toFixed(1)}
                  </p>
                </span>

                <span class="flex" style="width: 40px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <b>Y:</b>
                  <p class="m-0" style="margin-left: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${(def.defect_top_left_y_mm / metercal).toFixed(1)}
                  </p>
                </span>

                <span class="flex" style="width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <b>Size:</b>
                  <span class="flex" style="margin-left: 5px;">
                    <p class="m-0" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${def.defect_width_mm.toFixed(1)}
                    </p>
                    <p class="m-0">&nbsp;X&nbsp;</p>
                    <p class="m-0" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${def.defect_height_mm.toFixed(1)}
                    </p>
                  </span>
                </span>

              </div>
              <p class="px-5" style="width: 38%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${def.defect_type}</p>
              <div class="ml-auto flex items-center pr-2">
                <span style="
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 2px rgba(0,0,0,0.3);
                    background-color: ${def.is_enabled == 1 ? '#ef4444' : '#22c55e'};
                  "
                  title="${def.is_enabled == 1 ? 'Enabled' : 'Disabled'}">
                </span>
              </div>
            </div>
          </div>`);
     
      }


      const header = (index === 0 || index % 8 === 0) ? `
        <header>
          <div class="headerSection">
            <div class="logoAndName">
               <span class="logoContainer"><img src="${logoBase64}" alt="Robro Icon"></span>
            </div>
            <div class="center-3 flex-col">
              <h2 class="m-0">KWIS INSPECTION REPORT</h2>
              <p class="m-0"><b>${customer_roll_id}</b></p>
            </div>
            <div class="center-2 flex-col">
              <p class="m-0"><b>Generated Date:</b></p>
              <p class="m-0 text-right"><span>${istDate}</span> ${istTimeString}</p>
            </div>
          </div>
          <hr />
        </header>` : '';
      const footer = (rowsCount === 4 || index === defects.length - 2 || index === defects.length - 1) ? `
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
                <p style="color: #fff; font-weight: 700; margin: 0;">Page :<span>${pageValue+1}</span> </p>
           </div>
         </span>
       </footer>` : '';
      if (rowsCount == 4) {
        rowsCount = 0;
        pageValue += 1;
      }
        defectRows.push(`${header}<div class="DefectContainer" style="${defectContainerStyle}">${defectValue.join('')}</div>${footer}`);

    }
  }
  else if(defects.length === 0 && pageNumber < 4){
     const header =`
        <header>
          <div class="headerSection">
            <div class="logoAndName">
               <span class="logoContainer"><img src="${logoBase64}" alt="Robro Icon"></span>
            </div>
            <div class="center-3 flex-col">
              <h2 class="m-0">KWIS INSPECTION REPORT</h2>
              <p class="m-0"><b>${customer_roll_id}</b></p>
            </div>
            <div class="center-2 flex-col">
              <p class="m-0"><b>Generated Date:</b></p>
              <p class="m-0 text-right"><span>${istDate}</span> ${istTimeString}</p>
            </div>
          </div>
          <hr />
        </header>`;
      const footer =`
        <footer>
    <span class="footer" style="position: fixed; bottom: 0;">
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
                <p style="color: #fff; font-weight: 700; margin: 0;">Page :<span>${pageValue+1}</span> </p>
           </div>
         </span>
       </footer>`;
       defectRows.push(
        `${header}
          <div class="DefectContainer text-bold" 
              style="display: flex; justify-content: center; text-align: center;font weight: bold;">
            No Records Found
          </div>
        ${footer}`
      );
    // defectRows.push(`<div style="width: 100%; text-align: center; font-size: 20px; font-weight: 600; margin-top: 20%;">No Defects Found</div>`);
  }

    // The HTML content for the PDF
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

            /*The SVG gets set to a fixed size and get 5mm margin right to keep some distance
            to the company name.*/
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
             
            main {
              position: relative;
              width: 210mm;
              height: 297mm;

            }

            @media print {
              footer {
                width: 210mm;
                background-color: #073070;
                text-align: center;
                margin-top:13.3px;
              }
            }
                .footer{
                display:block;
                width: 98.8%;
                background-color:#073070;
                color: #fff;
                padding:5px;
                max-height:25px;
                text-align: center;
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

            .font-semibold {
              font-weight: 700;
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
            .DefectContainer{
              width:100%;
              height:auto;
              display: grid;
              gap:5px;
              grid-template-columns: 48% 48%;
            }
            .DefectBox{
              height: fit-content;
              margin-top:10px;
              border-radius: 0.5rem !important;
            }
            .DefectBox .imageOfDefect{
              width: 100%;
              height: 200px;
              display: grid;
        
              place-content: center;
              overflow: hidden;
            }
            .DefectBox .imageOfDefect img{
              width: 100%;
              height: 200px;
              object-fit:contain;
              }
              .DefectDetails{
              width: 100%;
              background-color:#073070;
              color:#fff;
              display:flex;
              align-items:center;
              height: 33px;
              border-bottom-right-radius: 0.5rem !important;
              border-bottom-left-radius: 0.5rem !important;
            }
            .text-right{text-align:right;}
            .flex{
                display: flex;
                align-items: center;
            }
            .bg-lightBlue{
                background-color: #20acf4;
                color: #fff;
            }
            .p-5{
            padding:5px;
            }
            .px-5{
              padding:0px 5px;
            }
        
          </style>
        </head>
        <body>
          <main>
            <section>
              <div>
                 ${defectRows.join('')}
              </div>
           
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
      pageNumber: pageValue,
      dataCount: defects.length
    };
  } catch (err) {
    console.error("Error generating PDF:", err);
    return {
      success: false,
      message: "Error generating PDF",
    };
  }
};

module.exports = createImageViewPdf;
