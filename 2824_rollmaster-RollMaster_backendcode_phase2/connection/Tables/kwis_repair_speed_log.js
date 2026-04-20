const create_kwis_repair_speed_log_table = `CREATE TABLE IF NOT EXISTS kwis_repair_speed_log (
    repair_speed_id INT AUTO_INCREMENT PRIMARY KEY,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_meter  FLOAT NOT NULL,
    current_speed FLOAT NOT NULL,
    repair_job_id  INT NOT NULL,
    robro_roll_id BIGINT,
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_repair_job_id (repair_job_id)
);`;

const create_kwis_repair_speed_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_repair_speed_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    repair_speed_id INT NOT NULL COMMENT 'kwis_repair_speed_log (repair_speed_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_repair_speed_log_insert
    AFTER INSERT ON kwis_repair_speed_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_repair_speed_log_sync_log (repair_speed_id, operation_type, status)
        VALUES (NEW.repair_speed_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_repair_speed_log_update
    AFTER UPDATE ON kwis_repair_speed_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_repair_speed_log_sync_log (repair_speed_id, operation_type, status)
        VALUES (NEW.repair_speed_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_repair_speed_log_sync_log_delete
    AFTER DELETE ON kwis_repair_speed_log_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_repair_speed_log WHERE repair_speed_id = OLD.repair_speed_id;
    END;`;

module.exports = {
    create_kwis_repair_speed_log_table,
    create_kwis_repair_speed_log_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger,
};
