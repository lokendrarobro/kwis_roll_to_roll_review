const db = require("../connection/dbConnection.js");

const filterRollWidth = async (req, res, next) => {
    const { roll_id } = req.body;

    if (!roll_id) {
        return res.status(501).json({
            status: false,
            error: "Roll_id not found",
        });
    }

    let sql =
        "SELECT * FROM kwis_roll_width_log WHERE robro_roll_id = ? AND status IS NULL ORDER BY running_meter ASC;"

    let params = [roll_id];

    db.addQuery("sql", sql);
    const sqlRe = await db.runQuery("sql", params);
    if (!sqlRe?.success) {
        res.status(501).json({ error: sqlRe.error });
        return;
    }

    if (sqlRe?.data.length === 0) {
        return res.status(201).json({
            status: true,
            error: "no records found",
            data: [],
        });
    }
    const rows = sqlRe.data;
    // ---------- FETCH THREAD DATA (BULK) ----------
    const rollWidthIds = rows.map(r => r.roll_width_id);

    let threadSql = `
        SELECT 
            robro_roll_id,
            roll_width_id,
            color_thread_id,
            thread_location_mm AS thread_location
        FROM kwis_color_thread_log
        WHERE robro_roll_id = ?
          AND roll_width_id IN (${rollWidthIds.map(() => '?').join(',')})
    `;

    db.addQuery("threadSql", threadSql);
    const threadRes = await db.runQuery("threadSql", [roll_id, ...rollWidthIds]);

    // ---------- MAP THREADS ----------
    const threadMap = {};

    if (threadRes?.success && threadRes.data.length) {
        threadRes.data.forEach(t => {
            if (!threadMap[t.roll_width_id]) {
                threadMap[t.roll_width_id] = [];
            }

            threadMap[t.roll_width_id].push({
                thread_id: t.color_thread_id,
                location: t.thread_location
            });
        });
    }

    // ---------- ATTACH THREADS ----------
    const finalData = rows.map(row => ({
        ...row,
        threads: threadMap[row.roll_width_id] || []
    }));

    return res.status(200).json({
        status: true,
        error: "success",
        data: finalData,
    });
};

