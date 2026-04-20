const create_kwis_body_log_table = `CREATE TABLE IF NOT EXISTS kwis_body_log (
    body_id BIGINT(20) NOT NULL,
    job_id BIGINT(20) NULL DEFAULT NULL,
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_rolls_log(robro_roll_id)',
    actual_cut_length INT NOT NULL,
    body_cut_type VARCHAR(255) NULL DEFAULT NULL,
    estimated_length_saved FLOAT NULL DEFAULT NULL,
    balance_roll_length FLOAT NULL DEFAULT NULL,
    punch_saved TINYINT(1) NOT NULL,
    cut_position_in_roll FLOAT NULL DEFAULT NULL,
    updated_at DATETIME NOT NULL,
    work_order_id BIGINT NULL,
    PRIMARY KEY (body_id, robro_roll_id),
    INDEX idx_job_id (job_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_updated_at (updated_at)
  );`;

const create_kwis_body_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_body_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    body_id INT NOT NULL COMMENT 'kwis_body_log(body_id)',
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_body_log(robro_roll_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE INDEX unique_body_id (body_id, robro_roll_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_body_log_insert
    AFTER INSERT ON kwis_body_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_body_log_sync_log (body_id, robro_roll_id, operation_type, status)
        VALUES (NEW.body_id, NEW.robro_roll_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_body_log_update
    AFTER UPDATE ON kwis_body_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_body_log_sync_log (body_id, robro_roll_id, operation_type, status)
        VALUES (NEW.body_id, NEW.robro_roll_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_body_log_sync_log_delete
    AFTER DELETE ON kwis_body_log_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_body_log WHERE body_id = OLD.body_id AND robro_roll_id = OLD.robro_roll_id;
    END;`;

module.exports = {
    create_kwis_body_log_table,
    create_kwis_body_log_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger
};
