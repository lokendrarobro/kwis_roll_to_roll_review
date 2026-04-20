const create_kwis_role_modules_permission_table = `CREATE TABLE IF NOT EXISTS kwis_role_modules_permission (
    role_module_permission_id INT(11) AUTO_INCREMENT,
    module_id INT NOT NULL,
    role_id INT NOT NULL ,
    PRIMARY KEY (role_module_permission_id)
) `

const create_kwis_role_modules_permission_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_role_modules_permission_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    role_modules_id INT NOT NULL COMMENT 'kwis_role_modules_permission(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_modules_permission_insert
    AFTER INSERT ON kwis_role_modules_permission
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_modules_permission_sync_log (role_modules_id, operation_type, status)
        VALUES (NEW.role_module_permission_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_modules_permission_update
    AFTER UPDATE ON kwis_role_modules_permission
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_modules_permission_sync_log (role_modules_id, operation_type, status)
        VALUES (NEW.role_module_permission_id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_modules_permission_sync_log_delete
//     AFTER DELETE ON kwis_role_modules_permission_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_role_modules_permission WHERE role_module_permission_id = OLD.role_modules_id;
//     END;`;

module.exports = {
    create_kwis_role_modules_permission_table,
    create_kwis_role_modules_permission_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger,
};