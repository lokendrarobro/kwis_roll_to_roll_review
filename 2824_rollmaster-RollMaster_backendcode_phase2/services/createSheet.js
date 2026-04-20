const db = require("../connection/dbConnection.js");
const path = require("path");
const fs = require("fs");

const createSheet = async (workbook, worksheet, robro_roll_id, start_limit, end_limit, addHeader = true) => {
  try {
    let getdefectforrollid = `
      SELECT kwis_defects_log.*  
      FROM kwis_defects_log 
      WHERE robro_roll_id = ? AND delete_status = 0
      LIMIT ? OFFSET ?
    `;
    let defectparams = [robro_roll_id, end_limit - start_limit, start_limit];
    db.addQuery("getdefectforrollid", getdefectforrollid);
    const defects = (await db.runQuery("getdefectforrollid", defectparams)).data || [];

    if (addHeader) {
      worksheet.mergeCells("A1:E1");
      const headerCell = worksheet.getCell("A1");
      headerCell.value = "Defect Analysis Report";
      headerCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      headerCell.alignment = { horizontal: "center", vertical: "middle" };
      headerCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0f0e5b" },
      };

      worksheet.getRow(1).height = 30;
      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 15;
      worksheet.getColumn(4).width = 15;
      worksheet.getColumn(5).width = 40;

      const headerRow = worksheet.addRow([
        "S.No",
        "Defect name",
        "Position-width (mm)",
        "Position length (mm)",
        "Defect Image",
      ]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });
      worksheet.getRow(headerRow.number).height = 30;
    }
defects.forEach((defect, index) => {
  const row = worksheet.addRow([
    index + start_limit + 1,
    (defect.defect_type || "").replace(/\s*\d+%$/, ""),
    defect.defect_width_mm?.toFixed(1) || "",
    defect.defect_height_mm?.toFixed(1) || "",
    "", // Image column
  ]);

  row.eachCell((cell) => {
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });

  if (defect.cropped_image_path) {
    const imagePath = path.resolve(__dirname, "../uploads", defect.cropped_image_path);
    if (fs.existsSync(imagePath)) {
      const imageId = workbook.addImage({
        filename: imagePath,
        extension: path.extname(imagePath).replace(".", ""),
      });

      // Desired image size
      const imgHeightPx = 120;
      const imgWidthPx = 120;

      // Adjust only this row & column
      worksheet.getRow(row.number).height = imgHeightPx / 1.33;
      worksheet.getColumn(5).width = imgWidthPx / 7;

      // Place image strictly inside same row (col 5)
      worksheet.addImage(imageId, {
        tl: { col: 4, row: row.number - 1 },  // top-left corner of current row
        br: { col: 5, row: row.number },      // bottom-right same row
        editAs: "oneCell",
      });

      worksheet.getRow(row.number).commit();
    }
  }
});



    return defects;
  } catch (err) {
    console.error("Error generating Excel:", err);
    return [];
  }
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

module.exports = createSheet;
