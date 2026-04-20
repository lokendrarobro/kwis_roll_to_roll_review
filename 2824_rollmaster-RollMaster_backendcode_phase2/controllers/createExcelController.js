const db = require("../connection/dbConnection.js");
const ExcelJS = require("exceljs");
const axios = require("axios");
const path = require("path")
const fs = require("fs");
const XlsxPopulate = require("xlsx-populate");
const { count } = require("console");
const AdmZip = require("adm-zip");
const { XMLParser } = require("fast-xml-parser");
const JSZip = require("jszip");

async function processChunk(rollsListData, worksheet, options) {
  const {
    db,
    roll_details_status,
    inspection_details_status,
    review_details_status,
    repair_details_status,
    defects_summary_status,
    body_details_status,
    defects_details_status,
    column_name_array,
    sorting_column_name,
    machineName,
    offset
  } = options;

  const rollIds = rollsListData.map(r => r.robro_roll_id);

      // ----------------------------------------------------------------
      // 2) TAG NAMES
      // ----------------------------------------------------------------
      // const tagQuery = `
      //     SELECT 
      //       ts.robro_roll_id,
      //       GROUP_CONCAT(DISTINCT cti.tag_name ORDER BY cti.tag_name ASC) AS tag_names
      //     FROM kwis_tag_settings ts
      //     JOIN kwis_custom_user_tag_info cti 
      //         ON ts.user_tag_id = cti.user_tag_id
      //     WHERE ts.robro_roll_id IN (?)
      //     GROUP BY ts.robro_roll_id
      //   `;

      // await db.addQuery("tagQuery", tagQuery);
      // const tagRows = await db.runQuery("tagQuery", [rollIds]);

      // ----------------------------------------------------------------
      // 3) RECIPE LIST
      // ----------------------------------------------------------------
      // const recipeQuery = `
      //     SELECT 
      //       kjl.robro_roll_id,
      //       GROUP_CONCAT(DISTINCT kjl.recipe ORDER BY kjl.recipe ASC) AS recipe
      //     FROM kwis_jobs_log kjl
      //     WHERE kjl.robro_roll_id IN (?)
      //     GROUP BY kjl.robro_roll_id;
      //   `;

      // await db.addQuery("recipeQuery", recipeQuery);
      // const recipeRows = await db.runQuery("recipeQuery", [rollIds]);

      // ----------------------------------------------------------------
      // 4) REVIEW DATES
      // ----------------------------------------------------------------
      let reviewRows;
      if (review_details_status) {
        const reviewQuery = `
        SELECT 
          robro_roll_id,
          MIN(start_time) AS start_review_date,
          MAX(end_time) AS end_review_date
        FROM kwis_review_job_log
        WHERE robro_roll_id IN (?)
        GROUP BY robro_roll_id;
      `;

        await db.addQuery("reviewQuery", reviewQuery);
        reviewRows = await db.runQuery("reviewQuery", [rollIds]);
      }


      // ----------------------------------------------------------------
      // 5) REPAIR DATES
      // ----------------------------------------------------------------
      let repairRows;
      if (repair_details_status) {
        const repairQuery = `
        SELECT 
          robro_roll_id,
          MIN(start_time) AS start_repair_date,
          MAX(end_time) AS end_repair_date
        FROM kwis_roll_repair_job
        WHERE robro_roll_id IN (?)
        GROUP BY robro_roll_id;
      `;

        await db.addQuery("repairQuery", repairQuery);
        repairRows = await db.runQuery("repairQuery", [rollIds]);
      }


      // ----------------------------------------------------------------
      // 6) DEFECT SUMMARY
      // ----------------------------------------------------------------
      let defectRows;
      if (review_details_status || repair_details_status) {
        const defectsQuery = `
        SELECT 
          robro_roll_id,
          COUNT(CASE WHEN delete_status = 1 THEN 1 END) AS deleted_defects_count,
          COUNT(CASE 
              WHEN delete_status = 0 
              AND repair_status = 1 
              AND suggest_for_deletion = 0 
              THEN 1 
          END) AS repaired_defects_count,
          COUNT(CASE 
              WHEN delete_status = 0 
              AND repair_status = 0 
              AND suggest_for_deletion = 1 
              THEN 1 
          END) AS override_defects_count,
          COUNT(user_suggestion) AS review_agent_feedback_count
        FROM kwis_defects_log
        WHERE robro_roll_id IN (?)
        GROUP BY robro_roll_id;
      `;

        await db.addQuery("defectsQuery", defectsQuery);
        defectRows = await db.runQuery("defectsQuery", [rollIds]);
      }


      // ----------------------------------------------------------------
      // 7) SPLICE SUMMARY
      // ----------------------------------------------------------------
      let spliceRows;
      if (repair_details_status) {
        const spliceQuery = `
        SELECT 
          robro_roll_id,
          COUNT(*) AS splice_count,
          ROUND(SUM(splice_end_meter - splice_start_meter), 2) AS splice_removed_length
        FROM kwis_splice_table
        WHERE robro_roll_id IN (?) and splice_status = 1
        GROUP BY robro_roll_id;
      `;

        await db.addQuery("spliceQuery", spliceQuery);
        spliceRows = await db.runQuery("spliceQuery", [rollIds]);
      }


      // ----------------------------------------------------------------
      // 8) ENABLE/DISABLE WISE COUNT
      // ----------------------------------------------------------------
      let enableDisableMap;
      if (defects_summary_status) {
        const enableDisableQuery = `
        SELECT 
          robro_roll_id,
          COUNT(CASE WHEN is_enabled = 1 THEN 1 END) AS enable_count,
          COUNT(CASE WHEN is_enabled = 0 THEN 1 END) AS disable_count
        FROM kwis_defects_log
        WHERE robro_roll_id IN (?)
        AND delete_status = 0
        GROUP BY robro_roll_id;
      `;

        await db.addQuery("enableDisableQuery", enableDisableQuery);
        const enableDisableRows = await db.runQuery("enableDisableQuery", [rollIds]);

        enableDisableMap =
          Array.isArray(enableDisableRows?.data) && enableDisableRows.data.length > 0
            ? Object.fromEntries(
              enableDisableRows.data.map(r => [r.robro_roll_id, r])
            )
            : {};
      }

      // ----------------------------------------------------------------
      // 9) DEFECT TYPE WISE COUNT
      // ----------------------------------------------------------------
      let uniqueDefectTypes;
      let defectTypeMap = {};
      if (defects_summary_status) {
        const defectTypeQuery = `
          SELECT 
            d.robro_roll_id,
            SUBSTRING_INDEX(d.defect_type, ' ', 1) AS defect_type,
            COUNT(*) AS defect_count
          FROM kwis_defects_log d
          WHERE d.robro_roll_id IN (?)
            AND d.delete_status = 0
          GROUP BY 
            d.robro_roll_id,
            SUBSTRING_INDEX(d.defect_type, ' ', 1);
        `;

        await db.addQuery("defectTypeQuery", defectTypeQuery);
        const defectTypeResult = await db.runQuery("defectTypeQuery", [rollIds]);
        const defectTypeRows = defectTypeResult.data || [];
        uniqueDefectTypes = [...new Set(defectTypeRows.map(d => d.defect_type))];

        defectTypeRows.forEach(row => {
          if (!defectTypeMap[row.robro_roll_id]) {
            defectTypeMap[row.robro_roll_id] = {};
          }
          defectTypeMap[row.robro_roll_id][row.defect_type] = row.defect_count;
        });
      }



      // ----------------------------------------------------------------
      // 10) Machine Name
      // ----------------------------------------------------------------
      let machineNameRows;
      if (repair_details_status) {
        const machineNameQuery = `
        SELECT 
          krrj.robro_roll_id,
          GROUP_CONCAT(DISTINCT krrj.machine_id ORDER BY krrj.machine_id ASC) AS machine_ids
        FROM kwis_roll_repair_job krrj
        WHERE krrj.robro_roll_id IN (?)
        GROUP BY krrj.robro_roll_id;
      `;
        await db.addQuery("machineNameQuery", machineNameQuery);
        machineNameRows = await db.runQuery("machineNameQuery", [rollIds]);
      }

      // ----------------------------------------------------------------
      // 11) Body Count Details
      // ----------------------------------------------------------------
      let jobBodyRows;
      if (body_details_status) {
        const jobBodyQuery = `SELECT
            r.robro_roll_id,

            /* PRIMARY */
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'primary_cut_length', x.cut_length,
                        'primary_body_count', x.body_count,
                        'sum_primary_actual_cut_length', x.total_length
                    )
                )
                FROM (
                    SELECT
                        j.cut_length,
                        COUNT(b.body_id) AS body_count,
                        SUM(b.actual_cut_length) AS total_length
                    FROM kwis_jobs_log j
                    LEFT JOIN kwis_body_log b
                        ON b.job_id = j.job_id
                      AND b.robro_roll_id = j.robro_roll_id
                      AND b.body_cut_type = 'P'
                    WHERE j.robro_roll_id = r.robro_roll_id
                      AND j.cut_length IS NOT NULL
                    GROUP BY j.cut_length
                ) x
            ) AS primary_body_data,

            /* SECONDARY */
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'secondary_cut_length', x.secondary_cut_length,
                        'secondary_body_count', x.body_count,
                        'sum_secondary_actual_cut_length', x.total_length
                    )
                )
                FROM (
                    SELECT
                        j.secondary_cut_length,
                        COUNT(b.body_id) AS body_count,
                        SUM(b.actual_cut_length) AS total_length
                    FROM kwis_jobs_log j
                    LEFT JOIN kwis_body_log b
                        ON b.job_id = j.job_id
                      AND b.robro_roll_id = j.robro_roll_id
                      AND b.body_cut_type = 'S'
                    WHERE j.robro_roll_id = r.robro_roll_id
                      AND j.secondary_cut_length IS NOT NULL
                    GROUP BY j.secondary_cut_length
                ) x
            ) AS secondary_body_data,

            /* TERTIARY */
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'tertiary_cut_length', x.tertiary_cut_length,
                        'tertiary_body_count', x.body_count,
                        'sum_tertiary_actual_cut_length', x.total_length
                    )
                )
                FROM (
                    SELECT
                        j.tertiary_cut_length,
                        COUNT(b.body_id) AS body_count,
                        SUM(b.actual_cut_length) AS total_length
                    FROM kwis_jobs_log j
                    LEFT JOIN kwis_body_log b
                        ON b.job_id = j.job_id
                      AND b.robro_roll_id = j.robro_roll_id
                      AND b.body_cut_type = 'T'
                    WHERE j.robro_roll_id = r.robro_roll_id
                      AND j.tertiary_cut_length IS NOT NULL
                    GROUP BY j.tertiary_cut_length
                ) x
            ) AS tertiary_body_data

        FROM (
            SELECT DISTINCT robro_roll_id
            FROM kwis_jobs_log
            WHERE robro_roll_id IN (?)
        ) r;
      `;

        await db.addQuery("jobBodyQuery", jobBodyQuery);
        jobBodyRows = await db.runQuery("jobBodyQuery", [rollIds]);
      }


      // ----------------------------------------------------------------
      // 12) Wastage Information Details
      // ----------------------------------------------------------------
      let WastageRows;
      if (body_details_status) {
        const getWastageSql = `SELECT kbl.robro_roll_id,
          COUNT(*) AS body_cut_type_D_count,
          SUM(kbl.actual_cut_length) AS total_wastage_length
      FROM kwis_body_log kbl
      WHERE kbl.robro_roll_id IN (?)
        AND kbl.body_cut_type = 'D'
        GROUP BY kbl.robro_roll_id;`
        await db.addQuery("wastageQuery", getWastageSql);
        WastageRows = await db.runQuery("wastageQuery", [rollIds]);
      }

      let defectDetailsRows;

      if (defects_details_status) {
         const getDefectSql = `
            SELECT 
              kdl.robro_roll_id,
              kdl.defect_type,
              kdl.defect_top_left_x_mm,
              kdl.defect_top_left_y_mm,
              kdl.defect_width_mm,
              kdl.defect_height_mm,

              CASE
                WHEN kdl.suggest_for_deletion = 1 THEN 'Ignored'
                WHEN kdl.repair_status = 1 THEN 'Repaired'
                WHEN kdl.splice_id IS NOT NULL THEN 'Spliced'
                ELSE ''
              END AS operator_action

            FROM kwis_defects_log kdl
            WHERE kdl.robro_roll_id IN (?)
            ORDER BY kdl.robro_roll_id;
          `;

          await db.addQuery("defectQuery", getDefectSql);
          defectDetailsRows = await db.runQuery("defectQuery", [rollIds]);
      }

      // ----------------------------------------------------------------
      // MERGE ALL QUERIES
      // ----------------------------------------------------------------
      // const tagMap = Array.isArray(tagRows?.data) && tagRows?.data.length > 0 ? Object.fromEntries(tagRows.data.map(r => [r.robro_roll_id, r.tag_names])) : [];
      // const recipeMap = Array.isArray(recipeRows?.data) && recipeRows?.data.length > 0 ? Object.fromEntries(recipeRows.data.map(r => [r.robro_roll_id, r.recipe])) : [];
      let reviewMap = (review_details_status) && Array.isArray(reviewRows?.data) && reviewRows?.data.length > 0 ? Object.fromEntries(reviewRows.data.map(r => [r.robro_roll_id, r])) : [];
      let repairMap = (repair_details_status) && Array.isArray(repairRows?.data) && repairRows?.data.length > 0 ? Object.fromEntries(repairRows.data.map(r => [r.robro_roll_id, r])) : [];
      let defectMap = (review_details_status || repair_details_status) && Array.isArray(defectRows?.data) && defectRows?.data.length > 0 ? Object.fromEntries(defectRows.data.map(r => [r.robro_roll_id, r])) : [];
      let spliceMap = (repair_details_status) && Array.isArray(spliceRows?.data) && spliceRows?.data.length > 0 ? Object.fromEntries(spliceRows.data.map(r => [r.robro_roll_id, r])) : [];
      let machineNameMap = (repair_details_status) && Array.isArray(machineNameRows?.data) && machineNameRows?.data.length > 0 ? Object.fromEntries(machineNameRows.data.map(r => [r.robro_roll_id, r.machine_ids])) : [];
      let jobBodyMap = (body_details_status) && Array.isArray(jobBodyRows?.data) && jobBodyRows?.data.length > 0 ?
        Object.fromEntries(jobBodyRows.data.map(r => [r.robro_roll_id, r]))
        : [];
      let WastageMap = (body_details_status) && Array.isArray(WastageRows?.data) && WastageRows?.data.length > 0 ?
        Object.fromEntries(WastageRows.data.map(r => [r.robro_roll_id, r]))
        : [];
      let defectDetailsMap =(defects_details_status &&
        Array.isArray(defectDetailsRows?.data) &&
          defectDetailsRows.data.length > 0)
          ? defectDetailsRows.data.reduce((acc, r) => {
              if (!acc[r.robro_roll_id]) {
                acc[r.robro_roll_id] = [];
              }
              acc[r.robro_roll_id].push(r);
              return acc;
            }, {})
          : {};
      
      
      reviewRows = null;
      repairRows = null;
      defectRows = null;
      spliceRows = null;
      machineNameRows = null;
      jobBodyRows = null;
      WastageRows = null;
      defectDetailsRows = null;

      const rollsLogResult = rollsListData.map(row => {
        const rollDefects = defectDetailsMap[row.robro_roll_id] || [];
        const primary_body_data = jobBodyMap && jobBodyMap[row.robro_roll_id]?.primary_body_data ?
          jobBodyMap[row.robro_roll_id]?.primary_body_data.map(item => {
            const length = item.primary_cut_length / 10;
            const count = item.primary_body_count;
            const meter = (item.sum_primary_actual_cut_length / 1000).toFixed(2);
            if (length === 0) {
              return null;
            }
            return `(L${length}-C${count}-M${meter})`;
          }).filter(Boolean) 
            .join('/')
          : null;
        const secondary_body_data = jobBodyMap && jobBodyMap[row.robro_roll_id]?.secondary_body_data ?
          jobBodyMap[row.robro_roll_id]?.secondary_body_data.map(item => {
            const length = item.secondary_cut_length / 10;
            const count = item.secondary_body_count;
            const meter = (item.sum_secondary_actual_cut_length / 1000).toFixed(2);

            if (length === 0) {
              return null;
            }
            return `(L${length}-C${count}-M${meter})`;
          }).filter(Boolean) 
            .join('/')
          : null;
        const tertiary_body_data = jobBodyMap && jobBodyMap[row.robro_roll_id]?.tertiary_body_data ?
          jobBodyMap[row.robro_roll_id]?.tertiary_body_data.map(item => {
            const length = item.tertiary_cut_length / 10;
            const count = item.tertiary_body_count;
            const meter = (item.sum_tertiary_actual_cut_length / 1000).toFixed(2);
            if (length === 0) {
              return null;
            }
            return `(L${length}-C${count}-M${meter})`;
          }).filter(Boolean)
            .join('/')
          : null;
        const defective_body_data = WastageMap && WastageMap[row.robro_roll_id] ? `C${WastageMap[row.robro_roll_id]?.body_cut_type_D_count}-M${(WastageMap[row.robro_roll_id]?.total_wastage_length / 1000).toFixed(2)}-KG${(((WastageMap[row.robro_roll_id]?.total_wastage_length / 1000) * (row.width / 1000) * row.gsm) / 1000).toFixed(2)}` : null;
        return {
          ...row,
          // tag_names: tagMap[row.robro_roll_id] || null,
          // recipe: recipeMap[row.robro_roll_id] || null,
          start_review_date_time: reviewMap && reviewMap[row.robro_roll_id]?.start_review_date ? reviewMap[row.robro_roll_id]?.start_review_date : null,
          end_review_date_time: reviewMap && reviewMap[row.robro_roll_id]?.end_review_date ? reviewMap[row.robro_roll_id]?.end_review_date : null,
          start_repair_date_time: repairMap && repairMap[row.robro_roll_id]?.start_repair_date ? repairMap[row.robro_roll_id]?.start_repair_date : null,
          end_repair_date_time: repairMap && repairMap[row.robro_roll_id]?.end_repair_date ? repairMap[row.robro_roll_id]?.end_repair_date : null,
          deleted_defects_count: defectMap && defectMap[row.robro_roll_id]?.deleted_defects_count ? defectMap[row.robro_roll_id]?.deleted_defects_count : 0,
          repaired_defects_count: defectMap && defectMap[row.robro_roll_id]?.repaired_defects_count ? defectMap[row.robro_roll_id]?.repaired_defects_count : 0,
          override_defects_count: defectMap && defectMap[row.robro_roll_id]?.override_defects_count ? defectMap[row.robro_roll_id]?.override_defects_count : 0,
          review_agent_feedback_count: defectMap && defectMap[row.robro_roll_id]?.review_agent_feedback_count ? defectMap[row.robro_roll_id]?.review_agent_feedback_count : 0,
          splice_count: spliceMap && spliceMap[row.robro_roll_id]?.splice_count ? spliceMap[row.robro_roll_id]?.splice_count : 0,
          splice_removed_length: spliceMap && spliceMap[row.robro_roll_id]?.splice_removed_length ? spliceMap[row.robro_roll_id]?.splice_removed_length : 0,
          enable_count: enableDisableMap && enableDisableMap[row.robro_roll_id]?.enable_count ? enableDisableMap[row.robro_roll_id]?.enable_count : 0,
          disable_count: enableDisableMap && enableDisableMap[row.robro_roll_id]?.disable_count ? enableDisableMap[row.robro_roll_id]?.disable_count : 0,
          machine_name: machineNameMap && machineNameMap[row.robro_roll_id] ? machineNameMap[row.robro_roll_id] : null,
          primary_body_data: primary_body_data,
          secondary_body_data: secondary_body_data,
          tertiary_body_data: tertiary_body_data,
          defective_body_data: defective_body_data,
          defects: rollDefects
        }
      });

      reviewMap = null;
      repairMap = null;
      defectMap = null;
      spliceMap = null;
      machineNameMap = null;
      jobBodyMap = null;
      WastageMap = null;
      defectDetailsMap = null;
      rollsListData = null;

      // const worksheet = workbook.addWorksheet("Roll Report");
      const baseHiddenColumns = [];

      const statusMap = {
        roll_details: roll_details_status,
        inspection_details: inspection_details_status,
        review_details: review_details_status,
        repair_details: repair_details_status,
        defects_summary: defects_summary_status,
        body_details: body_details_status,
        defects_details: defects_details_status
      };
      const COLUMN_MASTER = {
        roll_details: {
          roll_number: { header: "Roll Number", width: 20 },
          gsm: { header: "GSM", width: 20 },
          width: { header: "Width", width: 20 },
          roll_length: { header: "Roll Length", width: 20 },
          loom_number: { header: "Loom Number", width: 20 },
          status_of_roll: { header: "Status of Roll", width: 20 },
          data_status: { header: "Data Status", width: 20 }
        },

        inspection_details: {
          master_start_datetime: { header: "Master Start Date/Time", width: 20 },
          master_start_date: { header: "Master Start Date", width: 20 },
          master_start_time: { header: "Master Start Time", width: 20 },
          master_end_datetime: { header: "Master End Date/Time", width: 20 },
          master_end_date: { header: "Master End Date", width: 20 },
          master_end_time: { header: "Master End Time", width: 20 },
          inspected_length_m: { header: "Inspected Length (M)", width: 20 },
          total_inspection_time_min: { header: "Total Inspection Time(Min)", width: 20 },
          master_machine_id: { header: "Master Machine ID", width: 20 },
          corrected_avg_master_speed: { header: "Corrected Avg Master Speed", width: 20 },
          average_master_speed_mpm: { header: "Average Master Speed (mpm)", width: 20 },
          total_defects_inspected: { header: "Total Defects Inspected", width: 20 },
          avg_defects_per_1000_meter: { header: "Avg defects per 1000 meter", width: 20 }
        },

        review_details: {
          review_start_datetime: { header: "Review Start Date/Time", width: 20 },
          review_start_date: { header: "Review Start Date", width: 20 },
          review_start_time: { header: "Review Start Time", width: 20 },
          review_end_datetime: { header: "Review End Date/Time", width: 20 },
          review_end_date: { header: "Review End Date", width: 20 },
          review_end_time: { header: "Review End Time", width: 20 },
          total_review_time_min: { header: "Total Review Time (Min)", width: 20 },
          total_defects_deleted_during_review: { header: "Total defects deleted during Review", width: 20 },
          review_agent_feedback_count: { header: "Review Agent Feedback Count", width: 25 }
        },

        repair_details: {
          repair_machine_id: { header: "Repair Machine ID", width: 20 },
          repair_start_datetime: { header: "Repair Start Date/Time", width: 20 },
          repair_start_date: { header: "Repair Start Date", width: 20 },
          repair_start_time: { header: "Repair Start Time", width: 20 },
          repair_end_datetime: { header: "Repair End Date/Time", width: 20 },
          repair_end_date: { header: "Repair End Date", width: 20 },
          repair_end_time: { header: "Repair End Time", width: 20 },
          repair_time_taken_min: { header: "Repair Time Taken (min)", width: 20 },
          repair_meter: { header: "Repair meter", width: 20 },
          average_repair_speed_mpm: { header: "Average Repair Speed (mpm)", width: 20 },
          total_defects_approved_for_repair: { header: "Total defects approved for repair", width: 20 },
          defects_actually_repaired: { header: "Defects actually repaired", width: 20 },
          defects_actually_override: { header: "Defects actually overridden", width: 20 },
          number_of_splices_done: { header: "Number of Splices done", width: 20 },
          length_removed_during_splicing_m: { header: "Length removed during splicing (M)", width: 20 }
        },

        defects_summary: {
          category_wise_defect_count: { header: "Category Wise Defect Count", width: 20 },
          enable_defects: { header: "Enable defects", width: 20 },
          disable_defects: { header: "Disable defects", width: 20 }
        },

        body_details: {
          primary_body: { header: "Primary Body", width: 20 },
          secondary_body: { header: "Secondary Body", width: 20 },
          tertiary_body: { header: "Tertiary Body", width: 20 },
          wastage_information: { header: "Wastage Information", width: 20 }
        },

        defects_details: {
          defect_type: { header: "Defect Type", width: 20 },
          location_x: { header: "Location X(CM)", width: 20 },
          location_y: { header: "Location Y(M)", width: 20 },
          width_mm: { header: "Widht(MM)", width: 20 },
          height_mm: { header: "Height(MM)", width: 20 },
          operator_action: { header: "Operator Action", width: 20 }
        }
      };

      let rolls = rollsLogResult || [];

      const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(date);
      };

      const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }).format(date);
      };

      const formatTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(date);
      };

      const getRollStatusText = (status) => {
        switch (status) {
          case 1:
          case 5:
            return "Review In-Progress";
          case 2:
            return "Reviewed";
          case 3:
            return "Half Repaired";
          case 4:
            return "Fully Repaired";
          default:
            return "Inspected";
        }
      };

      const getBackupStatusText = (status) => {
        switch (status) {
          case 0:
            return "ARCHIVE";
          case 1:
            return "BACKUP";
          case 2:
            return "BACKUP AVAILABLE";
          case 3:
            return "BACKUP DELETED";
          case 4:
            return "JOB RESTORED";
          default:
            return "Live";
        }
      };

      const calculateDurationMinutes = (start, end) => {
        if (!start || !end) return "0";
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s) || isNaN(e)) return "0";
        const diff = Math.round((e - s) / 60000);
        return `${diff}`;
      };
      let rollResult = [];
      let uniqueDefectTypesColumns = []
        rollResult = rolls;
        if (defects_summary_status) {
          uniqueDefectTypesColumns = uniqueDefectTypes
        }

      let defectColumns = [];
      if (defects_summary_status) {
        defectColumns = uniqueDefectTypesColumns.map(defect => ({
          header: defect,
          key: defect.replace(/\s+/g, "_").toLowerCase(),
          width: 20
        }));
      }


      const bodyDetailsStatus = rollResult.some(
        row => row.primary_body_data !== null || row.secondary_body_data !== null || row.tertiary_body_data !== null || row.defective_body_data !== null
      ) || rolls.some(
        row => row.primary_body_data !== null || row.secondary_body_data !== null || row.tertiary_body_data !== null || row.defective_body_data !== null
      );
      rolls = null; // Memory cleanup

      if(offset === 0) {
      const dynamicColumns = buildColumns(column_name_array, statusMap, COLUMN_MASTER, bodyDetailsStatus, defectColumns);
      worksheet.columns = [...baseHiddenColumns, ...dynamicColumns];

      rollResult = applySorting(
        rollResult,
        sorting_column_name
      );

      const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F497D" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
        headerRow.commit();
      }
      

      rollResult.forEach((data, index) => {
        const defects = data.defects || [];
        if (defects.length === 0) {
          let sheetRowData = {
              robro_roll_id_hidden: data.robro_roll_id || "",
              machine_name_hidden: machineName,
              roll_start_date_time_hidden: formatDateTime(data.roll_start_date_time)
            };
            if (roll_details_status) {
              sheetRowData = {
                ...sheetRowData,
                roll_number: data.customer_roll_id || "",
                loom_number: data.loom_number || "NULL",
                gsm: data.gsm || "-",
                width: data.width ? Number(data.width).toFixed(2) : "-",
                roll_length: data.roll_length || null,
                status_of_roll: getRollStatusText(data.roll_status),
                data_status: getBackupStatusText(data.backup_status),
              }
            }
            if (inspection_details_status) {
              const inspectedLength = data.inspected_length
                ? Number(data.inspected_length)
                : 0;
              const rollStartDate = data?.roll_start_date_time ? formatDate(data.roll_start_date_time) : (data?.roll_start_date ? data?.roll_start_date : '-');
              const rollStartTime = data?.roll_start_date_time ? formatTime(data.roll_start_date_time) : (data?.roll_start_time ? data?.roll_start_time : '-');
              const rollEndDate = data?.roll_end_date_time ? formatDate(data.roll_end_date_time) : (data?.roll_end_date ? data?.roll_end_date : '-');
              const rollEndTime = data?.roll_end_date_time ? formatTime(data.roll_end_date_time) : (data?.roll_end_time ? data?.roll_end_time : '-');
              const masterDuration = (data?.roll_start_date_time && data?.roll_end_date_time) ? calculateDurationMinutes(data.roll_start_date_time, data.roll_end_date_time) : (data?.master_duration ? data.master_duration : 0);
              const durationInMinutes = Number(masterDuration) || 0;

              // Calculate speed safely
              let correctedAvgSpeed = null;
              let averageMasterSpeed = null;
              if (inspectedLength > 0 && durationInMinutes > 0) {
                correctedAvgSpeed = inspectedLength / durationInMinutes;
                averageMasterSpeed = (Math.round(correctedAvgSpeed)).toString();
              }
              else if (data?.corrected_avg_master_speed) {
                correctedAvgSpeed = data.corrected_avg_master_speed === "NULL" ? data.corrected_avg_master_speed : Number(data.corrected_avg_master_speed);
                averageMasterSpeed = data.average_master_speed
              }
              sheetRowData = {
                ...sheetRowData,
                master_start_datetime: formatDateTime(data.roll_start_date_time),
                master_start_date: rollStartDate,
                master_start_time: rollStartTime,
                master_end_datetime: formatDateTime(data.roll_end_date_time),
                master_end_date: rollEndDate,
                master_end_time: rollEndTime,
                inspected_length_m: inspectedLength ? inspectedLength.toFixed(2) : "NULL",
                master_machine_id: machineName,
                total_inspection_time_min: durationInMinutes ? durationInMinutes.toString() : "NULL",
                corrected_avg_master_speed: correctedAvgSpeed !== null && correctedAvgSpeed !== "NULL" ? correctedAvgSpeed.toFixed(2) : "NULL",
                average_master_speed_mpm: averageMasterSpeed || "NULL",
                total_defects_inspected: (data.total_defects).toString() || "0",
                avg_defects_per_1000_meter: ((parseFloat(data.avg_defects_per_1000_meter)).toFixed(2)).toString() || "NULL",
              }
            }
            if (review_details_status) {
              const reviewStartDate = data?.start_review_date_time ? formatDate(data.start_review_date_time) : (data?.start_review_date ? data?.start_review_date : '-');
              const reviewStartTime = data?.start_review_date_time ? formatTime(data.start_review_date_time) : (data?.start_review_time ? data?.start_review_time : '-');
              const reviewEndDate = data?.end_review_date_time ? formatDate(data.end_review_date_time) : (data?.end_review_date ? data?.end_review_date : '-');
              const reviewEndTime = data?.end_review_date_time ? formatTime(data.end_review_date_time) : (data?.end_review_time ? data?.end_review_time : '-');
              const reviewDuration = (data?.start_review_date_time && data?.end_review_date_time) ? calculateDurationMinutes(data.start_review_date_time, data.end_review_date_time) : (data?.review_duration ? data.review_duration : 0);
              const durationInMinutes = Number(reviewDuration) || 0;
              sheetRowData = {
                ...sheetRowData,
                review_start_datetime: formatDateTime(data.start_review_date_time),
                review_start_date: reviewStartDate,
                review_start_time: reviewStartTime,
                review_end_datetime: formatDateTime(data.end_review_date_time),
                review_end_date: reviewEndDate,
                review_end_time: reviewEndTime,
                total_review_time_min: durationInMinutes ? durationInMinutes.toString() : "NULL",
                total_defects_deleted_during_review: (data.deleted_defects_count).toString() || "0",
                review_agent_feedback_count: (data.review_agent_feedback_count || 0).toString()
              }
            }
            if (repair_details_status) {
              const repairStartDate = data?.start_repair_date_time ? formatDate(data.start_repair_date_time) : (data?.start_repair_date ? data?.start_repair_date : '-');
              const repairStartTime = data?.start_repair_date_time ? formatTime(data.start_repair_date_time) : (data?.start_repair_time ? data?.start_repair_time : '-');
              const repairEndDate = data?.end_repair_date_time ? formatDate(data.end_repair_date_time) : (data?.end_repair_date ? data?.end_repair_date : '-');
              const repairEndTime = data?.end_repair_date_time ? formatTime(data.end_repair_date_time) : (data?.end_repair_time ? data?.end_repair_time : '-');
              const repairDuration = (data?.start_repair_date_time && data?.end_repair_date_time) ? calculateDurationMinutes(data.start_repair_date_time, data.end_repair_date_time) : (data?.repair_duration ? data.repair_duration : 0);
              const durationInMinutes = Number(repairDuration) || 0;
              let averageRepairSpeed = null;
              if (data.current_repair_meter && data.current_repair_meter > 0 && repairDuration > 0) {
                averageRepairSpeed = ((data.current_repair_meter / repairDuration).toFixed(2)).toString()
              }
              else if (data?.average_repair_speed) {
                averageRepairSpeed = data.average_repair_speed === "NULL" ? data.average_repair_speed : Number(data.average_repair_speed)
              }
              const repairApprovedDefects = (data?.total_defects) ? (data.total_defects - data.deleted_defects_count).toString() : (data?.repair_approved_defects ? data.repair_approved_defects : "0");
              sheetRowData = {
                ...sheetRowData,
                repair_machine_id: data.machine_name ? data.machine_name : "NULL",
                repair_start_datetime: formatDateTime(data.start_repair_date_time),
                repair_start_date: repairStartDate,
                repair_start_time: repairStartTime,
                repair_end_datetime: formatDateTime(data.end_repair_date_time),
                repair_end_date: repairEndDate,
                repair_end_time: repairEndTime,
                repair_meter: data.current_repair_meter ? data.current_repair_meter.toString() : "NULL",
                repair_time_taken_min: durationInMinutes,
                average_repair_speed_mpm: averageRepairSpeed || "NULL",
                total_defects_approved_for_repair: repairApprovedDefects || "0",
                defects_actually_repaired: (data.repaired_defects_count).toString() || "0",
                defects_actually_override: (data.override_defects_count).toString() || "0",
                number_of_splices_done: (data.splice_count).toString() || "0",
                length_removed_during_splicing_m: (data.splice_removed_length).toString() || "0",
              }
            }
            if (defects_summary_status) {
              const defectCounts = (typeof data === "object" && data.hasOwnProperty(String(data.robro_roll_id)))
                ? data[String(data.robro_roll_id)]
                : defectTypeMap[data.robro_roll_id] || {};
              const defectCols = {};
              uniqueDefectTypesColumns.forEach(defect => {
                const key = `${defect.replace(/\s+/g, "_").toLowerCase()}`;
                defectCols[key] = defectCounts[defect] || 0;
              });
              sheetRowData = {
                ...sheetRowData,
                enable_defects: data.enable_count.toString(),
                disable_defects: data.disable_count.toString(),
                ...defectCols
              }
            }
            if (body_details_status) {
              sheetRowData = {
                ...sheetRowData,
                primary_body: (data.primary_body_data) || '-',
                secondary_body: (data.secondary_body_data) || '-',
                tertiary_body: (data.tertiary_body_data) || '-',
                wastage_information: (data.defective_body_data) || '-',
              }
            }
            if(defects_details_status) {
              sheetRowData = {
                ...sheetRowData,
              defect_type:  "-",
              location_x:  "-",
              location_y: "-",
              width_mm: "-",
              height_mm:  "-",
              operator_action: "-"
              };
            }
            worksheet.addRow(sheetRowData);
            return;
        }
         //  Loop for each defect
          defects.forEach((defect, index) => {
            let sheetRowData = {};
            sheetRowData = {
                robro_roll_id_hidden: data.robro_roll_id || "",
                machine_name_hidden: machineName,
                roll_start_date_time_hidden: formatDateTime(data.roll_start_date_time)
              };
            //  FIRST ROW → full data
            if (index === 0) {
              if (roll_details_status) {
                sheetRowData = {
                  ...sheetRowData,
                  roll_number: data.customer_roll_id || "",
                  loom_number: data.loom_number || "NULL",
                  gsm: data.gsm || "-",
                  width: data.width ? Number(data.width).toFixed(2) : "-",
                  roll_length: data.roll_length || null,
                  status_of_roll: getRollStatusText(data.roll_status),
                  data_status: getBackupStatusText(data.backup_status),
                }
              }
              if (inspection_details_status) {
                const inspectedLength = data.inspected_length
                  ? Number(data.inspected_length)
                  : 0;
                const rollStartDate = data?.roll_start_date_time ? formatDate(data.roll_start_date_time) : (data?.roll_start_date ? data?.roll_start_date : '-');
                const rollStartTime = data?.roll_start_date_time ? formatTime(data.roll_start_date_time) : (data?.roll_start_time ? data?.roll_start_time : '-');
                const rollEndDate = data?.roll_end_date_time ? formatDate(data.roll_end_date_time) : (data?.roll_end_date ? data?.roll_end_date : '-');
                const rollEndTime = data?.roll_end_date_time ? formatTime(data.roll_end_date_time) : (data?.roll_end_time ? data?.roll_end_time : '-');
                const masterDuration = (data?.roll_start_date_time && data?.roll_end_date_time) ? calculateDurationMinutes(data.roll_start_date_time, data.roll_end_date_time) : (data?.master_duration ? data.master_duration : 0);
                const durationInMinutes = Number(masterDuration) || 0;

                // Calculate speed safely
                let correctedAvgSpeed = null;
                let averageMasterSpeed = null;
                if (inspectedLength > 0 && durationInMinutes > 0) {
                  correctedAvgSpeed = inspectedLength / durationInMinutes;
                  averageMasterSpeed = (Math.round(correctedAvgSpeed)).toString();
                }
                else if (data?.corrected_avg_master_speed) {
                  correctedAvgSpeed = data.corrected_avg_master_speed === "NULL" ? data.corrected_avg_master_speed : Number(data.corrected_avg_master_speed);
                  averageMasterSpeed = data.average_master_speed
                }
                sheetRowData = {
                  ...sheetRowData,
                  master_start_datetime: formatDateTime(data.roll_start_date_time),
                  master_start_date: rollStartDate,
                  master_start_time: rollStartTime,
                  master_end_datetime: formatDateTime(data.roll_end_date_time),
                  master_end_date: rollEndDate,
                  master_end_time: rollEndTime,
                  inspected_length_m: inspectedLength ? inspectedLength.toFixed(2) : "NULL",
                  master_machine_id: machineName,
                  total_inspection_time_min: durationInMinutes ? durationInMinutes.toString() : "NULL",
                  corrected_avg_master_speed: correctedAvgSpeed !== null && correctedAvgSpeed !== "NULL" ? correctedAvgSpeed.toFixed(2) : "NULL",
                  average_master_speed_mpm: averageMasterSpeed || "NULL",
                  total_defects_inspected: (data.total_defects).toString() || "0",
                  avg_defects_per_1000_meter: ((parseFloat(data.avg_defects_per_1000_meter)).toFixed(2)).toString() || "NULL",
                }
              }
              if (review_details_status) {
                const reviewStartDate = data?.start_review_date_time ? formatDate(data.start_review_date_time) : (data?.start_review_date ? data?.start_review_date : '-');
                const reviewStartTime = data?.start_review_date_time ? formatTime(data.start_review_date_time) : (data?.start_review_time ? data?.start_review_time : '-');
                const reviewEndDate = data?.end_review_date_time ? formatDate(data.end_review_date_time) : (data?.end_review_date ? data?.end_review_date : '-');
                const reviewEndTime = data?.end_review_date_time ? formatTime(data.end_review_date_time) : (data?.end_review_time ? data?.end_review_time : '-');
                const reviewDuration = (data?.start_review_date_time && data?.end_review_date_time) ? calculateDurationMinutes(data.start_review_date_time, data.end_review_date_time) : (data?.review_duration ? data.review_duration : 0);
                const durationInMinutes = Number(reviewDuration) || 0;
                sheetRowData = {
                  ...sheetRowData,
                  review_start_datetime: formatDateTime(data.start_review_date_time),
                  review_start_date: reviewStartDate,
                  review_start_time: reviewStartTime,
                  review_end_datetime: formatDateTime(data.end_review_date_time),
                  review_end_date: reviewEndDate,
                  review_end_time: reviewEndTime,
                  total_review_time_min: durationInMinutes ? durationInMinutes.toString() : "NULL",
                  total_defects_deleted_during_review: (data.deleted_defects_count).toString() || "0",
                  review_agent_feedback_count: (data.review_agent_feedback_count || 0).toString()
                }
              }
              if (repair_details_status) {
                const repairStartDate = data?.start_repair_date_time ? formatDate(data.start_repair_date_time) : (data?.start_repair_date ? data?.start_repair_date : '-');
                const repairStartTime = data?.start_repair_date_time ? formatTime(data.start_repair_date_time) : (data?.start_repair_time ? data?.start_repair_time : '-');
                const repairEndDate = data?.end_repair_date_time ? formatDate(data.end_repair_date_time) : (data?.end_repair_date ? data?.end_repair_date : '-');
                const repairEndTime = data?.end_repair_date_time ? formatTime(data.end_repair_date_time) : (data?.end_repair_time ? data?.end_repair_time : '-');
                const repairDuration = (data?.start_repair_date_time && data?.end_repair_date_time) ? calculateDurationMinutes(data.start_repair_date_time, data.end_repair_date_time) : (data?.repair_duration ? data.repair_duration : 0);
                const durationInMinutes = Number(repairDuration) || 0;
                // const repairDuration = calculateDurationMinutes(data.start_repair_date, data.end_repair_date);
                let averageRepairSpeed = null;
                if (data.current_repair_meter && data.current_repair_meter > 0 && repairDuration > 0) {
                  averageRepairSpeed = ((data.current_repair_meter / repairDuration).toFixed(2)).toString()
                }
                else if (data?.average_repair_speed) {
                  averageRepairSpeed = data.average_repair_speed === "NULL" ? data.average_repair_speed : Number(data.average_repair_speed)
                }
                const repairApprovedDefects = (data?.total_defects) ? (data.total_defects - data.deleted_defects_count).toString() : (data?.repair_approved_defects ? data.repair_approved_defects : "0");
                sheetRowData = {
                  ...sheetRowData,
                  repair_machine_id: data.machine_name ? data.machine_name : "NULL",
                  repair_start_datetime: formatDateTime(data.start_repair_date_time),
                  repair_start_date: repairStartDate,
                  repair_start_time: repairStartTime,
                  repair_end_datetime: formatDateTime(data.end_repair_date_time),
                  repair_end_date: repairEndDate,
                  repair_end_time: repairEndTime,
                  repair_meter: data.current_repair_meter ? data.current_repair_meter.toString() : "NULL",
                  repair_time_taken_min: durationInMinutes,
                  average_repair_speed_mpm: averageRepairSpeed || "NULL",
                  total_defects_approved_for_repair: repairApprovedDefects || "0",
                  defects_actually_repaired: (data.repaired_defects_count).toString() || "0",
                  defects_actually_override: (data.override_defects_count).toString() || "0",
                  number_of_splices_done: (data.splice_count).toString() || "0",
                  length_removed_during_splicing_m: (data.splice_removed_length).toString() || "0",
                }
              }
              if (defects_summary_status) {
                const defectCounts = (typeof data === "object" && data.hasOwnProperty(String(data.robro_roll_id)))
                  ? data[String(data.robro_roll_id)]
                  : defectTypeMap[data.robro_roll_id] || {};
                const defectCols = {};
                uniqueDefectTypesColumns.forEach(defect => {
                  const key = `${defect.replace(/\s+/g, "_").toLowerCase()}`;
                  defectCols[key] = defectCounts[defect] || 0;
                });
                sheetRowData = {
                  ...sheetRowData,
                  enable_defects: data.enable_count.toString(),
                  disable_defects: data.disable_count.toString(),
                  ...defectCols
                }
              }
              if (body_details_status) {
                sheetRowData = {
                  ...sheetRowData,
                  primary_body: (data.primary_body_data) || '-',
                  secondary_body: (data.secondary_body_data) || '-',
                  tertiary_body: (data.tertiary_body_data) || '-',
                  wastage_information: (data.defective_body_data) || '-',
                }
              }
            }

            sheetRowData = {
              ...sheetRowData,
              defect_type: defect.defect_type || "-",
              location_x: defect.defect_top_left_x_mm || "-",
              location_y: defect.defect_top_left_y_mm || "-",
              width_mm: defect.defect_width_mm || "-",
              height_mm: defect.defect_height_mm || "-",
              operator_action: defect.operator_action || "-"
            };

            worksheet.addRow(sheetRowData).commit();
          });
      });
}

