  const create_kwis_inspection_speed_log_table = `CREATE TABLE IF NOT EXISTS kwis_inspection_speed_log (
    speed_log_id INT NOT NULL AUTO_INCREMENT,
    robro_roll_id BIGINT(20) COMMENT 'kwis_rolls_log(robro_roll_id)',
    running_meter FLOAT,
    current_speed FLOAT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (speed_log_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_updated_at (updated_at)
  );`;

const create_kwis_inspection_speed_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_inspection_speed_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    speed_log_id INT NOT NULL COMMENT 'kwis_inspection_speed_log(speed_log_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE INDEX unique_speed_log_id (speed_log_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_inspection_speed_log_insert
    AFTER INSERT ON kwis_inspection_speed_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_inspection_speed_log_sync_log (speed_log_id, operation_type, status)
        VALUES (NEW.speed_log_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_inspection_speed_log_update
    AFTER UPDATE ON kwis_inspection_speed_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_inspection_speed_log_sync_log (speed_log_id, operation_type, status)
        VALUES (NEW.speed_log_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_inspection_speed_log_sync_log_delete
    AFTER DELETE ON kwis_inspection_speed_log_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_inspection_speed_log WHERE speed_log_id = OLD.speed_log_id;
    END;`;

module.exports = {
    create_kwis_inspection_speed_log_table,
    create_kwis_inspection_speed_log_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger
};