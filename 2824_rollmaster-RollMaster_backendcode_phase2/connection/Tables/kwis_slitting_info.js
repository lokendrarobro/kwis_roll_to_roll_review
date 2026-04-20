const create_kwis_slitting_info_table = `CREATE TABLE IF NOT EXISTS kwis_slitting_info (
    slitting_id INT AUTO_INCREMENT,
    robro_roll_id BIGINT,
    child_roll_id VARCHAR(255),
    x_roll_start_mm FLOAT,
    x_roll_end_mm FLOAT,
    y_roll_start_mm FLOAT,
    y_roll_end_mm FLOAT,
    slitting_type VARCHAR(45),
    PRIMARY KEY (slitting_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_child_roll_id (child_roll_id),
    INDEX idx_slitting_type (slitting_type)
);`;

const create_kwis_slitting_info_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_slitting_info_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    slitting_id INT NOT NULL COMMENT 'kwis_slitting_info(slitting_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL DEFAULT 'PENDING',
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_slitting_info_insert
AFTER INSERT ON kwis_slitting_info
FOR EACH ROW
BEGIN
    INSERT INTO kwis_slitting_info_sync_log (slitting_id, operation_type, status)
    VALUES (NEW.slitting_id, 'INSERT', 'PENDING');
END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_slitting_info_update
AFTER UPDATE ON kwis_slitting_info
FOR EACH ROW
BEGIN
    INSERT INTO kwis_slitting_info_sync_log (slitting_id, operation_type, status)
    VALUES (NEW.slitting_id, 'UPDATE', 'PENDING');
END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_slitting_info_delete
AFTER DELETE ON kwis_slitting_info
FOR EACH ROW
BEGIN
    INSERT INTO kwis_slitting_info_sync_log (slitting_id, operation_type, status)
    VALUES (OLD.slitting_id, 'DELETE', 'PENDING');
END;`;

module.exports = {
    create_kwis_slitting_info_table,
    create_kwis_slitting_info_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger,
};
