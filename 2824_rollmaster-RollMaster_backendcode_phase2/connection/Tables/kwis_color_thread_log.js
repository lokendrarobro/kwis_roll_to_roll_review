const create_kwis_color_thread_log_table = `CREATE TABLE IF NOT EXISTS kwis_color_thread_log(
    robro_roll_id BIGINT(20) NOT NULL,
    roll_width_id BIGINT(20) NOT NULL,
    color_thread_id BIGINT(20) NOT NULL,
    thread_location_px FLOAT NULL DEFAULT NULL,
    thread_location_mm FLOAT NULL DEFAULT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (robro_roll_id, roll_width_id, color_thread_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_roll_width_id (roll_width_id)
  );`;

const create_kwis_color_thread_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_color_thread_log_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    robro_roll_id BIGINT(20) NOT NULL,
    roll_width_id BIGINT(20) NOT NULL,
    color_thread_id BIGINT(20) NOT NULL,
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL,
    error_message VARCHAR(500) NULL,
    UNIQUE INDEX unique_roll_width_id (robro_roll_id,roll_width_id,color_thread_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_color_thread_log_insert
    AFTER INSERT ON kwis_color_thread_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_color_thread_log_sync_log (robro_roll_id, roll_width_id, color_thread_id, operation_type, status)
        VALUES (NEW.robro_roll_id, NEW.roll_width_id, NEW.color_thread_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_color_thread_log_update
    AFTER UPDATE ON kwis_color_thread_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_color_thread_log_sync_log (robro_roll_id, roll_width_id, color_thread_id, operation_type, status)
        VALUES (NEW.robro_roll_id, NEW.roll_width_id, NEW.color_thread_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_color_thread_log_sync_log_delete
    AFTER DELETE ON kwis_color_thread_log_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_color_thread_log WHERE robro_roll_id = OLD.robro_roll_id AND roll_width_id = OLD.roll_width_id AND color_thread_id = OLD.color_thread_id;
    END;`;

module.exports = {
    create_kwis_color_thread_log_table,
    create_kwis_color_thread_log_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    create_delete_trigger
};