const getExcelBinaryData = async (req, res) => {
  try {
    const { report_config_name, filter, defaultReportConfig = false } = req.body;
    let { startDate, endDate } = req.body;
    if (!filter) {
      return res.status(400).json({ error: "filter is required" });
    }

    const {
      inspection_machine_ips,
      inspection_machine_name,
      number_of_days,
      data_status,
      tag_name,
      recipe,
      roll_status,
      repair_machine_id,
      column_name_array,
      sorting_column_name = 'master_start_datetime',
    } = filter;

    // ---------------- VALIDATION ----------------
    if (!Array.isArray(inspection_machine_ips) || inspection_machine_ips.length === 0) {
      return res.status(400).json({ error: "inspection_machine_ips required" });
    }

    if (!Array.isArray(inspection_machine_name) || inspection_machine_name.length === 0) {
      return res.status(400).json({ error: "inspection_machine_name required" });
    }

    if (inspection_machine_ips.length !== inspection_machine_name.length) {
      return res.status(400).json({ error: "IP & machine name length mismatch" });
    }

    if (!number_of_days || typeof number_of_days !== "number") {
      return res.status(400).json({ error: "number_of_days invalid" });
    }

    // ---------------- DATE RANGE ----------------
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - number_of_days);

    const end_date = defaultReportConfig ? endDate : formatDated(endDateObj, true);
    const start_date = defaultReportConfig ? startDate : formatDated(startDateObj, true);

    const sql = `SELECT * FROM kvp_system_configuration WHERE component_name = ?`;
    const value = ["report_config"];

    await db.addQuery("getSystemConfiguration", sql);
    const result = await db.runQuery("getSystemConfiguration", value);
    if (result.data.length === 0) {
      return res.status(501).json({ status: false, message: "There is no settings found for this component_name" })
    }
    const configurationData = result.data[0].configuration_data.report_config;

    if (configurationData.length === 0) {
      return res.status(501).json({ status: false, message: "There is no configuaration found" })
    }
    const matchConfigIndex = configurationData.findIndex(d => d.report_config_name === report_config_name);
    const matchConfigData = configurationData[matchConfigIndex] || {};
    // const matchfilePath = path.join(__dirname, `../uploads/report_backups/${report_config_name}.xlsx`)

    const fileName = `${report_config_name}.xlsx`;
    const filePath = path.join(__dirname, "../uploads/report_backups", fileName);
    const tempFilePath = path.join(__dirname, "../uploads/report_backups", `temp_${fileName}`);

    const reportExists = fs.existsSync(filePath);

    let userSheetNames = [];

    if (reportExists) {
      await normalizeExcelZip(filePath);

      userSheetNames = getUserSheetNames(filePath);

    }
    let rollSheetExists = true;
    const loom_report_data_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'loom_report_data')).length > 0 ? true : false) : false
    const usage_report_data_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'usage_report_data')).length > 0 ? true : false) : false;
    
    if(reportExists){
      for (let i = 0; i < filter.inspection_machine_ips.length; i++) {

        const resp = await axios.post(
          `http://${filter.inspection_machine_ips[i]}:8889/api/CheckRollUpdates`,
          {
            start_date,
            end_date,
            data_status,
            tag_name,
            recipe,
            rollStatus: roll_status,
            repair_machine_id,
            report_config_name,
            column_name_array,
            reportExists: reportExists || false,
            downloaded_date_time: matchConfigData?.downloaded_date_time,
          }
        );

        if(!resp.data.roll_report_exists){
          rollSheetExists = false;
          break;
        }
        if(resp.data.count > 0){
          rollSheetExists = true;
          break;
        }
        if(resp.data.count === 0 && i === filter.inspection_machine_ips.length - 1){
          rollSheetExists = false;
        }
      }
    }

    if (reportExists && !rollSheetExists && !loom_report_data_status && !usage_report_data_status) {
      const currentDate = new Date();
      const formattedTimestamp = formatTimestamp(currentDate);
      matchConfigData['downloaded_date_time'] = formattedTimestamp;
      configurationData[matchConfigIndex] = matchConfigData;
      const configuration_data = JSON.stringify({
        "report_config": configurationData
      })
      const Updatesql = `UPDATE kvp_system_configuration SET configuration_data = ? WHERE component_name = ? AND app_id = ?`;
      const updateValues = [configuration_data, 'report_config', 10];
      await db.addQuery("Updatesql", Updatesql);
      await db.runQuery("Updatesql", updateValues);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}`
      );

      return fs.createReadStream(filePath).pipe(res);
    }

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: tempFilePath, 
      useStyles: true, 
      useSharedStrings: false
    });

    let rollSheet = null;
    let loomSheet = null;
    let usageSheet = null;

    let isRollHeaderSet = false;
    let isLoomHeaderSet = false;
    let isUsageHeaderSet = false;

    const processSheet = (srcSheet, destSheet, isHeaderSet, sheetType) => {
      if (!srcSheet) return;
      const range = srcSheet.usedRange();
      if (!range) return;
      const rows = range.endCell().rowNumber();
      const cols = range.endCell().columnNumber();
      if (!isHeaderSet) {
        let headers = [];
        for (let c = 1; c <= cols; c++) {
          headers.push(srcSheet.cell(1, c).value());
        }
        const headerRow = destSheet.addRow(headers);
        // STYLE APPLY 
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F497D" } };
          cell.alignment = { horizontal: "center" };
        });
        headerRow.commit();
        isHeaderSet = true;
      }
      if (rows > 1) {
        if (sheetType === "loom") hasLoomData = true;
        if (sheetType === "usage") hasUsageData = true;
        if (sheetType === "roll") hasRollData = true;
      }
      // ✅ DATA 
      for (let r = 2; r <= rows; r++) {
        let rowData = [];
        for (let c = 1; c <= cols; c++) {
          let val = srcSheet.cell(r, c).value();
          // Excel limit fix 
          if (typeof val === "string" && val.length > 32767) {
            val = val.substring(0, 32767);
          }
          rowData.push(val);
        }
        destSheet.addRow(rowData).commit();
      }
      return isHeaderSet; 
    }

    // API LOOP
    for (let i = 0; i < filter.inspection_machine_ips.length; i++) {
      const resp = await axios.post(
        `http://${filter.inspection_machine_ips[i]}:8889/api/createExcelSheetForEmail`,
         {
            start_date,
            end_date,
            data_status,
            tag_name,
            recipe,
            rollStatus: roll_status,
            machineName: inspection_machine_name[i],
            repair_machine_id,
            report_config_name,
            column_name_array,
            reportExists: reportExists || false,
            downloaded_date_time: matchConfigData?.downloaded_date_time,
            // oldExcelMap,
            // oldHeaders,
            sorting_column_name
          },
        { responseType: "arraybuffer" }
      );

      const tempWb = await XlsxPopulate.fromDataAsync(resp.data);

      const rollSrc = tempWb.sheet("Roll Report");
      if (rollSrc && rollSrc.usedRange()?.endCell().rowNumber() > 1) {
          if (!rollSheet) {
            rollSheet = workbook.addWorksheet("Combined Roll Report");
          }

          isRollHeaderSet = processSheet(
            rollSrc,
            rollSheet,
            isRollHeaderSet,
            "roll"
          );
      }

      const loomSrc = tempWb.sheet("Loom Report");
      if (loomSrc && loomSrc.usedRange()?.endCell().rowNumber() > 1) {
        if (!loomSheet) {
          loomSheet = workbook.addWorksheet("Combined Loom Report");
        }

        isLoomHeaderSet = processSheet(loomSrc, loomSheet, isLoomHeaderSet, "loom");
      }
      const usageSrc = tempWb.sheet("Usage Report");
      if (usageSrc && usageSrc.usedRange()?.endCell().rowNumber() > 1) {
        if (!usageSheet) {
          usageSheet = workbook.addWorksheet("Combined Usage Report");
        }

        isUsageHeaderSet = processSheet(usageSrc, usageSheet, isUsageHeaderSet, "usage");
      }

      // cleanup
      tempWb._workbook = null;
    }

    await workbook.commit();

    if (reportExists && userSheetNames.length > 0) {

      mergeUserSheets(filePath, tempFilePath, userSheetNames);
    }

    if (!defaultReportConfig) {
      //  File overwrite only if defaultReportConfig = true
      fs.copyFileSync(tempFilePath, filePath);

      // cleanup temp file
      fs.unlinkSync(tempFilePath);

      // DB Update logic
      const currentDate = new Date();
      const formattedTimestamp = formatTimestamp(currentDate);

      matchConfigData['downloaded_date_time'] = formattedTimestamp;
      configurationData[matchConfigIndex] = matchConfigData;

      const configuration_data = JSON.stringify({
        report_config: configurationData
      });

      const Updatesql = `
    UPDATE kvp_system_configuration 
    SET configuration_data = ? 
    WHERE component_name = ? AND app_id = ?
  `;

      const updateValues = [configuration_data, 'report_config', 10];

      await db.addQuery("Updatesql", Updatesql);
      await db.runQuery("Updatesql", updateValues);

    } else {

      res.on("finish", () => {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) { }
      });
    }

    const finalPath = defaultReportConfig ? tempFilePath : filePath;

    // send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    fs.createReadStream(finalPath).pipe(res);

  } catch (error) {

    console.error("XLSX POPULATE ERROR:", error);
    res.status(500).send("Error generating Excel");

  }
};

