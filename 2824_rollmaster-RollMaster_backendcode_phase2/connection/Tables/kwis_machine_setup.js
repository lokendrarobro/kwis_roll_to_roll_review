const create_kwis_machine_setup_table = `CREATE TABLE IF NOT EXISTS kwis_machine_setup (
    repair_machine_setup_id INT AUTO_INCREMENT NOT NULL,
    inspection_table_width FLOAT NOT NULL,
    splicing_offset FLOAT NOT NULL,
    repairing_offset FLOAT NOT NULL,
    jogging_offset FLOAT NOT NULL,
    user_id INT NOT NULL,
    repair_machine_id VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_by INT NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (repair_machine_setup_id),
    UNIQUE KEY uq_repair_machine_id (repair_machine_id),
    INDEX idx_user_id (user_id),
    INDEX idx_repair_machine_id (repair_machine_id),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at)
);`;

const create_kwis_machine_setup_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_machine_setup_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    repair_machine_setup_id INT NOT NULL COMMENT 'kwis_machine_setup(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE INDEX unique_body_id (repair_machine_setup_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_machine_setup_insert
    AFTER INSERT ON kwis_machine_setup
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_machine_setup_sync_log (repair_machine_setup_id, operation_type, status)
        VALUES (NEW.repair_machine_setup_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_machine_setup_update
    AFTER UPDATE ON kwis_machine_setup
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_machine_setup_sync_log (repair_machine_setup_id, operation_type, status)
        VALUES (NEW.repair_machine_setup_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_machine_setup_delete1
//       AFTER DELETE ON kwis_machine_setup_sync_log
//       FOR EACH ROW
//       BEGIN
//           DELETE FROM kwis_machine_setup WHERE repair_machine_setup_id = OLD.machine_setup_id;
//       END;`;

module.exports = {
  create_kwis_machine_setup_table,
  create_kwis_machine_setup_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
//   create_delete_trigger,
};
