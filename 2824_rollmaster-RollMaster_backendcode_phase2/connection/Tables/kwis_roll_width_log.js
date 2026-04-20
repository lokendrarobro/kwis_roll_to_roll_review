const create_kwis_roll_width_log_table = `CREATE TABLE IF NOT EXISTS kwis_roll_width_log (
    roll_width_id BIGINT(20) NOT NULL AUTO_INCREMENT,
    robro_roll_id BIGINT(20) NULL DEFAULT NULL,
    running_meter FLOAT NOT NULL,
    fabric_start_in_x_mm FLOAT NULL,
    calculated_width FLOAT NULL DEFAULT NULL,
    status TINYINT(1) COMMENT 'Implement business logic; "0 = variation point, 1 = variation point save in kwis_defect_log"',
    updated_at DATETIME,
    width_image_path JSON,
    PRIMARY KEY (roll_width_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_running_meter (running_meter)
);`;

const create_kwis_roll_width_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_roll_width_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    roll_width_id BIGINT(20) NOT NULL,
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE INDEX unique_roll_width_id (roll_width_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_width_log_insert
    AFTER INSERT ON kwis_roll_width_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_roll_width_log_sync_log (roll_width_id, operation_type, status)
        VALUES (NEW.roll_width_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_width_log_update
    AFTER UPDATE ON kwis_roll_width_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_roll_width_log_sync_log (roll_width_id, operation_type, status)
        VALUES (NEW.roll_width_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_width_log_sync_log_delete
    AFTER DELETE ON kwis_roll_width_log_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_roll_width_log WHERE roll_width_id = OLD.roll_width_id;
    END;`;

module.exports = {
  create_kwis_roll_width_log_table,
  create_kwis_roll_width_log_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
  create_delete_trigger,
};
