const create_kwis_tag_settings_table = `CREATE TABLE IF NOT EXISTS kwis_tag_settings (
    tag_settings_id INT NOT NULL AUTO_INCREMENT,
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_rolls_log (robro_roll_id)',
    user_tag_id INT NOT NULL,
    PRIMARY KEY (tag_settings_id),
    INDEX idx_robro_roll_id (robro_roll_id),
    INDEX idx_user_tag_id (user_tag_id)
);`;

const create_kwis_tag_settings_sync_log_table = `CREATE TABLE IF NOT EXISTS  kwis_tag_settings_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    tag_settings_id INT NOT NULL COMMENT 'kwis_tag_settings (tag_settings_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_tag_settings_insert
    AFTER INSERT ON kwis_tag_settings
    FOR EACH ROW
    BEGIN
        INSERT INTO  kwis_tag_settings_sync_log (tag_settings_id, operation_type, status)
        VALUES (NEW.tag_settings_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_tag_settings_update
    AFTER UPDATE ON  kwis_tag_settings
    FOR EACH ROW
    BEGIN
        INSERT INTO  kwis_tag_settings_sync_log (tag_settings_id, operation_type, status)
        VALUES (NEW.tag_settings_id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_tag_settings_sync_log_delete
//     AFTER DELETE ON  kwis_tag_settings_sync_log
//     FOR EACH ROW
//     BEGIN
//         DELETE FROM  kwis_tag_settings WHERE tag_settings_id = OLD.tag_settings_id;
//     END;`;

module.exports = {
  create_kwis_tag_settings_table,
  create_kwis_tag_settings_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
//   create_delete_trigger,
};