function formatDated(date, endOfDay = false) {
  const d = (date instanceof Date) ? date : new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  if (endOfDay) {
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } else {
    return `${year}/${month}/${day} 00:00:00`;
  }
}

const createExcelSheetForEmail = async (req, res) => {
  try {
    let {
      start_date,
      end_date,
      data_status,
      tag_name,
      recipe,
      rollStatus,
      machineName,
      repair_machine_id,
      column_name_array,
      // oldExcelMap = {},
      // oldHeaders = [],
      sorting_column_name
    } = req.body;
    const startparts = start_date.split("/");
    const endparts = end_date.split("/");
    const startDate = `${startparts[0]}-${startparts[1]}-${startparts[2]}`;
    const endDate = `${endparts[0]}-${endparts[1]}-${endparts[2]}`;
    const headerKeyMap = createHeaderKeyMap(column_name_array);

    const roll_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'roll_details')).length > 0 ? true : false) : false
    const inspection_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'inspection_details')).length > 0 ? true : false) : false
    const review_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'review_details')).length > 0 ? true : false) : false
    const repair_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'repair_details')).length > 0 ? true : false) : false
    const defects_summary_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'defects_summary')).length > 0 ? true : false) : false
    const body_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'body_details')).length > 0 ? true : false) : false
    const loom_report_data_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'loom_report_data')).length > 0 ? true : false) : false
    const defects_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'defects_details')).length > 0 ? true : false) : false
    const usage_report_data_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'usage_report_data')).length > 0 ? true : false) : 
    
     res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });

    const sortingColumnsMap = {
      roll_number: 'customer_roll_id',
      gsm: 'gsm',
      width: 'width',
      roll_length: 'roll_length',
      status_of_roll: 'roll_status',

      master_start_datetime: 'roll_start_time',
      master_start_date: 'roll_start_time',
      master_start_time: 'roll_start_time',
      master_end_datetime: 'roll_end_time',
      master_end_date: 'roll_end_time',
      master_end_time: 'roll_end_time',
      inspected_length_m: 'inspected_length',
      total_defects_inspected: 'total_defects'
    };

    const sortingDatabaseColumn = sortingColumnsMap[sorting_column_name] || 'roll_start_time'; 

    if (roll_details_status || inspection_details_status || review_details_status || repair_details_status || defects_summary_status || body_details_status || defects_details_status) {
      // ----------------------------------------------------------------
      // Filters same as your code
      // ----------------------------------------------------------------
      let statusConditionFirst = "";
      let statusParam = [];
      let userTagCondition = "";
      let recipeCondition = "";
      let recipeParam = [];
      let rollStatusCondition = "";
      let rollStatusParams = [];
      let rollStatusMachineCondition = "";
      let rollStatusMachineParams = [];

      // Roll status filter
      const rollStatusFilters = [];
      if (rollStatus) {
        if (rollStatus === "1" || rollStatus === 1) {
          rollStatusFilters.push(1, 5);
        } else {
          rollStatusFilters.push(rollStatus);
        }
      }
      if (rollStatusFilters.length > 0) {
        if (rollStatus === "null") {
          rollStatusCondition = ` AND rl.roll_status IS NULL`;
        } else {
          rollStatusCondition = ` AND rl.roll_status IN (${rollStatusFilters.map(() => "?").join(",")})`;
          rollStatusParams = [...rollStatusFilters];
        }
      }
      if (Array.isArray(repair_machine_id) && repair_machine_id.length > 0) {

        rollStatusMachineCondition = ` AND krrj.machine_id IN (${repair_machine_id.map(() => "?").join(",")})`;
        rollStatusMachineParams = [...repair_machine_id];
      }

      // Data Status Filter
      if (data_status && data_status.trim() !== "") {
        if (data_status === "Live") {
          statusConditionFirst = ` AND kdaj.job_id IS NULL`;
        } else if (
          ["BACKUP", "ARCHIVE", "JOB RESTORED", "BACKUP DELETED", "BACKUP AVALIABLE"].includes(data_status)
        ) {
          const newStatus =
            data_status === "BACKUP"
              ? 1
              : data_status === "BACKUP AVALIABLE"
                ? 2
                : data_status === "BACKUP DELETED"
                  ? 3
                  : data_status === "JOB RESTORED"
                    ? 4
                    : 0;

          statusConditionFirst = ` AND kdaj.backup_status = ?`;
          statusParam = [newStatus];
        }
      }

      // Tag Name Filter
      if (tag_name) {
        userTagCondition = ` AND ts.user_tag_id IN (${tag_name})`;
      }

      // Recipe Filter
      if (recipe && recipe !== "") {
        recipeCondition = ` AND kjl.recipe = ?`;
        recipeParam = [recipe];
      }

      const CHUNK_SIZE = 50;
      let offset = 0;
      let hasMore = true;
      const worksheet = workbook.addWorksheet("Roll Report");

      while (hasMore) {
        // ----------------------------------------------------------------
        // 1) BASE QUERY (FAST) — Get roll list ONLY
        // ----------------------------------------------------------------
        const rollListQuery = `
          WITH segment_counts AS (
              SELECT
                  robro_roll_id,
                  FLOOR(defect_top_left_y_mm / 1000000) AS segment_index,
                  COUNT(*) AS defects_in_segment
              FROM kwis_defects_log
              GROUP BY robro_roll_id, segment_index
          ),
          avg_defects AS (
              SELECT
                  robro_roll_id,
                  CASE 
                      WHEN COUNT(*) <= 1 THEN NULL
                      ELSE CAST(AVG(defects_in_segment) AS DECIMAL(10,2))
                  END AS avg_defects_per_1000_meter
              FROM segment_counts
              GROUP BY robro_roll_id
          )
      
          SELECT
              rl.robro_roll_id,
              rl.roll_start_time As roll_start_date_time,
              rl.roll_end_time As roll_end_date_time,
              rl.roll_length,
              rl.inspected_length,
              rl.gsm,
              rl.width,
              rl.machine_id,
              rl.customer_roll_id,
              rl.roll_status,
              rl.total_defects,
              rl.current_repair_meter,
              MAX(kmi.loom_id) AS loom_number,
              MAX(kdaj.backup_status) AS backup_status,
              COALESCE(ad.avg_defects_per_1000_meter, 0) AS avg_defects_per_1000_meter
          FROM kwis_rolls_log AS rl
          LEFT JOIN kvp_data_archive_job AS kdaj
                ON kdaj.job_id = rl.robro_roll_id
          LEFT JOIN kwis_roll_manufacturing_info AS kmi
                ON rl.robro_roll_id = kmi.robro_roll_id
          LEFT JOIN kwis_jobs_log AS kjl
                ON rl.robro_roll_id = kjl.robro_roll_id
          LEFT JOIN kwis_tag_settings AS ts
                ON rl.robro_roll_id = ts.robro_roll_id
          LEFT JOIN kwis_roll_repair_job AS krrj
                ON rl.robro_roll_id = krrj.robro_roll_id
          LEFT JOIN avg_defects AS ad
                ON ad.robro_roll_id = rl.robro_roll_id
          WHERE 1=1
              ${userTagCondition ? `${userTagCondition}` : ''}
              AND rl.roll_start_time BETWEEN ? AND ?
             
              ${rollStatusCondition ? `${rollStatusCondition}` : ''}
              ${statusConditionFirst ? `${statusConditionFirst}` : ''}
              ${recipeCondition ? `${recipeCondition}` : ''}
              ${rollStatusMachineCondition ? `${rollStatusMachineCondition}` : ""}
          GROUP BY rl.robro_roll_id
          ORDER BY rl.${sortingDatabaseColumn} ASC LIMIT ${CHUNK_SIZE} OFFSET ${offset};
          `;
        let rollParams;
          rollParams = [
            startDate,
            endDate,
            ...rollStatusParams,
            ...statusParam,
            ...recipeParam,
            ...rollStatusMachineParams
          ];

        await db.addQuery("rollListQuery", rollListQuery);
        const rollList = await db.runQuery("rollListQuery", rollParams);
        let rollsListData = rollList.data || [];

        if (rollsListData.length === 0) {
          hasMore = false;
          break;
        }

        await processChunk(rollsListData, worksheet, {
          db,
          roll_details_status,
          inspection_details_status,
          review_details_status,
          repair_details_status,
          defects_summary_status,
          body_details_status,
          defects_details_status,
          column_name_array,
          sorting_column_name,
          machineName,
          offset
        });

        offset += CHUNK_SIZE;
      }
    } 
    if (loom_report_data_status) {
      // --------------------------------------------------------
      // 1 Loom Summary Query
      // --------------------------------------------------------
      const loomReportQuery = `
        SELECT
          kmi.loom_id,
          COUNT(DISTINCT rl.robro_roll_id) AS total_rolls,
          SUM(rl.roll_length) AS total_length,
          AVG(rl.gsm) AS average_gsm,
          AVG(rl.width) AS average_width,
          SUM(rl.total_defects) AS total_defects
        FROM kwis_rolls_log rl
        JOIN kwis_roll_manufacturing_info kmi 
          ON rl.robro_roll_id = kmi.robro_roll_id
        WHERE rl.roll_start_time BETWEEN ? AND ?
        GROUP BY kmi.loom_id
        ORDER BY kmi.loom_id ASC;
      `;

      await db.addQuery("loomReportQuery", loomReportQuery);
      const loomReportResult = await db.runQuery("loomReportQuery", [startDate, endDate]);
      const rollsLogResult = loomReportResult.data || [];
      // --------------------------------------------------------
      // 2 Defect Category Wise (Loom Level)
      // --------------------------------------------------------
      const defectTypeQuery = `
        SELECT 
          kmi.loom_id,
          SUBSTRING_INDEX(d.defect_type, ' ', 1) AS defect_type,
          COUNT(*) AS defect_count
        FROM kwis_defects_log d
        JOIN kwis_roll_manufacturing_info kmi 
          ON d.robro_roll_id = kmi.robro_roll_id
        JOIN kwis_rolls_log rl
          ON rl.robro_roll_id = kmi.robro_roll_id
        WHERE rl.roll_start_time BETWEEN ? AND ?
          AND d.delete_status = 0
        GROUP BY 
          kmi.loom_id,
          SUBSTRING_INDEX(d.defect_type, ' ', 1)
      `;

      await db.addQuery("defectTypeQuery", defectTypeQuery);
      const defectResult = await db.runQuery("defectTypeQuery", [startDate, endDate]);
      const defectRows = defectResult.data || [];

      // Unique defect types (for dynamic columns)
      // const uniqueDefectTypes = [...new Set(defectRows.map(d => d.defect_type))];
      const uniqueDefectTypes = [
        ...new Set(defectRows.map(d => d.defect_type).filter(Boolean))
      ].map(type => ({
        header: type,
        key: type.replace(/\s+/g, "_").toLowerCase(),
        width: 20
      }));

      // --------------------------------------------------------
      // 3 Total Wastage KG (Loom Level)
      // --------------------------------------------------------
      const wastageQuery = `
        SELECT 
          kmi.loom_id,
          SUM(
            (kbl.actual_cut_length * rl.width * rl.gsm) / 1000000000
          ) AS total_wastage_kg
        FROM kwis_body_log kbl
        JOIN kwis_roll_manufacturing_info kmi 
          ON kbl.robro_roll_id = kmi.robro_roll_id
        JOIN kwis_rolls_log rl
          ON rl.robro_roll_id = kmi.robro_roll_id
        WHERE rl.roll_start_time BETWEEN ? AND ?
          AND kbl.body_cut_type = 'D'
        GROUP BY kmi.loom_id
      `;

      await db.addQuery("wastageQuery", wastageQuery);
      const wastageResult = await db.runQuery("wastageQuery", [startDate, endDate]);
      const wastageRows = wastageResult.data || [];

      let loomWastageMap = {};

      wastageRows.forEach(row => {
        loomWastageMap[row.loom_id] = 
          row.total_wastage_kg ? Number(row.total_wastage_kg).toFixed(2) : 0;
      });

      // Create loom -> defect map
      let loomDefectMap = {};
      defectRows.forEach(row => {
        if (!loomDefectMap[row.loom_id]) {
          loomDefectMap[row.loom_id] = {};
        }
        loomDefectMap[row.loom_id][row.defect_type] = row.defect_count;
      });

      // --------------------------------------------------------
      // 4 Create Worksheet
      // --------------------------------------------------------
      const loomWorksheet = workbook.addWorksheet("Loom Report");

      const statusMap = {
        loom_report_data: loom_report_data_status
      };
      const COLUMN_MASTER = {
        loom_report_data: {
          loom_id : { header: "Loom ID", width: 20 },
          total_rolls: { header: "Total Rolls", width: 20 },
          total_length: { header: "Total Length", width: 20 },
          total_defects: { header: "Total Defects", width: 20 },
          total_wastage_kg: { header: "Total Wastage (KG)", width: 25 },
          category_wise_defect_count: { header: "Category Wise Defect Count", width: 20 }
        }
      };

      const dynamicColumns = buildColumns(column_name_array, statusMap, COLUMN_MASTER, false, uniqueDefectTypes);
      loomWorksheet.columns = [...dynamicColumns];

      // --------------------------------------------------------
      // 5 Add Rows
      // --------------------------------------------------------

      const headerRow = loomWorksheet.getRow(1);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F497D" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
        headerRow.commit(); // Header lock ho gaya
      rollsLogResult.forEach((data) => {

        const defectCols = {};
        uniqueDefectTypes.forEach(defect => {
          const key = defect.header.replace(/\s+/g, "_").toLowerCase();
          defectCols[key] = loomDefectMap[data.loom_id]?.[defect.header] || 0;
        });

        let rowData = {
          loom_id: data.loom_id || "-",
          total_rolls: data.total_rolls || 0,
          total_length: data.total_length ? Number(data.total_length).toFixed(2) : 0,
          total_defects: data.total_defects || 0,
          total_wastage_kg: loomWastageMap[data.loom_id] || 0
        };

        rowData = { ...rowData, ...defectCols };

        loomWorksheet.addRow(rowData).commit();
      });
    }

    if (usage_report_data_status) {
      // --------------------------------------------------------
      // 1 Usage Report Query
      // --------------------------------------------------------
      const usageReportQuery = `
           WITH RECURSIVE date_range AS (
            SELECT DATE(?) AS report_date
            UNION ALL
            SELECT DATE_ADD(report_date, INTERVAL 1 DAY)
            FROM date_range
            WHERE report_date < DATE(?)
        ),

        machine_data AS (
            SELECT 
                DATE(state_start_time) AS report_date,

                SUM(
                    TIME_TO_SEC(
                        TIMEDIFF(state_end_time, state_start_time)
                    )
                ) / 60 AS total_on_min,

                SUM(
                    CASE 
                        WHEN state_code = 2 THEN 
                            TIME_TO_SEC(
                                TIMEDIFF(state_end_time, state_start_time)
                            )
                        ELSE 0
                    END
                ) / 60 AS engaged_min,

                COUNT(state_id) AS state_count

            FROM kvp_system_component_state_log
            GROUP BY DATE(state_start_time)
        ),

        roll_data AS (
            SELECT 
                DATE(roll_start_time) AS report_date,

                GROUP_CONCAT(DISTINCT robro_roll_id) AS roll_ids,

                SUM(roll_length) AS total_roll_length,

                SUM(
                    TIME_TO_SEC(
                        TIMEDIFF(roll_end_time, roll_start_time)
                    )
                ) / 60 AS total_inspection_time_min

            FROM kwis_rolls_log
            GROUP BY DATE(roll_start_time)
        )

        SELECT 
            d.report_date,

            r.roll_ids,

            SEC_TO_TIME(COALESCE(m.total_on_min * 60, 0)) AS machine_on_hours,

            SEC_TO_TIME(
                CASE 
                    WHEN m.state_count IS NULL THEN 24 * 3600
                    ELSE (24 * 3600) - COALESCE(m.total_on_min * 60, 0)
                END
            ) AS machine_off_hours,

            SEC_TO_TIME(COALESCE(m.engaged_min * 60, 0)) AS engaged_hours,

            COALESCE(r.total_roll_length, 0) AS total_roll_length,
            COALESCE(r.total_inspection_time_min, 0) AS total_inspection_time_min,

            CASE 
                WHEN COALESCE(r.total_inspection_time_min, 0) = 0 THEN 0
                ELSE ROUND(
                    r.total_roll_length / r.total_inspection_time_min,
                2)
            END AS speed_mpm

        FROM date_range d

        LEFT JOIN machine_data m
            ON d.report_date = m.report_date

        LEFT JOIN roll_data r
            ON d.report_date = r.report_date

        ORDER BY d.report_date;
      `;

      await db.addQuery("usageReportQuery", usageReportQuery);
      const usageReportResult = await db.runQuery("usageReportQuery", [startDate, endDate]);

      const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
      };
      // --------------------------------------------------------
      // 4 Create Worksheet
      // --------------------------------------------------------
      const usageWorksheet = workbook.addWorksheet("Usage Report");

      const statusMap = {
        usage_report_data: usage_report_data_status
      };
      const COLUMN_MASTER = {
        usage_report_data: {
          date: { header: "Date", width: 20 },
          machine_id : { header: "Machine ID", width: 20 },
          machine_on_hours: { header: "Machine ON Hours", width: 20 },
          machine_off_hours: { header: "Machine OFF Hours", width: 20 },
          engaged_hours: { header: "Engaged Hours", width: 20 },
          average_speed_mpm: { header: "Average Speed (MPM)", width: 25 }
        }
      };

      const dynamicColumns = buildColumns(column_name_array, statusMap, COLUMN_MASTER, false, []);
      usageWorksheet.columns = [...dynamicColumns];

      const headerRow = usageWorksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F497D" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      headerRow.commit(); // Header lock ho gaya

      // --------------------------------------------------------
      // 5 Add Rows
      // --------------------------------------------------------
      usageReportResult?.data?.forEach((data) => {

        let rowData = {
          date: formatDate(data.report_date) || "-",
          machine_id: machineName || "-",
          machine_on_hours: data.machine_on_hours || "00:00:00",
          machine_off_hours: data.machine_off_hours || "00:00:00",
          engaged_hours: data.engaged_hours || "00:00:00",
          average_speed_mpm: data.speed_mpm || 0
        };

        usageWorksheet.addRow(rowData).commit();
      });
    }
    await workbook.commit();

  } catch (err) {
    console.error("Error creating Excel:", err);
    res.status(500).json({ message: "Failed to create Excel file" });
  }
};

