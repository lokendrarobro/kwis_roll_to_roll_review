const create_kwis_rolls_log_table = `CREATE TABLE IF NOT EXISTS kwis_rolls_log (
  robro_roll_id BIGINT(20) AUTO_INCREMENT NOT NULL,
  customer_roll_id VARCHAR(255) NULL DEFAULT NULL,
  machine_id VARCHAR(255) NULL DEFAULT NULL,
  gsm INT NULL DEFAULT NULL,
  weight FLOAT NULL DEFAULT NULL,
  width FLOAT NULL DEFAULT NULL,
  material_type VARCHAR(255) NULL DEFAULT NULL,
  quality_code VARCHAR(255) NULL DEFAULT NULL,
  roll_length FLOAT NULL DEFAULT NULL,
  inspected_length FLOAT NULL DEFAULT NULL,
  roll_start_time DATETIME NULL DEFAULT NULL,
  roll_end_time DATETIME NULL DEFAULT NULL,
  roll_status INT NULL COMMENT 'Implement business logic; "0 = by default,1 = Inspected,2 = Reviewed,3 = Half Repair,4 = Repair"',
  total_defects INT NULL,
  updated_at DATETIME NOT NULL,
  current_repair_meter FLOAT NULL COMMENT 'Implement business logic;',
  note TEXT COMMENT 'User input',
  PRIMARY KEY (robro_roll_id),
  INDEX idx_robro_roll_id (robro_roll_id)
);`;

const create_kwis_rolls_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_rolls_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_rolls_log (robro_roll_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE INDEX unique_robro_roll_id (robro_roll_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_rolls_log_insert
    AFTER INSERT ON kwis_rolls_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_rolls_log_sync_log (robro_roll_id, operation_type, status)
        VALUES (NEW.robro_roll_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_rolls_log_update
    AFTER UPDATE ON kwis_rolls_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_rolls_log_sync_log (robro_roll_id, operation_type, status)
        VALUES (NEW.robro_roll_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_rolls_log_sync_log_delete
    AFTER DELETE ON kwis_rolls_log_sync_log
    FOR EACH ROW
    BEGIN
        DELETE FROM kwis_rolls_log WHERE robro_roll_id = OLD.robro_roll_id;
    END;`;

module.exports = {
  create_kwis_rolls_log_table,
  create_kwis_rolls_log_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
  create_delete_trigger,
};
