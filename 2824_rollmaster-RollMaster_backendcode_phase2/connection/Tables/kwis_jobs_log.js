const create_kwis_jobs_log_table = `CREATE TABLE IF NOT EXISTS kwis_jobs_log (
    job_id BIGINT(20) NOT NULL,
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_rolls_log(robro_roll_id)',
    cut_length INT NULL,
    min_fabric_width FLOAT NULL DEFAULT NULL,
    max_fabric_width FLOAT NULL DEFAULT NULL,
    width_measurement_rate FLOAT NULL DEFAULT NULL,
    recipe VARCHAR(255) NULL DEFAULT NULL,
    updated_at DATETIME NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    user_id INT NULL,
    secondary_cut_length INT NULL,
    tertiary_cut_length INT NULL,
    batch_count INT NULL,
    job_start_meter FLOAT NULL,
    job_end_meter FLOAT NULL,
    primary_body_count INT NULL,
    secondary_body_count INT NULL,
    tertiary_body_count INT NULL,
    defective_body_count INT NULL,
    work_order_id BIGINT(20) NULL,
    PRIMARY KEY (job_id, robro_roll_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time)
);`;

const create_kwis_jobs_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_jobs_log_sync_log (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      job_id INT(11) NOT NULL COMMENT 'kwis_job_log(job_id)',
      robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_jobs_log(robro_roll_id)',
      operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
      sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
      error_message VARCHAR(500),
      UNIQUE INDEX unique_job_id (job_id,robro_roll_id, operation_type)
  );`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_jobs_log_insert
      AFTER INSERT ON kwis_jobs_log
      FOR EACH ROW
      BEGIN
          INSERT INTO kwis_jobs_log_sync_log (job_id, robro_roll_id, operation_type, status)
          VALUES (NEW.job_id, NEW.robro_roll_id, 'INSERT', 'PENDING');
      END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_jobs_log_update
      AFTER UPDATE ON kwis_jobs_log
      FOR EACH ROW
      BEGIN
          INSERT INTO kwis_jobs_log_sync_log (job_id, robro_roll_id, operation_type, status)
          VALUES (NEW.job_id, NEW.robro_roll_id, 'UPDATE', 'PENDING')
          ON DUPLICATE KEY UPDATE status = 'PENDING';
      END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_jobs_log_sync_log_delete
      AFTER DELETE ON kwis_jobs_log_sync_log
      FOR EACH ROW
      BEGIN
          DELETE FROM kwis_jobs_log WHERE job_id = OLD.job_id AND robro_roll_id = OLD.robro_roll_id;
      END;`;

module.exports = {
  create_kwis_jobs_log_table,
  create_kwis_jobs_log_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
  create_delete_trigger,
};
