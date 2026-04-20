const create_kwis_inspection_machine_config_table = `
CREATE TABLE IF NOT EXISTS kwis_inspection_machine_config (
    id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    ip VARCHAR(100),
    port VARCHAR(10) NOT NULL DEFAULT ':8889/',
    master_machine_status TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_machine_id (id)
);
`;

const create_kwis_inspection_machine_config_sync_log_table = `
CREATE TABLE IF NOT EXISTS kwis_inspection_machine_config_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    kwis_inspection_machine_config_id INT NOT NULL COMMENT 'kwis_inspection_machine_config(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE KEY uniq_machine_op (kwis_inspection_machine_config_id, operation_type)
);
`;

const create_kwis_inspection_machine_config_insert_trigger = `
CREATE TRIGGER IF NOT EXISTS trg_kwis_inspection_machine_config_insert
AFTER INSERT ON kwis_inspection_machine_config
FOR EACH ROW
BEGIN
    INSERT INTO kwis_inspection_machine_config_sync_log
        (kwis_inspection_machine_config_id, operation_type, status)
    VALUES
        (NEW.id, 'INSERT', 'PENDING');
END;
`;


const create_kwis_inspection_machine_config_update_trigger = `
CREATE TRIGGER IF NOT EXISTS trg_kwis_inspection_machine_config_update
AFTER UPDATE ON kwis_inspection_machine_config
FOR EACH ROW
BEGIN
    INSERT INTO kwis_inspection_machine_config_sync_log
        (kwis_inspection_machine_config_id, operation_type, status)
    VALUES
        (NEW.id, 'UPDATE', 'PENDING')
    ON DUPLICATE KEY UPDATE status = 'PENDING';
END;
`;


module.exports = {
  create_kwis_inspection_machine_config_table,
  create_kwis_inspection_machine_config_sync_log_table,
  create_kwis_inspection_machine_config_insert_trigger,
  create_kwis_inspection_machine_config_update_trigger,
};