function formatTimestamp(date) {
  const formattedTimestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
  return formattedTimestamp;
}

function applySorting(dataArray, sortingColumn, sortingOrder = "asc") {

  if (!sortingColumn) return dataArray;

  const getSecondsFromDateTime = (dateTime) => {
    if (!dateTime) return null;
    const d = new Date(dateTime);
    if (isNaN(d)) return null;
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  };

  const getDateOnly = (dateTime) => {
    if (!dateTime) return null;
    const d = new Date(dateTime);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const getDateTime = (dateTime) => {
    if (!dateTime) return null;
    const d = new Date(dateTime);
    if (isNaN(d)) return null;
    return d.getTime();
  };

  const getValue = (row) => {

    switch (sortingColumn) {

      // =========================
      // 1️⃣ Roll Details
      // =========================
      case "roll_number": return row.customer_roll_id;
      case "gsm": return Number(row.gsm);
      case "width": return Number(row.width);
      case "roll_length": return Number(row.roll_length);
      case "loom_number": return row.loom_number;
      case "status_of_roll": return row.status_of_roll;
      case "data_status": return row.data_status;

      // =========================
      // 2️⃣ Inspection Details
      // =========================
      case "master_start_datetime": return getDateTime(row.roll_start_date_time);
      case "master_end_datetime": return getDateTime(row.roll_end_date_time);

      case "master_start_date": return getDateOnly(row.roll_start_date_time);
      case "master_end_date": return getDateOnly(row.roll_end_date_time);

      case "master_start_time": return getSecondsFromDateTime(row.roll_start_date_time);
      case "master_end_time": return getSecondsFromDateTime(row.roll_end_date_time);

      case "inspected_length_m": return Number(row.inspected_length);
      case "total_inspection_time_min": return Number(row.master_duration);
      case "master_machine_id": return row.machine_name;
      case "corrected_avg_master_speed": return Number(row.corrected_avg_master_speed);
      case "average_master_speed_mpm": return Number(row.average_master_speed);
      case "total_defects_inspected": return Number(row.total_defects_inspected);
      case "avg_defects_per_1000_meter": return Number(row.avg_defects_per_1000_meter);

      // =========================
      // 3️⃣ Review Details
      // =========================
      case "review_start_datetime": return getDateTime(row.start_review_date_time);
      case "review_end_datetime": return getDateTime(row.end_review_date_time);

      case "review_start_date": return getDateOnly(row.start_review_date_time);
      case "review_end_date": return getDateOnly(row.end_review_date_time);

      case "review_start_time": return getSecondsFromDateTime(row.start_review_date_time);
      case "review_end_time": return getSecondsFromDateTime(row.end_review_date_time);

      case "total_review_time_min": return Number(row.review_duration);
      case "total_defects_deleted_during_review": return Number(row.total_defects_deleted);

      // =========================
      // 4️⃣ Repair Details
      // =========================
      case "repair_machine_id": return row.repair_machine_name;

      case "repair_start_datetime": return getDateTime(row.repair_start_date_time);
      case "repair_end_datetime": return getDateTime(row.repair_end_date_time);

      case "repair_start_date": return getDateOnly(row.repair_start_date_time);
      case "repair_end_date": return getDateOnly(row.repair_end_date_time);

      case "repair_start_time": return getSecondsFromDateTime(row.repair_start_date_time);
      case "repair_end_time": return getSecondsFromDateTime(row.repair_end_date_time);

      case "repair_time_taken_min": return Number(row.repair_duration);
      case "repair_meter": return Number(row.repair_length);
      case "average_repair_speed_mpm": return Number(row.average_repair_speed);
      case "total_defects_approved_for_repair": return Number(row.total_defects_approved);
      case "defects_actually_repaired": return Number(row.defects_repaired);
      case "defects_actually_override": return Number(row.defects_override);
      case "number_of_splices_done": return Number(row.splices_done);
      case "length_removed_during_splicing_m": return Number(row.length_removed);

      // =========================
      // 5 Defect Details
      // =========================
      // case "category_wise_defect_count": return Number(row.category_wise_defect_count);
      case "enable_defects": return Number(row.enable_defects);
      case "disable_defects": return Number(row.disable_defects);

      // =========================
      // 6 Body Details
      // =========================
      case "primary_body": return row.primary_body;
      case "secondary_body": return row.secondary_body;
      case "tertiary_body": return row.tertiary_body;
      case "wastage_information": return row.wastage_information;

      default:
        return row[sortingColumn];
    }
  };

  return dataArray.sort((a, b) => {

    let valueA = getValue(a);
    let valueB = getValue(b);

    // NULL Handling
    if (valueA == null) return 1;
    if (valueB == null) return -1;

    // String compare
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortingOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    // Number compare
    return sortingOrder === "asc"
      ? valueA - valueB
      : valueB - valueA;
  });
}

function buildColumns(column_name_array, statusMap, COLUMN_MASTER, bodyDetailsStatus, defectColumns) {
  let dynamicColumns = [];
  column_name_array.forEach(section => {
    if (!statusMap[section.report_type]) return;

    const masterConfig = COLUMN_MASTER[section.report_type];
    if (!masterConfig) return;
    if (section.report_type === 'body_details' && !bodyDetailsStatus) return;
    section.column_name.forEach(col => {
      if (col.checked && masterConfig[col.key]) {
        const config = masterConfig[col.key];
        if (col.key !== 'category_wise_defect_count') {
          dynamicColumns.push({
            header: col.name,
            key: col.key,
            width: config.width || 20
          });
        }
        else if (col.key === 'category_wise_defect_count' && defectColumns.length > 0) {
          defectColumns.forEach(defCol => {
            dynamicColumns.push({
              header: defCol.header,
              key: defCol.key,
              width: defCol.width || 20
            });
          });
        }
      }

    });

  });
  return dynamicColumns;
}

function createHeaderKeyMap(column_name_array) {
  const headerKeyMap = {};

  column_name_array.forEach(section => {
    section.column_name.forEach(col => {
      headerKeyMap[col.key] = col.name;
    });
  });

  return headerKeyMap;
}

const CheckRollUpdates = async (req, res) => {
  try {
    let {
      start_date,
      end_date,
      data_status,
      tag_name,
      recipe,
      rollStatus,
      repair_machine_id,
      reportExists,
      column_name_array,
      downloaded_date_time
    } = req.body;
    const startparts = start_date.split("/");
    const endparts = end_date.split("/");
    const startDate = `${startparts[0]}-${startparts[1]}-${startparts[2]}`;
    const endDate = `${endparts[0]}-${endparts[1]}-${endparts[2]}`;
    const headerKeyMap = createHeaderKeyMap(column_name_array);
    let downloadedDateFormatted;
    if (reportExists) {
      //   const currentDateTime = new Date();

      const downloadedDate = new Date(downloaded_date_time);

      downloadedDateFormatted = formatDated(downloadedDate, true);

    }
    const roll_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'roll_details')).length > 0 ? true : false) : false
    const inspection_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'inspection_details')).length > 0 ? true : false) : false
    const review_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'review_details')).length > 0 ? true : false) : false
    const repair_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'repair_details')).length > 0 ? true : false) : false
    const defects_summary_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'defects_summary')).length > 0 ? true : false) : false
    const body_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'body_details')).length > 0 ? true : false) : false
    const defects_details_status = Array.isArray(column_name_array) && column_name_array.length > 0 ? ((column_name_array.filter((data) => data.report_type === 'defects_details')).length > 0 ? true : false) : false

    if (roll_details_status || inspection_details_status || review_details_status || repair_details_status || defects_summary_status || body_details_status || defects_details_status) {
      // ----------------------------------------------------------------
      // Filters same as your code
      // ----------------------------------------------------------------
      let statusConditionFirst = "";
      let statusParam = [];
      let userTagCondition = "";
      let recipeCondition = "";
      let recipeParam = [];
      let rollStatusCondition = "";
      let rollStatusParams = [];
      let rollStatusMachineCondition = "";
      let rollStatusMachineParams = [];
      // Roll status filter
      const rollStatusFilters = [];
      if (rollStatus) {
        if (rollStatus === "1" || rollStatus === 1) {
          rollStatusFilters.push(1, 5);
        } else {
          rollStatusFilters.push(rollStatus);
        }
      }
      if (rollStatusFilters.length > 0) {
        if (rollStatus === "null") {
          rollStatusCondition = ` AND rl.roll_status IS NULL`;
        } else {
          rollStatusCondition = ` AND rl.roll_status IN (${rollStatusFilters.map(() => "?").join(",")})`;
          rollStatusParams = [...rollStatusFilters];
        }
      }
      if (Array.isArray(repair_machine_id) && repair_machine_id.length > 0) {
        rollStatusMachineCondition = ` AND krrj.machine_id IN (${repair_machine_id.map(() => "?").join(",")})`;
        rollStatusMachineParams = [...repair_machine_id];
      }

      // Data Status Filter
      if (data_status && data_status.trim() !== "") {
        if (data_status === "Live") {
          statusConditionFirst = ` AND kdaj.job_id IS NULL`;
        } else if (
          ["BACKUP", "ARCHIVE", "JOB RESTORED", "BACKUP DELETED", "BACKUP AVALIABLE"].includes(data_status)
        ) {
          const newStatus =
            data_status === "BACKUP"
              ? 1
              : data_status === "BACKUP AVALIABLE"
                ? 2
                : data_status === "BACKUP DELETED"
                  ? 3
                  : data_status === "JOB RESTORED"
                    ? 4
                    : 0;

          statusConditionFirst = ` AND kdaj.backup_status = ?`;
          statusParam = [newStatus];
        }
      }

      // Tag Name Filter
      if (tag_name) {
        userTagCondition = ` AND ts.user_tag_id IN (${tag_name})`;
      }

      // Recipe Filter
      if (recipe && recipe !== "") {
        recipeCondition = ` AND kjl.recipe = ?`;
        recipeParam = [recipe];
      }

        // ----------------------------------------------------------------
        // 1) BASE QUERY (FAST) — Get roll list ONLY
        // ----------------------------------------------------------------
        const rollListQuery = `
          WITH segment_counts AS (
              SELECT
                  robro_roll_id,
                  FLOOR(defect_top_left_y_mm / 1000000) AS segment_index,
                  COUNT(*) AS defects_in_segment
              FROM kwis_defects_log
              GROUP BY robro_roll_id, segment_index
          ),
          avg_defects AS (
              SELECT
                  robro_roll_id,
                  CASE 
                      WHEN COUNT(*) <= 1 THEN NULL
                      ELSE CAST(AVG(defects_in_segment) AS DECIMAL(10,2))
                  END AS avg_defects_per_1000_meter
              FROM segment_counts
              GROUP BY robro_roll_id
          )
      
          SELECT
              rl.robro_roll_id,
              rl.roll_start_time As roll_start_date_time,
              rl.roll_end_time As roll_end_date_time,
              rl.roll_length,
              rl.inspected_length,
              rl.gsm,
              rl.width,
              rl.machine_id,
              rl.customer_roll_id,
              rl.roll_status,
              rl.total_defects,
              rl.current_repair_meter,
              MAX(kmi.loom_id) AS loom_number,
              MAX(kdaj.backup_status) AS backup_status,
              COALESCE(ad.avg_defects_per_1000_meter, 0) AS avg_defects_per_1000_meter
          FROM kwis_rolls_log AS rl
          LEFT JOIN kvp_data_archive_job AS kdaj
                ON kdaj.job_id = rl.robro_roll_id
          LEFT JOIN kwis_roll_manufacturing_info AS kmi
                ON rl.robro_roll_id = kmi.robro_roll_id
          LEFT JOIN kwis_jobs_log AS kjl
                ON rl.robro_roll_id = kjl.robro_roll_id
          LEFT JOIN kwis_tag_settings AS ts
                ON rl.robro_roll_id = ts.robro_roll_id
          LEFT JOIN kwis_roll_repair_job AS krrj
                ON rl.robro_roll_id = krrj.robro_roll_id
          LEFT JOIN avg_defects AS ad
                ON ad.robro_roll_id = rl.robro_roll_id
          WHERE 1=1
              ${userTagCondition ? `${userTagCondition}` : ''}
              AND rl.roll_start_time BETWEEN ? AND ?
              ${reportExists ?
            "OR rl.updated_at BETWEEN ? AND ?" : ""}
              ${rollStatusCondition ? `${rollStatusCondition}` : ''}
              ${statusConditionFirst ? `${statusConditionFirst}` : ''}
              ${recipeCondition ? `${recipeCondition}` : ''}
              ${rollStatusMachineCondition ? `${rollStatusMachineCondition}` : ""}
          GROUP BY rl.robro_roll_id
          ORDER BY rl.customer_roll_id ASC;
          `;
        let rollParams;
        if (reportExists) {
          rollParams = [
            downloadedDateFormatted,
            endDate,
            downloadedDateFormatted,
            endDate,
            ...rollStatusParams,
            ...statusParam,
            ...recipeParam,
            ...rollStatusMachineParams
          ];
        }
        else {
          rollParams = [
            startDate,
            endDate,
            ...rollStatusParams,
            ...statusParam,
            ...recipeParam,
            ...rollStatusMachineParams
          ];
        }

        await db.addQuery("rollListQuery", rollListQuery);
        const rollList = await db.runQuery("rollListQuery", rollParams);
        let rollsListData = rollList.data || [];
        if(rollsListData.length === 0) {
          return res.status(200).json(
            { 
              message: "No data available for the selected filters",
              count: 0,
              roll_report_exists: true
            });
        }
        else {
          return res.status(200).json(
            { 
              message: "Data fetched successfully",
              count: rollsListData.length,
              roll_report_exists: true
            });
        }

    }
    else {
      return res.status(200).json({ 
        message: "No report type selected",
        count: 0,
        roll_report_exists: false
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch data" });
  }
};

const getUserSheetNames = (filePath) => {

  const zip = new AdmZip(filePath);

  const workbookEntry = zip.getEntry("xl/workbook.xml");
  if (!workbookEntry) {
    return [];
  }

  const workbookXml = workbookEntry.getData().toString("utf8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  const parsed = parser.parse(workbookXml);

  let sheets = parsed?.workbook?.sheets?.sheet;

  if (!sheets) {
    return [];
  }

  if (!Array.isArray(sheets)) {
    sheets = [sheets];
  }

  const SYSTEM_SHEETS = [
    "Combined Roll Report",
    "Combined Loom Report",
    "Combined Usage Report"
  ];

  const sheetNames = sheets.map((s, i) => {
    const name = s["@_name"];
    return name;
  });

  const userSheets = sheetNames.filter(
    name => name && !SYSTEM_SHEETS.includes(name)
  );

  return userSheets;
};

const getSharedStringValue = (zip, index) => {
  try {
    const xml = zip.readAsText("xl/sharedStrings.xml");
    const matches = [...xml.matchAll(/<t[^>]*>(.*?)<\/t>/g)];
    return matches[index] ? matches[index][1] : "";
  } catch {
    return "";
  }
};

const mergeUserSheets = (oldFile, newFile, userSheetNames) => {

  const oldZip = new AdmZip(oldFile);
  const newZip = new AdmZip(newFile);

  let newWorkbookXml = newZip.readAsText("xl/workbook.xml");
  let newRelsXml = newZip.readAsText("xl/_rels/workbook.xml.rels");

  const oldWorkbookXml = oldZip.readAsText("xl/workbook.xml");
  const oldRelsXml = oldZip.readAsText("xl/_rels/workbook.xml.rels");

  let sheetIndex = 100;
  let relIndex = 100;

  userSheetNames.forEach((sheetName) => {

    // 🔍 Find sheet
    const match = oldWorkbookXml.match(
      new RegExp(
        `<sheet[^>]*name="([^"]*${sheetName}[^"]*)"[^>]*r:id="(rId\\d+)"`,
        "i"
      )
    );

    if (!match) {
      console.log("Sheet not found:", sheetName);
      return;
    }

    const actualSheetName = match[1];
    const rId = match[2];


    // 🔍 Find relation
    const relMatch = oldRelsXml.match(
      new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]+)"`)
    );

    if (!relMatch) {
      return;
    }

    const sheetTarget = relMatch[1];
    const oldSheetPath = "xl/" + sheetTarget;

    let sheetData = oldZip.readFile(oldSheetPath);
    if (!sheetData) {
      return;
    }

    let sheetXml = sheetData.toString();

    //  FIX: Convert shared string → inline string
    sheetXml = sheetXml.replace(
      /t="s"><v>(\d+)<\/v>/g,
      (match, index) => {
        const value = getSharedStringValue(oldZip, index);
        return `t="inlineStr"><is><t>${value}</t></is>`;
      }
    );

    //  FIX: Remove stale cached <v> values from formula cells so Excel
    //         is forced to recalculate on open (fixes outdated row-count formulas
    //         like =COUNTA('Combined Roll Report'!A:A)-1 after regeneration)
    sheetXml = sheetXml.replace(
      /<c([^>]*)><f([^>]*)>([\s\S]*?)<\/f><v>[^<]*<\/v><\/c>/g,
      '<c$1><f$2>$3</f></c>'
    );

    const newSheetId = sheetIndex++;
    const newRelId = "rId" + relIndex++;
    const newSheetPath = `xl/worksheets/sheet${newSheetId}.xml`;

    //  Add updated sheet
    newZip.addFile(newSheetPath, Buffer.from(sheetXml));


    //  COPY sheet rels (charts link)
    const relPath = oldSheetPath.replace("worksheets/", "worksheets/_rels/") + ".rels";
    const relData = oldZip.readFile(relPath);

    if (relData) {
      const newRelPath = `xl/worksheets/_rels/sheet${newSheetId}.xml.rels`;
      newZip.addFile(newRelPath, relData);
    }

    //  COPY drawings + drawing rels + charts + chart rels (ALL required for pie chart)
    const chartAssetPrefixes = [
      "xl/drawings/",          // drawing XMLs (anchors/positions)
      "xl/drawings/_rels/",    //  MISSING: links drawing → chart file
      "xl/charts/",            //  MISSING: actual chart data XML
      "xl/charts/_rels/",      //  MISSING: chart's own rels (colour styles etc.)
    ];

    chartAssetPrefixes.forEach(prefix => {
      oldZip.getEntries().forEach(entry => {
        if (entry.entryName.startsWith(prefix)) {
          if (!newZip.getEntry(entry.entryName)) {
            newZip.addFile(entry.entryName, entry.getData());
          }
        }
      });
    });

    //  SYNC [Content_Types].xml — add chart/drawing overrides from old file
    // Without this Excel doesn't know the MIME type of the new chart entries
    const oldContentTypes = oldZip.readAsText("[Content_Types].xml");
    let newContentTypes = newZip.readAsText("[Content_Types].xml");

    const overrideRegex = /<Override PartName="\/xl\/(charts|drawings)[^"]*"[^/]*\/>/g;
    const oldOverrides = oldContentTypes.match(overrideRegex) || [];

    oldOverrides.forEach(override => {
      if (!newContentTypes.includes(override)) {
        newContentTypes = newContentTypes.replace(
          "</Types>",
          `${override}</Types>`
        );
      }
    });

    newZip.updateFile("[Content_Types].xml", Buffer.from(newContentTypes));

    //  COPY media (images)
    oldZip.getEntries().forEach(entry => {
      if (entry.entryName.startsWith("xl/media/")) {
        if (!newZip.getEntry(entry.entryName)) {
          newZip.addFile(entry.entryName, entry.getData());
        }
      }
    });

    //  COPY styles (formatting safe)
    const styles = oldZip.readFile("xl/styles.xml");
    if (styles) {
      newZip.addFile("xl/styles.xml", styles);
    }

    //  workbook.xml update (NO _copy)
    const newSheetEntry = `<sheet name="${actualSheetName}" sheetId="${newSheetId}" r:id="${newRelId}"/>`;

    newWorkbookXml = newWorkbookXml.replace(
      "</sheets>",
      `${newSheetEntry}</sheets>`
    );

    //  rels update
    const newRelEntry = `<Relationship Id="${newRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${newSheetId}.xml"/>`;

    newRelsXml = newRelsXml.replace(
      "</Relationships>",
      `${newRelEntry}</Relationships>`
    );

  });

  //  FIX: Force Excel to fully recalculate all formulas when the file is opened.
  //         Without this, Excel may show stale formula results from the old cached <v> values.
  if (!newWorkbookXml.includes('calcPr')) {
    newWorkbookXml = newWorkbookXml.replace(
      '</workbook>',
      '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>'
    );
  } else {
    newWorkbookXml = newWorkbookXml.replace(
      /<calcPr([^/]*)\/?>/,
      (m, attrs) => {
        // Ensure fullCalcOnLoad="1" and reset calcId so Excel knows to recalc
        const updated = attrs
          .replace(/fullCalcOnLoad="[^"]*"/, '')
          .replace(/calcId="[^"]*"/, '');
        return `<calcPr${updated} calcId="0" fullCalcOnLoad="1"/>`;
      }
    );
  }

  //  Save updated XML
  newZip.updateFile("xl/workbook.xml", Buffer.from(newWorkbookXml));
  newZip.updateFile("xl/_rels/workbook.xml.rels", Buffer.from(newRelsXml));

  newZip.writeZip(newFile);

};

const normalizeExcelZip = async (filePath) => {
  try {
    const raw = fs.readFileSync(filePath);
    const jszip = await JSZip.loadAsync(raw);          // JSZip handles streaming ZIPs 

    const newZip = new JSZip();
    for (const [name, file] of Object.entries(jszip.files)) {
      if (!file.dir) {
        const content = await file.async("nodebuffer");
        newZip.file(name, content);
      }
    }

    const normalized = await newZip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    fs.writeFileSync(filePath, normalized);           
  } catch (err) {
    console.warn(" normalizeExcelZip skipped (file may already be standard):", err.message);
  }
};

module.exports = {
  getExcelBinaryData,
  createExcelSheetForEmail,
  CheckRollUpdates
};