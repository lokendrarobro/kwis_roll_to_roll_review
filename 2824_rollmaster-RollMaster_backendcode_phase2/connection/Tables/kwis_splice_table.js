const create_kwis_splice_table_table = `CREATE TABLE IF NOT EXISTS kwis_splice_table (
    splice_id INT AUTO_INCREMENT,
    robro_roll_id BIGINT,
    splice_start_meter FLOAT,
    splice_end_meter FLOAT,
    splice_note TEXT,
    splice_status TINYINT,
    splice_meter FLOAT,
    PRIMARY KEY (splice_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_splice_status (splice_status),
    INDEX idx_splice_range (splice_start_meter, splice_end_meter)
);`;

const create_kwis_splice_table_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_splice_table_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    splice_id INT NOT NULL COMMENT 'kwis_splice_table(splice_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL DEFAULT 'PENDING',
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_splice_table_insert
AFTER INSERT ON kwis_splice_table
FOR EACH ROW
BEGIN
    INSERT INTO kwis_splice_table_sync_log (splice_id, operation_type, status)
    VALUES (NEW.splice_id, 'INSERT', 'PENDING');
END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_splice_table_update
AFTER UPDATE ON kwis_splice_table
FOR EACH ROW
BEGIN
    INSERT INTO kwis_splice_table_sync_log (splice_id, operation_type, status)
    VALUES (NEW.splice_id, 'UPDATE', 'PENDING');
END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_splice_table_delete
AFTER DELETE ON kwis_splice_table
FOR EACH ROW
BEGIN
    INSERT INTO kwis_splice_table_sync_log (splice_id, operation_type, status)
    VALUES (OLD.splice_id, 'DELETE', 'PENDING');
END;`;

module.exports = {
    create_kwis_splice_table_table,
    create_kwis_splice_table_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger,
};
