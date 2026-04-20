const create_kwis_custom_user_tag_info_table = `CREATE TABLE IF NOT EXISTS kwis_custom_user_tag_info (
    user_tag_id INT(11) AUTO_INCREMENT,
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    status TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Implement business logic; "1 = not deleted(active), 0 = deleted (soft delete)"',
    PRIMARY KEY (user_tag_id)
) `;

const create_kwis_custom_user_tag_info_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_custom_user_tag_info_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    custom_user_tag_id INT NOT NULL COMMENT 'kwis_custom_user_tag_info(user_tag_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_custom_user_tag_info_insert
    AFTER INSERT ON kwis_custom_user_tag_info
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_custom_user_tag_info_sync_log (custom_user_tag_id, operation_type, status)
        VALUES (NEW.user_tag_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_custom_user_tag_info_update
    AFTER UPDATE ON kwis_custom_user_tag_info
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_custom_user_tag_info_sync_log (custom_user_tag_id, operation_type, status)
        VALUES (NEW.user_tag_id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_custom_user_tag_info_sync_log_delete
//     AFTER DELETE ON kwis_custom_user_tag_info_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_custom_user_tag_info WHERE user_tag_id = OLD.custom_user_tag_id;
//     END;`;

module.exports = {
    create_kwis_custom_user_tag_info_table,
    create_kwis_custom_user_tag_info_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger,
};