const paginationRollWidth = async (req, res, next) => {
    const {
        roll_id,
        start_limit,
        end_limit,
        roll_width,
        min_tolerance,
        max_tolerance,
        thread_min_tolerance,
        thread_max_tolerance,
        variation_view 
    } = req.body;

    if (!roll_id) {
        return res.status(501).json({
            status: false,
            error: "Roll_id not found",
        });
    }

    const limit = parseInt(end_limit) - parseInt(start_limit);
    let toleranceMin = roll_width && min_tolerance ? (Number(roll_width) - Number(min_tolerance)) : null;
    let toleranceMax = roll_width && max_tolerance ? (Number(roll_width) + Number(max_tolerance)) : null;

    // Build tolerance SQL
    let toleranceSql = '';
    if (toleranceMin !== null && toleranceMax !== null) {
        toleranceSql = `calculated_width >= ${toleranceMin} AND calculated_width <= ${toleranceMax}`;
    } else if (toleranceMin !== null) {
        toleranceSql = `calculated_width >= ${toleranceMin}`;
    } else if (toleranceMax !== null) {
        toleranceSql = `calculated_width <= ${toleranceMax}`;
    } else {
        toleranceSql = '1=1'; // No tolerance filter
    }

    // Build filter_status CASE
    let filterStatusCase = '';
    if (toleranceMin !== null && toleranceMax !== null) {
        filterStatusCase = `CASE WHEN calculated_width >= ${toleranceMin} AND calculated_width <= ${toleranceMax} THEN true ELSE false END AS filter_status`;
    } else {
        filterStatusCase = `true AS filter_status`;
    }

    // ---------- DATA QUERY ----------
    let dataSql = `
        SELECT *, ${filterStatusCase}
        FROM kwis_roll_width_log
        WHERE robro_roll_id = ?
          AND status IS NULL
    `;

    if (variation_view === "in-range") {
        // Only within tolerance
        dataSql += ` AND (${toleranceSql}) `;
    } else if (variation_view === "variation") {
        // Only outside tolerance
        if (toleranceMin !== null && toleranceMax !== null) {
            dataSql += ` AND (calculated_width < ${toleranceMin} OR calculated_width > ${toleranceMax}) `;
        } else if (toleranceMin !== null) {
            dataSql += ` AND (calculated_width < ${toleranceMin}) `;
        } else if (toleranceMax !== null) {
            dataSql += ` AND (calculated_width > ${toleranceMax}) `;
        }
    }
    // 'all' returns everything, so no extra filter

    dataSql += ` ORDER BY running_meter ASC LIMIT ? OFFSET ?;`;

    let params = [roll_id, limit, parseInt(start_limit)];
    db.addQuery("dataSql", dataSql);
    const sqlRe = await db.runQuery("dataSql", params);

    if (!sqlRe?.success) {
        return res.status(501).json({ error: sqlRe.error });
    }
    const rows = sqlRe.data;
    if (!rows.length) {
        return res.status(200).json({
            status: true,
            data: [],
            totalCount: 0
        });
    }

    // ---------- FETCH THREAD DATA (BULK) ----------
    const rollWidthIds = rows.map(r => r.roll_width_id);

    let threadSql = `
        SELECT 
            robro_roll_id,
            roll_width_id,
            color_thread_id,
            thread_location_mm AS thread_location
        FROM kwis_color_thread_log
        WHERE robro_roll_id = ?
          AND roll_width_id IN (${rollWidthIds.map(() => '?').join(',')})
    `;

    let threadConfigSql = `
        SELECT 
            configuration_data
        FROM kvp_system_configuration
        WHERE component_name = "AppConfig" AND component_id = 2110;
    `;

    db.addQuery("threadSql", threadSql);
    const threadRes = await db.runQuery("threadSql", [roll_id, ...rollWidthIds]);

    db.addQuery("threadConfigSql", threadConfigSql);
    const threadConfigRes = await db.runQuery("threadConfigSql", []);
    if (!threadConfigRes?.success) {
        return res.status(501).json({ error: threadConfigRes.error });
    }
    const threadConfig = threadConfigRes.data[0]?.configuration_data?.App?.["thread:config"] || {};
    const thread_location_config = threadConfig.thread_locations || [];
    // console.log("Thread Location Config:", thread_location_config);
    // ---------- MAP THREADS ----------
    const threadMap = {};
    let threadToleranceMin = thread_min_tolerance ? Number(thread_min_tolerance) : null;
    let threadToleranceMax = thread_max_tolerance ? Number(thread_max_tolerance) : null;

    // Create config lookup map
    const threadConfigMap = {};
    (thread_location_config || []).forEach(t => {
        threadConfigMap[t.thread_number] = Number(t.location_mm);
    });
    // console.log("Thread Config Map:", threadConfigMap);
    if (threadRes?.success && threadRes.data.length) {
        threadRes.data.forEach(t => {
            if (!threadMap[t.roll_width_id]) {
                threadMap[t.roll_width_id] = [];
            }
            
            const threadId = t.color_thread_id;
            const actualLocation = Number(t.thread_location);

            // Get expected location from config
            const expectedLocation = threadConfigMap[threadId];
            // console.log(`expected Thread ${threadId} location:  ${expectedLocation}`);

            let status = null; // default pass
            let min = null;
            let max = null;

            if (
                expectedLocation !== undefined &&
                threadToleranceMin !== null &&
                threadToleranceMax !== null
            ) {
                // Apply USER tolerance around expected location
                min = expectedLocation - threadToleranceMin;
                max = expectedLocation + threadToleranceMax;

                status = (actualLocation >= min && actualLocation <= max) ? 1 : 0;
            } 
            // else {
            //    // if missing config or tolerance → mark fail (or change to 1 if needed)
            //     status = 0;
            // }

            threadMap[t.roll_width_id].push({
                thread_id: threadId,
                location: actualLocation,
                expected_location: expectedLocation,
                min_tolerance: min,
                max_tolerance: max,
                tolerance_status: status
            });
        });
    }
    // ---------- ATTACH THREADS ----------
    const finalData = rows.map(row => ({
        ...row,
        threads: threadMap[row.roll_width_id] || []
    }));

    // ---------- COUNT QUERY ----------
    let countSql = `
        SELECT COUNT(*) AS totalCount
        FROM kwis_roll_width_log
        WHERE robro_roll_id = ?
          AND status IS NULL
    `;

    if (variation_view === "in-range") {
        countSql += ` AND (${toleranceSql}) `;
    } else if (variation_view === "variation") {
        if (toleranceMin !== null && toleranceMax !== null) {
            countSql += ` AND (calculated_width < ${toleranceMin} OR calculated_width > ${toleranceMax}) `;
        } else if (toleranceMin !== null) {
            countSql += ` AND (calculated_width < ${toleranceMin}) `;
        } else if (toleranceMax !== null) {
            countSql += ` AND (calculated_width > ${toleranceMax}) `;
        }
    }
    // 'all' returns everything, so no extra filter

    db.addQuery("countSql", countSql);
    const countSqlRe = await db.runQuery("countSql", [roll_id]);
    const totalCount = countSqlRe?.data[0]?.totalCount || 0;

    if (!sqlRe?.success) {
        res.status(501).json({ error: sqlRe.error });
        return;
    }

    if (sqlRe?.data.length === 0) {
        return res.status(201).json({
            status: true,
            error: "no records found",
            data: [],
        });
    }

    return res.status(200).json({
        status: true,
        error: "success",
        data: finalData,
        totalCount: totalCount
    });
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

module.exports = {
    filterRollWidth,
    paginationRollWidth
};
