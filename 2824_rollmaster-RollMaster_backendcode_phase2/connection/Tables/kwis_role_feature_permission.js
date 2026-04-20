const create_kwis_role_feature_permission_table = `CREATE TABLE IF NOT EXISTS kwis_role_feature_permission (
    role_feature_permission_id INT(11) AUTO_INCREMENT,
    feature_list_id INT NOT NULL COMMENT 'kwis_feature_list(id)',
    role_id INT NOT NULL COMMENT 'kwis_role(id)',
    PRIMARY KEY (role_feature_permission_id)
);`;

const create_kwis_role_feature_permission_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_role_feature_permission_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    role_feature_id INT NOT NULL COMMENT 'kwis_role_feature_permission(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_feature_permission_insert
    AFTER INSERT ON kwis_role_feature_permission
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_feature_permission_sync_log (role_feature_id, operation_type, status)
        VALUES (NEW.role_feature_permission_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_feature_permission_update
    AFTER UPDATE ON kwis_role_feature_permission
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_feature_permission_sync_log (role_feature_id, operation_type, status)
        VALUES (NEW.role_feature_permission_id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_feature_permission_sync_log_delete
//     AFTER DELETE ON kwis_role_feature_permission_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_role_feature_permission WHERE id = OLD.role_feature_id;
//     END;`;

module.exports = {
    create_kwis_role_feature_permission_table,
    create_kwis_role_feature_permission_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger
};