const create_kwis_roll_manufacturing_info_table = `CREATE TABLE IF NOT EXISTS kwis_roll_manufacturing_info (
    manufacturing_id INT NOT NULL AUTO_INCREMENT,
    robro_roll_id BIGINT(20) NULL DEFAULT NULL,
    loom_id VARCHAR(45) NULL DEFAULT NULL,
    operator_name VARCHAR(45) NULL DEFAULT NULL,
    start_time DATETIME NULL DEFAULT NULL,
    end_time DATETIME NULL DEFAULT NULL,
    start_meter FLOAT NULL DEFAULT NULL,
    end_meter FLOAT NULL DEFAULT NULL,
    PRIMARY KEY (manufacturing_id)
);`;

const create_kwis_roll_manufacturing_info_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_roll_manufacturing_info_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    manufacturing_id INT NOT NULL COMMENT 'kwis_roll_manufacturing_info(manufacturing_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL DEFAULT 'PENDING',
    error_message VARCHAR(500),
    UNIQUE INDEX unique_manufacturing_id (manufacturing_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_manufacturing_info_insert
AFTER INSERT ON kwis_roll_manufacturing_info
FOR EACH ROW
BEGIN
    INSERT INTO kwis_roll_manufacturing_info_sync_log (manufacturing_id, operation_type, status)
    VALUES (NEW.manufacturing_id, 'INSERT', 'PENDING');
END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_manufacturing_info_update
AFTER UPDATE ON kwis_roll_manufacturing_info
FOR EACH ROW
BEGIN
    INSERT INTO kwis_roll_manufacturing_info_sync_log (manufacturing_id, operation_type, status)
    VALUES (NEW.manufacturing_id, 'UPDATE', 'PENDING')
    ON DUPLICATE KEY UPDATE status = 'PENDING';
END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_manufacturing_info_delete
AFTER DELETE ON kwis_roll_manufacturing_info
FOR EACH ROW
BEGIN
    INSERT INTO kwis_roll_manufacturing_info_sync_log (manufacturing_id, operation_type, status)
    VALUES (OLD.manufacturing_id, 'DELETE', 'PENDING');
END;`;

module.exports = {
    create_kwis_roll_manufacturing_info_table,
    create_kwis_roll_manufacturing_info_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger,
};
