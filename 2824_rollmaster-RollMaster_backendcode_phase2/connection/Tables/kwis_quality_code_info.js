const create_kwis_quality_code_info_table = `CREATE TABLE IF NOT EXISTS kwis_quality_code_info (
    quality_code_id INT(11) AUTO_INCREMENT,
    quality_code VARCHAR(255) NOT NULL UNIQUE,
    filter_value_json JSON NOT NULL,
    status TINYINT(4) NOT NULL COMMENT '"0 = not apply config, 1 = apply config"',
    isdisabled TINYINT(4) NOT NULL DEFAULT 0,
    PRIMARY KEY (quality_code_id)
) `

const create_kwis_quality_code_info_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_quality_code_info_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    quality_code_id INT NOT NULL COMMENT 'kwis_quality_code_info(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_quality_code_info_insert
    AFTER INSERT ON kwis_quality_code_info
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_quality_code_info_sync_log (quality_code_id, operation_type, status)
        VALUES (NEW.quality_code_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_quality_code_info_update
    AFTER UPDATE ON kwis_quality_code_info
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_quality_code_info_sync_log (quality_code_id, operation_type, status)
        VALUES (NEW.quality_code_id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_quality_code_info_sync_log_delete
//     AFTER DELETE ON kwis_quality_code_info_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_quality_code_info WHERE quality_code_id = OLD.quality_code_id;
//     END;`;

module.exports = {
    create_kwis_quality_code_info_table,
    create_kwis_quality_code_info_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger,
};