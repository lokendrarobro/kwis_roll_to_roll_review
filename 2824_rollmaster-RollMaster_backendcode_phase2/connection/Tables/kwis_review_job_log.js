const create_kwis_review_job_log_table = `CREATE TABLE IF NOT EXISTS kwis_review_job_log (
    review_job_id INT AUTO_INCREMENT,
    robro_roll_id BIGINT(20) NULL COMMENT 'kwis_rolls_log(robro_roll_id)',
    user_id INT NULL COMMENT 'KVP login user id',
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    updated_at DATETIME NULL,
    PRIMARY KEY (review_job_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
);`;

const create_kwis_review_job_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_review_job_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    review_job_id INT NOT NULL COMMENT 'kwis_review_job_log (review_job_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `  
CREATE TRIGGER IF NOT EXISTS trg_kwis_review_job_log_insert
AFTER INSERT ON kwis_review_job_log
FOR EACH ROW
BEGIN
    INSERT INTO kwis_review_job_log_sync_log (review_job_id, operation_type, status)
    VALUES (NEW.review_job_id, 'INSERT', 'PENDING');
END;
`;

const create_update_trigger = `
CREATE TRIGGER IF NOT EXISTS trg_kwis_review_job_log_update
AFTER UPDATE ON kwis_review_job_log
FOR EACH ROW
BEGIN
    INSERT INTO kwis_review_job_log_sync_log (review_job_id, operation_type, status)
    VALUES (NEW.review_job_id, 'UPDATE', 'PENDING')
    ON DUPLICATE KEY UPDATE status = 'PENDING';
END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_review_job_log_delete
AFTER DELETE ON kwis_review_job_log_sync_log
FOR EACH ROW
BEGIN
    DELETE FROM kwis_review_job_log WHERE review_job_id = OLD.review_job_id;
END;
`;

module.exports = {
  create_kwis_review_job_log_table,
  create_kwis_review_job_log_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
  create_delete_trigger,
};
