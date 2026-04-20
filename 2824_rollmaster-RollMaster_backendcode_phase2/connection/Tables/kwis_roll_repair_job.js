const create_kwis_roll_repair_job_table = `CREATE TABLE IF NOT EXISTS kwis_roll_repair_job (
    id INT AUTO_INCREMENT,
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_rolls_log(robro_roll_id)',
    machine_id VARCHAR(255) NOT NULL,
    job_start_meter FLOAT NULL,
    job_end_meter VARCHAR(45) NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    updated_at DATETIME NULL,
    user_id INT NOT NULL,
    current_meter FLOAT NULL,
    PRIMARY KEY (id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_machine_id (machine_id),
    INDEX idx_updated_at (updated_at),
    INDEX idx_user_id (user_id)
);`;

const create_kwis_roll_repair_job_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_roll_repair_job_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    roll_repair_job_id INT NOT NULL COMMENT 'kwis_roll_repair_job(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_repair_job_insert
    AFTER INSERT ON kwis_roll_repair_job
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_roll_repair_job_sync_log (roll_repair_job_id, operation_type, status)
        VALUES (NEW.id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_repair_job_update
    AFTER UPDATE ON kwis_roll_repair_job
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_roll_repair_job_sync_log (roll_repair_job_id, operation_type, status)
        VALUES (NEW.id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_roll_repair_job_delete
    AFTER DELETE ON kwis_roll_repair_job_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_roll_repair_job WHERE id = OLD.roll_repair_job_id;
    END;`;

module.exports = {
  create_kwis_roll_repair_job_table,
  create_kwis_roll_repair_job_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
  create_delete_trigger,
};
